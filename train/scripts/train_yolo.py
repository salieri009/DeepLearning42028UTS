"""CLI for training and validating the CrowdNav YOLO model."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.repo_paths import default_data_yaml  # noqa: E402
from src.training import (  # noqa: E402
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
    parser.add_argument("--epochs", type=int, default=100, help="Number of training epochs")
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
    parser.add_argument("--project", default="runs/train", help="Ultralytics project output directory")
    parser.add_argument("--name", default="crowdnav_yolo", help="Run name")
    parser.add_argument("--patience", type=int, default=20, help="Early stopping patience")
    parser.add_argument(
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
    return parser


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
