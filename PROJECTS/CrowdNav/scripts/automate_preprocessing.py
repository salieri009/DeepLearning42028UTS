"""Batch JRDB->YOLO automation with optional DVC sync and output validation."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
REPO_ROOT = Path(__file__).resolve().parents[1]
METRIC_PATTERNS = {
    "parsed": re.compile(r"^Parsed records:\s*(\d+)\s*$", re.MULTILINE),
    "invalid": re.compile(r"^Invalid items skipped:\s*(\d+)\s*$", re.MULTILINE),
    "degenerate": re.compile(r"^Degenerate boxes skipped:\s*(\d+)\s*$", re.MULTILINE),
    "written": re.compile(r"^YOLO boxes written:\s*(\d+)\s*$", re.MULTILINE),
    "classes": re.compile(r"^Classes discovered:\s*(\d+)\s*$", re.MULTILINE),
    "classes_path": re.compile(r"^Class mapping file:\s*(.+?)\s*$", re.MULTILINE),
}


@dataclass
class ConversionResult:
    json_path: Path
    output_dir: Path
    returncode: int
    stdout: str
    stderr: str
    parsed: int | None = None
    invalid: int | None = None
    degenerate: int | None = None
    written: int | None = None
    classes: int | None = None
    classes_path: str | None = None
    parse_ok: bool = False
    classes_ok: bool = False
    labels_count: int = 0
    status: str = "unknown"


@dataclass
class Config:
    json_dir: Path
    images_dir: Path
    output_root: Path
    img_width: int
    img_height: int
    pattern: str
    recursive: bool
    split_output_per_json: bool
    use_dvc_pull: bool
    continue_on_dvc_failure: bool
    fail_fast: bool
    dry_run: bool


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Run DVC pull, batch-convert JRDB JSON files to YOLO labels, "
            "and validate output labels against source images."
        )
    )
    parser.add_argument("json_dir", type=Path, help="Directory containing annotation JSON files")
    parser.add_argument("images_dir", type=Path, help="Directory containing source image files")
    parser.add_argument("output_root", type=Path, help="Directory where YOLO label outputs are written")
    parser.add_argument("img_width", type=int, help="Image width in pixels")
    parser.add_argument("img_height", type=int, help="Image height in pixels")
    parser.add_argument(
        "--pattern",
        default="*.json",
        help="Glob pattern for JSON files (default: *.json)",
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        help="Recursively search JSON and image directories",
    )
    parser.add_argument(
        "--flat-output",
        action="store_true",
        help="Write all outputs into one directory instead of per-JSON subdirectories",
    )
    parser.add_argument(
        "--skip-dvc-pull",
        action="store_true",
        help="Skip running dvc pull before conversion",
    )
    parser.add_argument(
        "--continue-on-dvc-failure",
        action="store_true",
        help="Continue conversion even if dvc pull fails",
    )
    parser.add_argument(
        "--fail-fast",
        action="store_true",
        help="Stop batch as soon as a file fails conversion or validation",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print planned actions without executing conversions",
    )
    return parser


def validate_dimensions(img_width: int, img_height: int) -> None:
    if img_width <= 0 or img_height <= 0:
        raise ValueError("img_width and img_height must be positive integers")


def collect_json_files(json_dir: Path, pattern: str, recursive: bool) -> list[Path]:
    if not json_dir.exists() or not json_dir.is_dir():
        raise FileNotFoundError(f"JSON directory not found: {json_dir}")
    iterator = json_dir.rglob(pattern) if recursive else json_dir.glob(pattern)
    return sorted(path for path in iterator if path.is_file())


def collect_image_stems(images_dir: Path, recursive: bool) -> set[str]:
    if not images_dir.exists() or not images_dir.is_dir():
        raise FileNotFoundError(f"Images directory not found: {images_dir}")

    iterator = images_dir.rglob("*") if recursive else images_dir.glob("*")
    stems: set[str] = set()
    for path in iterator:
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            stems.add(path.stem)
    return stems


def run_dvc_pull() -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["dvc", "pull"],
        capture_output=True,
        text=True,
        check=False,
        cwd=REPO_ROOT,
    )


def parse_metrics(stdout: str) -> dict[str, int | str | None]:
    parsed: dict[str, int | str | None] = {}
    for key, pattern in METRIC_PATTERNS.items():
        match = pattern.search(stdout)
        if not match:
            parsed[key] = None
            continue
        value = match.group(1).strip()
        if key == "classes_path":
            parsed[key] = value
        else:
            parsed[key] = int(value)
    return parsed


def resolve_output_dir(output_root: Path, json_path: Path, split_output_per_json: bool) -> Path:
    if split_output_per_json:
        return output_root / json_path.stem
    return output_root


def run_conversion(json_path: Path, output_dir: Path, img_width: int, img_height: int) -> ConversionResult:
    command = [
        sys.executable,
        "-m",
        "src.data.jrdb_to_yolo",
        str(json_path),
        str(output_dir),
        str(img_width),
        str(img_height),
    ]
    process = subprocess.run(command, capture_output=True, text=True, check=False, cwd=REPO_ROOT)

    metrics = parse_metrics(process.stdout)

    return ConversionResult(
        json_path=json_path,
        output_dir=output_dir,
        returncode=process.returncode,
        stdout=process.stdout,
        stderr=process.stderr,
        parsed=metrics["parsed"],
        invalid=metrics["invalid"],
        degenerate=metrics["degenerate"],
        written=metrics["written"],
        classes=metrics["classes"],
        classes_path=metrics["classes_path"],
        parse_ok=all(metrics[key] is not None for key in ("parsed", "invalid", "degenerate", "written", "classes", "classes_path")),
    )


def validate_output(result: ConversionResult) -> None:
    classes_path = result.output_dir / "classes.txt"
    result.classes_ok = classes_path.exists() and classes_path.is_file() and classes_path.stat().st_size > 0

    label_files = sorted(
        path
        for path in result.output_dir.glob("*.txt")
        if path.name.lower() != "classes.txt" and path.is_file()
    )

    label_stems = {path.stem for path in label_files}
    result.labels_count = len(label_stems)

    status = "success"
    if result.returncode != 0:
        status = "failed-conversion"
    elif not result.parse_ok:
        status = "failed-log-parse"
    elif not result.classes_ok:
        status = "failed-classes"
    result.status = status


def collect_label_stems(output_root: Path) -> set[str]:
    stems: set[str] = set()
    if not output_root.exists():
        return stems
    for path in output_root.rglob("*.txt"):
        if path.is_file() and path.name.lower() != "classes.txt":
            stems.add(path.stem)
    return stems


def validate_aggregate_counts(output_root: Path, image_stems: set[str]) -> tuple[int, int, int]:
    label_stems = collect_label_stems(output_root)
    missing_labels = len(image_stems - label_stems)
    orphan_labels = len(label_stems - image_stems)
    return len(label_stems), missing_labels, orphan_labels


def print_dvc_summary(proc: subprocess.CompletedProcess[str] | None) -> None:
    if proc is None:
        print("[DVC] skipped")
        return
    print(f"[DVC] returncode={proc.returncode}")
    if proc.stdout.strip():
        print("[DVC] stdout:")
        print(proc.stdout.strip())
    if proc.stderr.strip():
        print("[DVC] stderr:")
        print(proc.stderr.strip())


def print_result_summary(results: list[ConversionResult]) -> None:
    if not results:
        print("No conversion results.")
        return

    header = (
        f"{'json':36} {'status':22} {'parsed':>7} {'invalid':>8} "
        f"{'degen':>6} {'written':>7} {'labels':>7}"
    )
    print("\n=== Per-file Summary ===")
    print(header)
    print("-" * len(header))
    for result in results:
        print(
            f"{result.json_path.name[:36]:36} "
            f"{result.status:22} "
            f"{str(result.parsed):>7} "
            f"{str(result.invalid):>8} "
            f"{str(result.degenerate):>6} "
            f"{str(result.written):>7} "
            f"{result.labels_count:>7}"
        )

    total_parsed = sum(result.parsed or 0 for result in results)
    total_invalid = sum(result.invalid or 0 for result in results)
    total_degenerate = sum(result.degenerate or 0 for result in results)
    total_written = sum(result.written or 0 for result in results)

    print("\n=== Aggregate Skip Report ===")
    print(f"Parsed records total: {total_parsed}")
    print(f"Malformed/invalid items skipped total: {total_invalid}")
    print(f"Degenerate boxes skipped total: {total_degenerate}")
    print(f"YOLO boxes written total: {total_written}")

    failed = [result for result in results if result.status != "success"]
    print(f"\nOverall: {len(results) - len(failed)}/{len(results)} successful")
    if failed:
        print("Failed files:")
        for result in failed:
            print(f"- {result.json_path} ({result.status})")


def should_stop(result: ConversionResult, fail_fast: bool) -> bool:
    return fail_fast and result.status != "success"


def to_config(args: argparse.Namespace) -> Config:
    return Config(
        json_dir=args.json_dir,
        images_dir=args.images_dir,
        output_root=args.output_root,
        img_width=args.img_width,
        img_height=args.img_height,
        pattern=args.pattern,
        recursive=args.recursive,
        split_output_per_json=not args.flat_output,
        use_dvc_pull=not args.skip_dvc_pull,
        continue_on_dvc_failure=args.continue_on_dvc_failure,
        fail_fast=args.fail_fast,
        dry_run=args.dry_run,
    )


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    config = to_config(args)

    try:
        validate_dimensions(config.img_width, config.img_height)
        json_files = collect_json_files(config.json_dir, config.pattern, config.recursive)
        image_stems = collect_image_stems(config.images_dir, config.recursive)
    except Exception as exc:
        print(f"ERROR: {exc}")
        return 1

    if not json_files:
        print(f"ERROR: no JSON files found in {config.json_dir} with pattern '{config.pattern}'")
        return 1

    if not image_stems:
        print(f"ERROR: no image files found in {config.images_dir}")
        return 1

    print(f"JSON files discovered: {len(json_files)}")
    print(f"Image files discovered: {len(image_stems)}")
    print(f"Output root: {config.output_root}")
    print(f"Output mode: {'per-json subdirectory' if config.split_output_per_json else 'flat'}")

    dvc_result: subprocess.CompletedProcess[str] | None = None
    if config.use_dvc_pull and not config.dry_run:
        dvc_result = run_dvc_pull()
        if dvc_result.returncode != 0 and not config.continue_on_dvc_failure:
            print_dvc_summary(dvc_result)
            print("ERROR: dvc pull failed; use --continue-on-dvc-failure to proceed anyway")
            return 1

    if config.dry_run:
        print("\nDry run mode: planned conversions")
        for json_path in json_files:
            output_dir = resolve_output_dir(config.output_root, json_path, config.split_output_per_json)
            print(f"- {json_path} -> {output_dir}")
        return 0

    config.output_root.mkdir(parents=True, exist_ok=True)
    print_dvc_summary(dvc_result)

    results: list[ConversionResult] = []
    for json_path in json_files:
        output_dir = resolve_output_dir(config.output_root, json_path, config.split_output_per_json)
        output_dir.mkdir(parents=True, exist_ok=True)

        result = run_conversion(
            json_path=json_path,
            output_dir=output_dir,
            img_width=config.img_width,
            img_height=config.img_height,
        )
        validate_output(result=result)

        results.append(result)

        print(f"\n[{json_path.name}] status={result.status}")
        if result.stdout.strip():
            print(result.stdout.strip())
        if result.stderr.strip():
            print(result.stderr.strip())

        if should_stop(result, config.fail_fast):
            print("Fail-fast enabled: stopping batch execution.")
            break

    total_label_files, missing_labels, orphan_labels = validate_aggregate_counts(config.output_root, image_stems)
    print("\n=== Aggregate Validation ===")
    print(f"Label files found: {total_label_files}")
    print(f"Image files found: {len(image_stems)}")
    print(f"Missing labels: {missing_labels}")
    print(f"Orphan labels: {orphan_labels}")

    print_result_summary(results)

    has_failure = any(result.status != "success" for result in results)
    if missing_labels > 0 or orphan_labels > 0:
        has_failure = True
    return 1 if has_failure else 0


if __name__ == "__main__":
    raise SystemExit(main())
