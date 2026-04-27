"""YOLOv8 pseudo-labeling pipeline entry-point.

Provides ``run()`` as the official programmatic API.  The heavy lifting is
performed by ``src.data.pseudo_label_yolov8.main()`` to preserve backward
compatibility while the ``prepare`` package serves as the canonical import
location.
"""

from __future__ import annotations

from pathlib import Path
from typing import Sequence


def run(
    *,
    model: str = "yolov8m.pt",
    src_dir: Path = Path("data/raw/images"),
    out_dir: Path = Path("data/processed/labels"),
    conf_thresh: float = 0.4,
    manual_thresh: float = 0.6,
    device: str = "cuda",
    debug: bool = False,
    debug_dir: Path = Path("data/processed/debug_previews"),
    no_clearml: bool = False,
    checkpoint_path: Path | None = None,
    checkpoint_interval: int = 500,
    max_images: int = 0,
    overwrite_existing: bool = False,
    imgsz: int = 640,
    iou: float = 0.7,
    augment: bool = False,
    extra_argv: Sequence[str] = (),
) -> int:
    """Run the pseudo-labeling pipeline programmatically.

    Constructs an ``argv`` list and delegates to the existing ``main()``
    in ``pseudo_label_yolov8`` so that ClearML, checkpointing, and all
    other behaviour is preserved unchanged.

    Returns the process exit code (0 on success).
    """
    import sys

    argv: list[str] = [
        "--model", model,
        "--src-dir", str(src_dir),
        "--out-dir", str(out_dir),
        "--conf-thresh", str(conf_thresh),
        "--manual-thresh", str(manual_thresh),
        "--device", device,
        "--checkpoint-interval", str(checkpoint_interval),
        "--imgsz", str(imgsz),
        "--iou", str(iou),
    ]
    if augment:
        argv.append("--augment")
    if debug:
        argv += ["--debug", "--debug-dir", str(debug_dir)]
    if no_clearml:
        argv.append("--no-clearml")
    if checkpoint_path is not None:
        argv += ["--checkpoint-path", str(checkpoint_path)]
    if max_images > 0:
        argv += ["--max-images", str(max_images)]
    if overwrite_existing:
        argv.append("--overwrite-existing")
    argv.extend(extra_argv)

    from ..pseudo_label_yolov8 import build_parser, main as _legacy_main

    old_argv = sys.argv
    try:
        sys.argv = ["pseudo_label"] + argv
        _legacy_main()
        return 0
    except SystemExit as exc:
        return int(exc.code) if exc.code is not None else 0
    finally:
        sys.argv = old_argv


__all__ = ["run"]
