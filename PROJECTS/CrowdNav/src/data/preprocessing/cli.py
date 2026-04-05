"""CLI entrypoint for converting JRDB-style JSON annotations to YOLO labels."""

from __future__ import annotations

import argparse
from pathlib import Path

from .converter import write_yolo_files
from .io_utils import iter_raw_items, load_json, parse_record


def build_parser() -> argparse.ArgumentParser:
    """Build and return the command-line argument parser."""
    parser = argparse.ArgumentParser(
        description="Convert JRDB-like 2D bounding box JSON into YOLO .txt label files."
    )
    parser.add_argument("input_json", type=Path, help="Path to input JRDB annotation JSON file")
    parser.add_argument("output_dir", type=Path, help="Directory where YOLO .txt files are written")
    parser.add_argument("img_width", type=int, help="Image width in pixels")
    parser.add_argument("img_height", type=int, help="Image height in pixels")
    return parser


def _validate_dimensions(img_width: int, img_height: int) -> None:
    if img_width <= 0 or img_height <= 0:
        raise ValueError("img_width and img_height must be positive integers")


def convert(input_json: Path, output_dir: Path, img_width: int, img_height: int) -> int:
    """Run conversion and return process exit code."""
    try:
        _validate_dimensions(img_width=img_width, img_height=img_height)
    except ValueError as exc:
        print(f"ERROR: {exc}")
        return 1

    try:
        data = load_json(input_json)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}")
        return 1
    except Exception as exc:
        print(f"ERROR: Failed to read JSON: {exc}")
        return 1

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
        print(f"ERROR: {exc}")
        return 1

    print(f"Parsed records: {parsed_count}")
    print(f"Invalid items skipped: {invalid_items}")
    print(f"Degenerate boxes skipped: {skipped}")
    print(f"YOLO boxes written: {written}")
    print(f"Classes discovered: {len(label_to_id)}")

    classes_path = output_dir / "classes.txt"
    class_lines = [label for label, _ in sorted(label_to_id.items(), key=lambda pair: pair[1])]
    classes_path.write_text("\n".join(class_lines) + ("\n" if class_lines else ""), encoding="utf-8")

    print(f"Class mapping file: {classes_path}")
    return 0


def main() -> int:
    """Parse arguments and execute conversion."""
    args = build_parser().parse_args()
    return convert(
        input_json=args.input_json,
        output_dir=args.output_dir,
        img_width=args.img_width,
        img_height=args.img_height,
    )


if __name__ == "__main__":
    raise SystemExit(main())
