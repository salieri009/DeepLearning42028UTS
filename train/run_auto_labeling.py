from __future__ import annotations

import argparse
import sys
from pathlib import Path

_TRAIN = Path(__file__).resolve().parent
if str(_TRAIN) not in sys.path:
    sys.path.insert(0, str(_TRAIN))

from src.data.preprocessing.auto_labeler import AutoLabeler
from src.repo_paths import repo_root

_REPO = repo_root()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Auto-label images with YOLOv8x and export YOLO txt labels."
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=_REPO / "data/raw",
        help="Root directory that contains raw data or JPG files.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=_REPO / "data/processed/auto_labels",
        help="Directory where YOLO label files will be written.",
    )
    parser.add_argument(
        "--model-path",
        type=str,
        default="yolov8x.pt",
        help="YOLO model path or Ultralytics model name.",
    )
    parser.add_argument(
        "--max-folders",
        type=int,
        default=20,
        help="Maximum number of image folders to process.",
    )
    parser.add_argument(
        "--confidence",
        type=float,
        default=0.6,
        help="Minimum confidence score to keep a detection.",
    )
    parser.add_argument(
        "--device",
        type=str,
        default="auto",
        help="Ultralytics device string, for example auto, cpu, or cuda:0.",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Inference image size.",
    )
    return parser


def _image_keys_for_folder(input_root: Path, image_paths: list[Path]) -> list[str]:
    root = input_root.resolve()
    keys: list[str] = []
    for image_path in image_paths:
        image = image_path.resolve()
        try:
            relative = image.relative_to(root)
            keys.append(relative.with_suffix("").as_posix())
        except ValueError:
            keys.append(image.with_suffix("").name)
    return keys


def main() -> int:
    args = build_parser().parse_args()

    input_root = args.input_dir.resolve()
    output_dir = args.output_dir

    if not input_root.exists():
        print(f"ERROR: input directory does not exist: {input_root}")
        return 1

    labeler = AutoLabeler(
        model_path=args.model_path,
        confidence_threshold=args.confidence,
        device=args.device,
        imgsz=args.imgsz,
    )

    folders = AutoLabeler.discover_image_folders(input_root)
    if not folders:
        print(f"ERROR: no image folders found under {input_root}")
        return 1

    selected_folders = folders[: args.max_folders]
    total_images = 0
    total_written = 0
    total_skipped = 0

    for folder in selected_folders:
        image_paths = sorted(
            path
            for path in folder.iterdir()
            if path.is_file() and path.suffix.lower() in AutoLabeler.IMAGE_EXTENSIONS
        )
        if not image_paths:
            continue

        image_keys = _image_keys_for_folder(input_root, image_paths)
        processed_images, written_boxes, skipped_boxes = labeler.write_folder_labels(
            image_paths=image_paths,
            output_dir=output_dir,
            image_keys=image_keys,
        )

        total_images += processed_images
        total_written += written_boxes
        total_skipped += skipped_boxes

        print(
            f"[folder] {folder} -> images={processed_images}, boxes={written_boxes}, skipped={skipped_boxes}"
        )

    print("--- Auto-labeling summary ---")
    print(f"input_root={input_root}")
    print(f"output_dir={output_dir}")
    print(f"folders_processed={len(selected_folders)}")
    print(f"images_processed={total_images}")
    print(f"boxes_written={total_written}")
    print(f"boxes_skipped={total_skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())