"""CLI for training and validating the CrowdNav YOLO model."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any

# `crowdnav-train` is installed via `pip install -e ./train` (see ADR-0010).
# `src.*` packages resolve without sys.path manipulation.
from src.repo_paths import default_data_yaml, repo_root
from src.training import (
    TrainPipeline,
    default_model_path,
    describe_runtime,
    resolve_training_device,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Train the CrowdNav YOLO model from a YOLO data.yaml file.")
    parser.add_argument(
        "--model-cfg",
        default=default_model_path(),
        help="Base model path or Ultralytics model name (default: local yolov8m.pt or yolov8m)",
    )
    parser.add_argument(
        "--data-yaml",
        default=None,
        type=Path,
        help=(
            "Path to YOLO data.yaml (default: CROWDNAV_DATA_YAML env, else <repo>/data/processed/splits/data.yaml)"
        ),
    )
    parser.add_argument("--epochs", type=int, default=150, help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Training image size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument(
        "--device",
        default=None,
        help=(
            "Ultralytics device: cpu, 0, cuda:0, etc. "
            "If omitted: CROWDNAV_DEVICE env, else CUDA:0 if available, else cpu."
        ),
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="DataLoader workers (keep low on 16 GB system RAM, e.g. ml.g4dn.xlarge)",
    )
    parser.add_argument(
        "--project",
        default=str(repo_root() / "runs" / "train"),
        help="Ultralytics project output directory (default: <repo>/runs/train, absolute to avoid global runs_dir prefix)",
    )
    parser.add_argument("--name", default="crowdnav_yolo", help="Run name")
    parser.add_argument("--patience", type=int, default=30, help="Early stopping patience")
    parser.add_argument("--save-period", type=int, default=10, help="Save checkpoint every N epochs (Ultralytics save_period)")
    parser.add_argument("--lr0", type=float, default=0.01, help="Initial learning rate (Ultralytics default 0.01; use ~0.001 when fine-tuning from a checkpoint)")
    parser.add_argument("--lrf", type=float, default=0.01, help="Final LR as a fraction of lr0 via cosine decay (final_lr = lr0 * lrf)")
    exist_group = parser.add_mutually_exclusive_group()
    exist_group.add_argument(
        "--exist-ok",
        action="store_true",
        help="Allow reusing an existing run directory (default when neither flag is set).",
    )
    exist_group.add_argument(
        "--no-exist-ok",
        action="store_true",
        help="Fail if the run directory already exists",
    )
    parser.add_argument(
        "--export",
        default=None,
        help="Optional export format such as onnx, torchscript, or engine",
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Run validation after training",
    )
    parser.add_argument(
        "--aug-cfg",
        default=None,
        type=Path,
        help=(
            "Path to augmentation YAML override (Ultralytics format). "
            "Keys are merged into model.train() kwargs. "
            "Example: train/configs/augment_pedestrian.yaml"
        ),
    )
    return parser


def _load_aug_cfg(path: Path | None) -> dict[str, Any]:
    """Load augmentation overrides from a YAML file.

    Returns an empty dict if *path* is None.
    """
    if path is None:
        return {}
    resolved = path.expanduser().resolve()
    if not resolved.is_file():
        print(f"[CrowdNav] ERROR: aug-cfg not found: {resolved}", file=sys.stderr)
        raise SystemExit(2)
    import yaml  # soft import — yaml is bundled with ultralytics
    overrides: dict[str, Any] = yaml.safe_load(resolved.read_text(encoding="utf-8")) or {}
    print(f"[CrowdNav] aug-cfg={resolved} ({len(overrides)} overrides: {list(overrides)})")
    return overrides


def _resolve_data_yaml(path: Path | None) -> Path:
    if path is not None:
        return path.expanduser().resolve()
    env = os.environ.get("CROWDNAV_DATA_YAML")
    if env:
        return Path(env).expanduser().resolve()
    return default_data_yaml().resolve()


def main() -> int:
    args = build_parser().parse_args()

    data_yaml = _resolve_data_yaml(args.data_yaml)
    if not data_yaml.is_file():
        print(f"[CrowdNav] ERROR: data.yaml not found: {data_yaml}", file=sys.stderr)
        print(
            "[CrowdNav] Prepare YOLO splits: <repo>/data/processed/splits/data.yaml plus "
            "train/val/test images/ and labels/. See docs/DATA.md and train/README.md.",
            file=sys.stderr,
        )
        print(
            "[CrowdNav] Override with --data-yaml PATH or CROWDNAV_DATA_YAML.",
            file=sys.stderr,
        )
        return 2

    device = resolve_training_device(args.device)
    print(f"[CrowdNav] runtime={describe_runtime()} device={device!r} (set --device or CROWDNAV_DEVICE to override auto)")
    print(f"[CrowdNav] data_yaml={data_yaml}")

    extra_kwargs = _load_aug_cfg(args.aug_cfg)

    pipeline = TrainPipeline(
        model_cfg=args.model_cfg,
        data_yaml=str(data_yaml),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=device,
        project=args.project,
        name=args.name,
        patience=args.patience,
        exist_ok=not args.no_exist_ok,
        workers=args.workers,
        save_period=args.save_period,
        lr0=args.lr0,
        lrf=args.lrf,
        extra_kwargs=extra_kwargs,
    )

    artifacts = pipeline.train()
    print(f"Training run directory: {artifacts.run_dir}")
    if artifacts.best_weights is not None:
        print(f"Best weights: {artifacts.best_weights}")
    if artifacts.last_weights is not None:
        print(f"Last weights: {artifacts.last_weights}")

    if args.validate:
        metrics = pipeline.validate()
        print("Validation metrics:")
        for key, value in sorted(metrics.items()):
            print(f"  {key}: {value}")

    if args.export:
        exported_path = pipeline.export(args.export)
        print(f"Exported model: {exported_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
