"""SageMaker training entry point for CrowdNav YOLOv8 fine-tuning.

This script runs INSIDE the SageMaker training container.
SageMaker mounts data from S3 into /opt/ml/input/data/training/ and expects
model artifacts to be written to /opt/ml/model/ (auto-uploaded back to S3).

Required environment variables (set automatically by SageMaker):
  SM_CHANNEL_TRAINING : input data dir (mounted from S3)
  SM_MODEL_DIR        : model output dir (uploaded to S3 on completion)
  SM_OUTPUT_DATA_DIR  : auxiliary outputs dir (logs, plots)

Hyperparameters are passed via CLI (set by SageMaker estimator's hyperparameters).
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    # SageMaker channels (auto-injected env vars)
    p.add_argument(
        "--data-dir",
        type=str,
        default=os.environ.get("SM_CHANNEL_TRAINING", "/opt/ml/input/data/training"),
    )
    p.add_argument(
        "--output-dir",
        type=str,
        default=os.environ.get("SM_OUTPUT_DATA_DIR", "/opt/ml/output/data"),
    )
    p.add_argument(
        "--model-dir",
        type=str,
        default=os.environ.get("SM_MODEL_DIR", "/opt/ml/model"),
    )

    # Hyperparameters (override via SageMaker estimator)
    p.add_argument("--model", type=str, default="yolov8l.pt")
    p.add_argument("--epochs", type=int, default=50)
    p.add_argument("--batch", type=int, default=32)
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--workers", type=int, default=8)
    p.add_argument("--patience", type=int, default=20)
    p.add_argument("--lr0", type=float, default=0.01)
    p.add_argument("--lrf", type=float, default=0.01)
    p.add_argument("--name", type=str, default="crowdnav_yolo")
    return p.parse_args()


def ensure_data_yaml(data_dir: Path) -> Path:
    """Locate or generate data.yaml with absolute paths matching data_dir."""
    yaml_path = data_dir / "data.yaml"

    # Always rewrite so absolute path matches the SageMaker container layout.
    content = (
        f"path: {data_dir}\n"
        f"train: train/images\n"
        f"val: val/images\n"
        f"test: test/images\n"
        f"nc: 1\n"
        f"names:\n"
        f"- person\n"
    )
    yaml_path.write_text(content, encoding="utf-8")
    print(f"[CrowdNav] data.yaml written:\n{content}")
    return yaml_path


def copy_artifacts(save_dir: Path, model_dir: Path) -> None:
    """Copy best.pt, last.pt, results.csv to SM_MODEL_DIR for S3 upload."""
    weights_dir = save_dir / "weights"
    artifacts = [
        weights_dir / "best.pt",
        weights_dir / "last.pt",
        save_dir / "results.csv",
        save_dir / "results.png",
        save_dir / "confusion_matrix.png",
        save_dir / "BoxPR_curve.png",
    ]
    model_dir.mkdir(parents=True, exist_ok=True)
    for src in artifacts:
        if src.exists():
            shutil.copy(src, model_dir / src.name)
            print(f"[CrowdNav] Copied {src.name} -> {model_dir}")


def main() -> int:
    args = parse_args()

    print("=" * 60)
    print("[CrowdNav] SageMaker Training Job")
    print("=" * 60)
    print(f"data_dir:   {args.data_dir}")
    print(f"model_dir:  {args.model_dir}")
    print(f"output_dir: {args.output_dir}")
    print(f"model:      {args.model}")
    print(f"epochs:     {args.epochs}")
    print(f"batch:      {args.batch}")
    print(f"imgsz:      {args.imgsz}")
    print(f"workers:    {args.workers}")
    print("=" * 60)

    data_dir = Path(args.data_dir)
    model_dir = Path(args.model_dir)
    output_dir = Path(args.output_dir)

    if not data_dir.exists():
        print(f"ERROR: data_dir not found: {data_dir}")
        return 1

    # Generate data.yaml with container-absolute paths.
    data_yaml = ensure_data_yaml(data_dir)

    # Lazy import to keep argparse phase fast/portable.
    from ultralytics import YOLO

    model = YOLO(args.model)
    results = model.train(
        data=str(data_yaml),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        workers=args.workers,
        patience=args.patience,
        lr0=args.lr0,
        lrf=args.lrf,
        project=str(output_dir),
        name=args.name,
        exist_ok=True,
        save=True,
        save_period=10,  # checkpoint every 10 epochs
    )

    save_dir = Path(getattr(results, "save_dir", output_dir / args.name))
    print(f"[CrowdNav] Training run dir: {save_dir}")
    copy_artifacts(save_dir, model_dir)

    # Run final validation and persist metrics.
    metrics = model.val(data=str(data_yaml), imgsz=args.imgsz)
    metrics_dict = getattr(metrics, "results_dict", {})
    metrics_path = model_dir / "final_val_metrics.txt"
    with open(metrics_path, "w", encoding="utf-8") as f:
        for key, value in sorted(metrics_dict.items()):
            f.write(f"{key}: {value}\n")
            print(f"  {key}: {value}")
    print(f"[CrowdNav] Final validation metrics saved: {metrics_path}")

    print("=" * 60)
    print("[CrowdNav] Training Complete")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
