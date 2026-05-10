"""Batch JRDB -> YOLO label automation with output validation.

This script orchestrates batch conversion of JRDB-style JSON annotation files
into YOLO .txt label files, then validates label/image pair consistency.

Actual data paths for this project:
  json_dir   : data/raw/images/image_0  (or image_2)
  images_dir : data/raw/images/image_0  (or image_2)
  output_root: data/processed/labels

Typical usage:
  python scripts/automate_preprocessing.py \\
    data/raw/images/image_0 \\
    data/raw/images/image_0 \\
    data/processed/labels \\
    1920 1080 \\
    --recursive --skip-dvc-pull

Note: DVC is currently not active. Use --skip-dvc-pull for local runs.
For pseudo-labeling (model-generated labels without JSON annotations),
use src/data/pseudo_label_yolov8.py instead.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from dataclasses import asdict, dataclass
from pathlib import Path

# `crowdnav-train` is installed via `pip install -e ./train` (see ADR-0010).
# `src.*` packages resolve without sys.path manipulation.
from src.data.preprocessing.cli import ConversionSummary, convert

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
REPO_ROOT = Path(__file__).resolve().parents[1]


@dataclass
class ConversionResult:
    """Result of one JSON file conversion, combining the structured summary
    from ``src.data.preprocessing.cli.convert()`` with output validation."""

    json_path: Path
    output_dir: Path
    summary: ConversionSummary
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
    allow_duplicate_stems: bool
    validation_only: bool
    fail_fast: bool
    dry_run: bool


@dataclass
class ImageInventory:
    files_count: int
    unique_stems: set[str]
    duplicate_stems: dict[str, list[str]]


@dataclass
class LabelInventory:
    files_count: int
    unique_stems: set[str]
    duplicate_stems: dict[str, int]


@dataclass
class AggregateValidation:
    image_files_count: int
    image_unique_stems_count: int
    label_files_count: int
    label_unique_stems_count: int
    classes_file_count: int
    classes_file_present: bool
    missing_labels: int
    orphan_labels: int
    duplicate_image_stems: int
    duplicate_label_stems: int


def build_parser() -> argparse.ArgumentParser:
    """Build and return the CLI argument parser.

    Positional arguments:
      json_dir    -- Directory containing JRDB JSON annotation files.
      images_dir  -- Directory containing corresponding source images.
      output_root -- Where YOLO .txt label files will be written.
      img_width   -- Image width in pixels (JRDB: 1920).
      img_height  -- Image height in pixels (JRDB: 1080).
    """
    parser = argparse.ArgumentParser(
        description=(
            "Run DVC pull (optional), batch-convert JRDB JSON files to YOLO labels, "
            "and validate output labels against source images. "
            "DVC is currently inactive; use --skip-dvc-pull for local runs."
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
        "--allow-duplicate-stems",
        action="store_true",
        help="Allow repeated image or label stems across directories",
    )
    parser.add_argument(
        "--validation-only",
        action="store_true",
        help="Skip conversion and only validate existing labels against images",
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
    """Raise ValueError if image dimensions are not positive integers."""
    if img_width <= 0 or img_height <= 0:
        raise ValueError("img_width and img_height must be positive integers")


def collect_json_files(json_dir: Path, pattern: str, recursive: bool) -> list[Path]:
    """Collect all JSON annotation files matching *pattern* under *json_dir*."""
    if not json_dir.exists() or not json_dir.is_dir():
        raise FileNotFoundError(f"JSON directory not found: {json_dir}")
    iterator = json_dir.rglob(pattern) if recursive else json_dir.glob(pattern)
    return sorted(path for path in iterator if path.is_file())


def collect_image_inventory(images_dir: Path, recursive: bool) -> ImageInventory:
    """Scan *images_dir* for image files and detect stem duplicates."""
    if not images_dir.exists() or not images_dir.is_dir():
        raise FileNotFoundError(f"Images directory not found: {images_dir}")

    iterator = images_dir.rglob("*") if recursive else images_dir.glob("*")
    files_count = 0
    stem_to_paths: dict[str, list[str]] = {}
    for path in iterator:
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            files_count += 1
            stem_to_paths.setdefault(path.stem, []).append(path.relative_to(images_dir).as_posix())

    duplicate_stems = {
        stem: sorted(paths)
        for stem, paths in stem_to_paths.items()
        if len(paths) > 1
    }
    return ImageInventory(
        files_count=files_count,
        unique_stems=set(stem_to_paths),
        duplicate_stems=duplicate_stems,
    )


def run_dvc_pull() -> subprocess.CompletedProcess[str]:
    """Execute ``dvc pull`` at the repository root."""
    return subprocess.run(
        ["dvc", "pull"],
        capture_output=True,
        text=True,
        check=False,
        cwd=REPO_ROOT,
    )


def resolve_output_dir(output_root: Path, json_path: Path, split_output_per_json: bool) -> Path:
    """Resolve the per-file output directory."""
    if split_output_per_json:
        return output_root / json_path.stem
    return output_root


def run_conversion(json_path: Path, output_dir: Path, img_width: int, img_height: int) -> ConversionResult:
    """Convert one JSON file by calling ``src.data.preprocessing.cli.convert()`` directly.

    This replaces the previous subprocess + stdout-regex approach with a
    structured function call, eliminating the fragile text-parsing coupling.
    """
    summary = convert(
        input_json=json_path,
        output_dir=output_dir,
        img_width=img_width,
        img_height=img_height,
        quiet=True,
    )

    return ConversionResult(
        json_path=json_path,
        output_dir=output_dir,
        summary=summary,
    )


def validate_output(result: ConversionResult) -> None:
    """Validate conversion output (classes.txt presence, label count)."""
    classes_path = result.output_dir / "classes.txt"
    result.classes_ok = classes_path.exists() and classes_path.is_file() and classes_path.stat().st_size > 0

    label_files = sorted(
        path
        for path in result.output_dir.glob("*.txt")
        if path.name.lower() != "classes.txt" and path.is_file()
    )
    result.labels_count = len({path.stem for path in label_files})

    status = "success"
    if result.summary.exit_code != 0:
        status = "failed-conversion"
    elif not result.classes_ok:
        status = "failed-classes"
    result.status = status


def collect_label_inventory(output_root: Path) -> LabelInventory:
    """Scan *output_root* for YOLO label files and detect duplicates."""
    if not output_root.exists():
        return LabelInventory(files_count=0, unique_stems=set(), duplicate_stems={})

    files_count = 0
    stem_counts: dict[str, int] = {}
    unique_stems: set[str] = set()
    for path in output_root.rglob("*.txt"):
        if path.is_file() and path.name.lower() != "classes.txt":
            files_count += 1
            unique_stems.add(path.stem)
            stem_counts[path.stem] = stem_counts.get(path.stem, 0) + 1

    duplicate_stems = {stem: count for stem, count in stem_counts.items() if count > 1}
    return LabelInventory(
        files_count=files_count,
        unique_stems=unique_stems,
        duplicate_stems=duplicate_stems,
    )


def validate_aggregate_counts(output_root: Path, image_inventory: ImageInventory) -> tuple[LabelInventory, AggregateValidation]:
    """Cross-validate label and image inventories to find gaps."""
    label_inventory = collect_label_inventory(output_root)
    classes_file_count = sum(1 for path in output_root.rglob("classes.txt") if path.is_file()) if output_root.exists() else 0
    validation = AggregateValidation(
        image_files_count=image_inventory.files_count,
        image_unique_stems_count=len(image_inventory.unique_stems),
        label_files_count=label_inventory.files_count,
        label_unique_stems_count=len(label_inventory.unique_stems),
        classes_file_count=classes_file_count,
        classes_file_present=classes_file_count > 0,
        missing_labels=len(image_inventory.unique_stems - label_inventory.unique_stems),
        orphan_labels=len(label_inventory.unique_stems - image_inventory.unique_stems),
        duplicate_image_stems=len(image_inventory.duplicate_stems),
        duplicate_label_stems=len(label_inventory.duplicate_stems),
    )
    return label_inventory, validation


def print_dvc_summary(proc: subprocess.CompletedProcess[str] | None) -> None:
    """Print DVC pull outcome."""
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
    """Print a per-file and aggregate summary table."""
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
        s = result.summary
        print(
            f"{result.json_path.name[:36]:36} "
            f"{result.status:22} "
            f"{s.parsed:>7} "
            f"{s.invalid:>8} "
            f"{s.degenerate:>6} "
            f"{s.written:>7} "
            f"{result.labels_count:>7}"
        )

    total_parsed = sum(r.summary.parsed for r in results)
    total_invalid = sum(r.summary.invalid for r in results)
    total_degenerate = sum(r.summary.degenerate for r in results)
    total_written = sum(r.summary.written for r in results)

    print("\n=== Aggregate Skip Report ===")
    print(f"Parsed records total: {total_parsed}")
    print(f"Malformed/invalid items skipped total: {total_invalid}")
    print(f"Degenerate boxes skipped total: {total_degenerate}")
    print(f"YOLO boxes written total: {total_written}")

    failed = [r for r in results if r.status != "success"]
    print(f"\nOverall: {len(results) - len(failed)}/{len(results)} successful")
    if failed:
        print("Failed files:")
        for r in failed:
            print(f"- {r.json_path} ({r.status})")


def write_report(
    report_path: Path,
    config: Config,
    json_files: list[Path],
    image_inventory: ImageInventory,
    label_inventory: LabelInventory,
    validation: AggregateValidation,
    dvc_result: subprocess.CompletedProcess[str] | None,
    results: list[ConversionResult],
    exit_code: int,
) -> None:
    """Write a JSON summary report to *report_path*."""
    report_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "config": {
            "json_dir": str(config.json_dir),
            "images_dir": str(config.images_dir),
            "output_root": str(config.output_root),
            "img_width": config.img_width,
            "img_height": config.img_height,
            "pattern": config.pattern,
            "recursive": config.recursive,
            "split_output_per_json": config.split_output_per_json,
            "use_dvc_pull": config.use_dvc_pull,
            "continue_on_dvc_failure": config.continue_on_dvc_failure,
            "allow_duplicate_stems": config.allow_duplicate_stems,
            "fail_fast": config.fail_fast,
            "dry_run": config.dry_run,
        },
        "dvc": None
        if dvc_result is None
        else {
            "returncode": dvc_result.returncode,
            "stdout": dvc_result.stdout,
            "stderr": dvc_result.stderr,
        },
        "inputs": {
            "json_files": [str(path) for path in json_files],
            "json_file_count": len(json_files),
            "image_file_count": image_inventory.files_count,
            "image_unique_stem_count": len(image_inventory.unique_stems),
            "image_duplicate_stems": image_inventory.duplicate_stems,
        },
        "labels": {
            "label_file_count": label_inventory.files_count,
            "label_unique_stem_count": len(label_inventory.unique_stems),
            "label_duplicate_stems": label_inventory.duplicate_stems,
        },
        "validation_only": config.validation_only,
        "validation": asdict(validation),
        "results": [
            {
                "json_path": str(r.json_path),
                "output_dir": str(r.output_dir),
                "summary": asdict(r.summary),
                "classes_ok": r.classes_ok,
                "labels_count": r.labels_count,
                "status": r.status,
            }
            for r in results
        ],
        "exit_code": exit_code,
    }
    report_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Report written: {report_path}")


def should_stop(result: ConversionResult, fail_fast: bool) -> bool:
    """Return True if processing should halt after a failure."""
    return fail_fast and result.status != "success"


def to_config(args: argparse.Namespace) -> Config:
    """Map parsed CLI arguments to a ``Config`` dataclass."""
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
        allow_duplicate_stems=args.allow_duplicate_stems,
        validation_only=args.validation_only,
        fail_fast=args.fail_fast,
        dry_run=args.dry_run,
    )


def main() -> int:
    """Entry point for batch JRDB-to-YOLO conversion.

    Workflow:
      1. (Optional) Run DVC pull to fetch raw data.
      2. Discover JSON annotation files under json_dir.
      3. Run YOLO conversion for each JSON via ``src.data.preprocessing.cli.convert()``.
      4. Validate that output label files match source images.
      5. Write a JSON summary report to output_root/preprocessing_report.json.

    Returns 0 on full success, 1 if any file failed or validation issues found.
    """
    parser = build_parser()
    args = parser.parse_args()
    config = to_config(args)

    try:
        validate_dimensions(config.img_width, config.img_height)
        json_files = collect_json_files(config.json_dir, config.pattern, config.recursive)
        image_inventory = collect_image_inventory(config.images_dir, config.recursive)
    except Exception as exc:
        print(f"ERROR: {exc}")
        return 1

    if not json_files and not config.validation_only:
        print(f"ERROR: no JSON files found in {config.json_dir} with pattern '{config.pattern}'")
        return 1

    if image_inventory.files_count <= 0:
        print(f"ERROR: no image files found in {config.images_dir}")
        return 1

    print(f"JSON files discovered: {len(json_files)}")
    print(f"Image files discovered: {image_inventory.files_count}")
    print(f"Output root: {config.output_root}")
    print(f"Output mode: {'per-json subdirectory' if config.split_output_per_json else 'flat'}")
    if config.validation_only:
        print("Validation mode: enabled")

    if image_inventory.duplicate_stems and not config.allow_duplicate_stems:
        print("ERROR: duplicate image stems found. Use --allow-duplicate-stems to proceed.")
        for stem, paths in image_inventory.duplicate_stems.items():
            print(f"- {stem}: {', '.join(paths)}")
        return 1

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
    if not config.validation_only:
        for json_path in json_files:
            output_dir = resolve_output_dir(config.output_root, json_path, config.split_output_per_json)
            output_dir.mkdir(parents=True, exist_ok=True)

            result = run_conversion(
                json_path=json_path,
                output_dir=output_dir,
                img_width=config.img_width,
                img_height=config.img_height,
            )
            validate_output(result)
            results.append(result)

            s = result.summary
            print(
                f"\n[{json_path.name}] status={result.status} | "
                f"parsed={s.parsed} written={s.written} invalid={s.invalid} degenerate={s.degenerate}"
            )

            if should_stop(result, config.fail_fast):
                print("Fail-fast enabled: stopping batch execution.")
                break

    label_inventory, validation = validate_aggregate_counts(config.output_root, image_inventory)
    print("\n=== Aggregate Validation ===")
    print(f"Label files found: {label_inventory.files_count}")
    print(f"Image files found: {validation.image_files_count}")
    print(f"Unique image stems: {validation.image_unique_stems_count}")
    print(f"Unique label stems: {validation.label_unique_stems_count}")
    print(f"Classes.txt files found: {validation.classes_file_count}")
    print(f"Missing labels: {validation.missing_labels}")
    print(f"Orphan labels: {validation.orphan_labels}")
    print(f"Duplicate image stems: {validation.duplicate_image_stems}")
    print(f"Duplicate label stems: {validation.duplicate_label_stems}")

    print_result_summary(results)

    has_failure = any(r.status != "success" for r in results)
    if not validation.classes_file_present:
        has_failure = True
    if validation.missing_labels > 0 or validation.orphan_labels > 0:
        has_failure = True
    if (validation.duplicate_image_stems > 0 or validation.duplicate_label_stems > 0) and not config.allow_duplicate_stems:
        has_failure = True

    write_report(
        report_path=config.output_root / "preprocessing_report.json",
        config=config,
        json_files=json_files,
        image_inventory=image_inventory,
        label_inventory=label_inventory,
        validation=validation,
        dvc_result=dvc_result,
        results=results,
        exit_code=1 if has_failure else 0,
    )

    return 1 if has_failure else 0


if __name__ == "__main__":
    raise SystemExit(main())
