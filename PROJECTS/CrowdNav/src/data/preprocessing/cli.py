"""CLI entrypoint for JRDB-to-YOLO label conversion."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path

from ..formats.dataset_config import write_classes_txt_from_label_map
from .converter import write_yolo_files
from .io_utils import iter_raw_items, load_json, parse_record


@dataclass
class ConversionSummary:
    """Structured result returned by ``convert()`` for programmatic consumption."""

    parsed: int
    invalid: int
    degenerate: int
    written: int
    classes_discovered: int
    classes_path: str
    exit_code: int


def build_parser() -> argparse.ArgumentParser:
    """Build and return the command-line argument parser."""
    parser = argparse.ArgumentParser(
        description="Convert JRDB-like 2D bounding box JSON into YOLO .txt label files."
    )
    parser.add_argument(
        "input_json", type=Path, help="Path to input JRDB annotation JSON file"
    )
    parser.add_argument(
        "output_dir", type=Path, help="Directory where YOLO .txt files are written"
    )
    parser.add_argument("img_width", type=int, help="Image width in pixels")
    parser.add_argument("img_height", type=int, help="Image height in pixels")
    parser.add_argument(
        "--summary-json",
        type=Path,
        default=None,
        help="Optional path to write a JSON summary of conversion metrics",
    )
    return parser


def _validate_dimensions(img_width: int, img_height: int) -> None:
    if img_width <= 0 or img_height <= 0:
        raise ValueError("img_width and img_height must be positive integers")


def convert(
    input_json: Path,
    output_dir: Path,
    img_width: int,
    img_height: int,
    *,
    summary_json: Path | None = None,
    quiet: bool = False,
) -> ConversionSummary:
    """Run JRDB JSON → YOLO conversion and return a structured summary.

    When *quiet* is False (default), human-readable progress is also printed
    to stdout for backward compatibility with existing CLI usage.
    """
    try:
        _validate_dimensions(img_width=img_width, img_height=img_height)
    except ValueError as exc:
        if not quiet:
            print(f"ERROR: {exc}")
        return ConversionSummary(0, 0, 0, 0, 0, "", exit_code=1)

    try:
        data = load_json(input_json)
    except FileNotFoundError as exc:
        if not quiet:
            print(f"ERROR: {exc}")
        return ConversionSummary(0, 0, 0, 0, 0, "", exit_code=1)
    except Exception as exc:
        if not quiet:
            print(f"ERROR: Failed to read JSON: {exc}")
        return ConversionSummary(0, 0, 0, 0, 0, "", exit_code=1)

    label_to_id: dict[str, int] = {}
    invalid_items = 0
    parsed_count = 0

    def record_stream():
        nonlocal invalid_items, parsed_count
        for index, raw_item in enumerate(iter_raw_items(data), start=1):
            record = parse_record(raw_item, fallback_index=index)
            if record is None:
                invalid_items += 1
                continue
            parsed_count += 1
            class_id = label_to_id.setdefault(record.class_name, len(label_to_id))
            yield record, class_id

    try:
        written, skipped = write_yolo_files(
            records=record_stream(),
            output_dir=output_dir,
            img_width=img_width,
            img_height=img_height,
        )
    except (NotADirectoryError, OSError) as exc:
        if not quiet:
            print(f"ERROR: {exc}")
        return ConversionSummary(0, 0, 0, 0, 0, "", exit_code=1)

    classes_path = write_classes_txt_from_label_map(output_dir, label_to_id)

    summary = ConversionSummary(
        parsed=parsed_count,
        invalid=invalid_items,
        degenerate=skipped,
        written=written,
        classes_discovered=len(label_to_id),
        classes_path=str(classes_path),
        exit_code=0,
    )

    if not quiet:
        print(f"Parsed records: {summary.parsed}")
        print(f"Invalid items skipped: {summary.invalid}")
        print(f"Degenerate boxes skipped: {summary.degenerate}")
        print(f"YOLO boxes written: {summary.written}")
        print(f"Classes discovered: {summary.classes_discovered}")
        print(f"Class mapping file: {summary.classes_path}")

    if summary_json is not None:
        summary_json.parent.mkdir(parents=True, exist_ok=True)
        summary_json.write_text(
            json.dumps(asdict(summary), indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    return summary


def main() -> int:
    """Parse arguments and execute conversion."""
    args = build_parser().parse_args()
    summary = convert(
        input_json=args.input_json,
        output_dir=args.output_dir,
        img_width=args.img_width,
        img_height=args.img_height,
        summary_json=args.summary_json,
    )
    return summary.exit_code


if __name__ == "__main__":
    raise SystemExit(main())
