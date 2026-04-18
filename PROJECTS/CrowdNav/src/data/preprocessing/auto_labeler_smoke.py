"""Local smoke test for the auto-labeling pipeline."""

from __future__ import annotations

import argparse
import tempfile
from dataclasses import dataclass
from pathlib import Path

from .auto_labeler import AutoLabeler


class _TensorLike(list[float]):
    def tolist(self) -> list[float]:
        return list(self)


@dataclass
class _FakeDetection:
    conf: list[float]
    cls: list[float]
    xyxy: list[_TensorLike]


@dataclass
class _FakeResult:
    orig_shape: tuple[int, int]
    boxes: list[_FakeDetection]


class _FakeYOLOModel:
    def predict(self, source: str, **kwargs):  # noqa: D401 - ultralytics-style API
        _ = kwargs
        _ = source
        result = _FakeResult(
            orig_shape=(720, 1280),
            boxes=[
                _FakeDetection(
                    conf=[0.92],
                    cls=[0.0],
                    xyxy=[_TensorLike([100.0, 120.0, 300.0, 600.0])],
                ),
                _FakeDetection(
                    conf=[0.55],
                    cls=[0.0],
                    xyxy=[_TensorLike([400.0, 150.0, 520.0, 500.0])],
                ),
            ],
        )
        return [result]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run a local auto-labeling smoke test.")
    parser.add_argument("--input-dir", type=Path, default=Path("data/raw"))
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Directory for label outputs. Defaults to a temporary directory.",
    )
    parser.add_argument("--max-folders", type=int, default=1)
    return parser


def main() -> int:
    args = build_parser().parse_args()

    if not args.input_dir.exists():
        print(f"ERROR: input directory does not exist: {args.input_dir}")
        return 1

    labeler = AutoLabeler(model=_FakeYOLOModel())
    folders = AutoLabeler.discover_image_folders(args.input_dir)
    if not folders:
        print(f"ERROR: no image folders found under {args.input_dir}")
        return 1

    selected_folders = folders[: args.max_folders]
    total_images = 0
    total_boxes = 0

    tmp_dir_manager = tempfile.TemporaryDirectory() if args.output_dir is None else None
    output_root = Path(tmp_dir_manager.name) / "labels" if tmp_dir_manager is not None else args.output_dir

    try:
        for folder in selected_folders:
            image_paths = sorted(
                path
                for path in folder.iterdir()
                if path.is_file() and path.suffix.lower() == ".jpg"
            )
            if not image_paths:
                continue

            image_keys = [path.with_suffix("").as_posix().replace(":", "_") for path in image_paths]
            processed_images, written_boxes, _ = labeler.write_folder_labels(
                image_paths=image_paths,
                output_dir=output_root,
                image_keys=image_keys,
            )
            total_images += processed_images
            total_boxes += written_boxes
            print(f"[smoke] {folder} -> images={processed_images}, boxes={written_boxes}")

        print("--- Smoke summary ---")
        print(f"input_dir={args.input_dir}")
        print(f"folders_processed={len(selected_folders)}")
        print(f"images_processed={total_images}")
        print(f"boxes_written={total_boxes}")
        print(f"output_dir={output_root}")
    finally:
        if tmp_dir_manager is not None:
            tmp_dir_manager.cleanup()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())