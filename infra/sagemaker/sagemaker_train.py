"""SageMaker training entry point for CrowdNav YOLOv8 fine-tuning.

Runs INSIDE the SageMaker training container. Uses ``TrainPipeline`` from
``crowdnav-train`` (``pip install -e ./train``) — same path as local
``train/scripts/train_yolo.py``.

Environment (set by SageMaker):
  SM_CHANNEL_TRAINING : input data dir (mounted from S3)
  SM_MODEL_DIR        : model output dir (uploaded to S3 on completion)
  SM_OUTPUT_DATA_DIR  : auxiliary outputs dir (logs, plots)
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
from pathlib import Path

from src.training.hyperparams import default_training_presets
from src.training.train_pipeline import TrainPipeline

_DEFAULT_HP = default_training_presets()["sagemaker_managed_job"]

_DATASET_VARIANTS: dict[str, dict[str, object]] = {
    "person": {"nc": 1, "names": ["person"]},
    "3class": {"nc": 3, "names": ["person", "wheelchair", "luggage"]},
}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
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

    p.add_argument("--model", type=str, default=_DEFAULT_HP.model)
    p.add_argument("--epochs", type=int, default=_DEFAULT_HP.epochs)
    p.add_argument("--batch", type=int, default=_DEFAULT_HP.batch)
    p.add_argument("--imgsz", type=int, default=_DEFAULT_HP.imgsz)
    p.add_argument("--workers", type=int, default=_DEFAULT_HP.workers)
    p.add_argument("--patience", type=int, default=_DEFAULT_HP.patience)
    p.add_argument("--save-period", type=int, default=_DEFAULT_HP.save_period)
    p.add_argument("--lr0", type=float, default=0.01)
    p.add_argument("--lrf", type=float, default=0.01)
    p.add_argument("--name", type=str, default="crowdnav_yolo")

    p.add_argument(
        "--rewrite-data-yaml",
        action="store_true",
        help="Force-regenerate data.yaml even when one exists in the data channel",
    )
    p.add_argument(
        "--dataset-variant",
        choices=sorted(_DATASET_VARIANTS),
        default="person",
        help="Dataset class layout when generating data.yaml (default: person / nc:1)",
    )
    p.add_argument(
        "--nc",
        type=int,
        default=None,
        help="Override class count when generating data.yaml",
    )
    p.add_argument(
        "--class-names",
        nargs="+",
        default=None,
        help="Override class names when generating data.yaml",
    )
    return p.parse_args()


def _patch_yaml_path(content: str, data_dir: Path) -> str:
    """Rewrite only the top-level ``path:`` key to the container data directory."""
    patched, count = re.subn(
        r"(?m)^path:\s*.+$",
        f"path: {data_dir.as_posix()}",
        content,
        count=1,
    )
    if count == 0:
        return f"path: {data_dir.as_posix()}\n{content}"
    return patched


def _variant_spec(args: argparse.Namespace) -> tuple[int, list[str]]:
    if args.nc is not None or args.class_names is not None:
        nc = args.nc if args.nc is not None else len(args.class_names or [])
        names = list(args.class_names or [])
        if not names:
            raise ValueError("--nc requires --class-names when generating data.yaml")
        return nc, names
    variant = _DATASET_VARIANTS[args.dataset_variant]
    return int(variant["nc"]), list(variant["names"])  # type: ignore[arg-type]


def _write_data_yaml(data_dir: Path, nc: int, names: list[str]) -> str:
    return (
        f"path: {data_dir.as_posix()}\n"
        f"train: train/images\n"
        f"val: val/images\n"
        f"test: test/images\n"
        f"nc: {nc}\n"
        f"names:\n"
        + "".join(f"- {name}\n" for name in names)
    )


def ensure_data_yaml(data_dir: Path, args: argparse.Namespace) -> Path:
    """Use existing data.yaml when present; otherwise generate or rewrite."""
    yaml_path = data_dir / "data.yaml"

    if yaml_path.is_file() and not args.rewrite_data_yaml:
        original = yaml_path.read_text(encoding="utf-8")
        patched = _patch_yaml_path(original, data_dir)
        if patched != original:
            yaml_path.write_text(patched, encoding="utf-8")
            print(f"[CrowdNav] Patched data.yaml path -> {data_dir}")
        else:
            print(f"[CrowdNav] Using existing data.yaml: {yaml_path}")
        return yaml_path

    nc, names = _variant_spec(args)
    content = _write_data_yaml(data_dir, nc, names)
    yaml_path.write_text(content, encoding="utf-8")
    print(f"[CrowdNav] data.yaml written:\n{content}")
    return yaml_path


def copy_artifacts(save_dir: Path, model_dir: Path) -> None:
    """Copy best.pt, last.pt, plots to SM_MODEL_DIR for S3 upload."""
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


def write_metrics(model_dir: Path, metrics: dict[str, float]) -> Path:
    metrics_path = model_dir / "final_val_metrics.txt"
    with open(metrics_path, "w", encoding="utf-8") as handle:
        for key, value in sorted(metrics.items()):
            handle.write(f"{key}: {value}\n")
            print(f"  {key}: {value}")
    print(f"[CrowdNav] Final validation metrics saved: {metrics_path}")
    return metrics_path


def main() -> int:
    args = parse_args()

    print("=" * 60)
    print("[CrowdNav] SageMaker Training Job (TrainPipeline)")
    print("=" * 60)
    print(f"data_dir:   {args.data_dir}")
    print(f"model_dir:  {args.model_dir}")
    print(f"output_dir: {args.output_dir}")
    print(f"model:      {args.model}")
    print(f"epochs:     {args.epochs}")
    print(f"batch:      {args.batch}")
    print(f"imgsz:      {args.imgsz}")
    print(f"workers:    {args.workers}")
    print(f"variant:    {args.dataset_variant}")
    print("=" * 60)

    data_dir = Path(args.data_dir)
    model_dir = Path(args.model_dir)
    output_dir = Path(args.output_dir)

    if not data_dir.is_dir():
        print(f"ERROR: data_dir not found: {data_dir}")
        return 1

    data_yaml = ensure_data_yaml(data_dir, args)

    pipeline = TrainPipeline(
        model_cfg=args.model,
        data_yaml=str(data_yaml),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=0,
        project=str(output_dir),
        name=args.name,
        patience=args.patience,
        workers=args.workers,
        save_period=args.save_period,
        lr0=args.lr0,
        lrf=args.lrf,
    )

    artifacts = pipeline.train()
    print(f"[CrowdNav] Training run dir: {artifacts.run_dir}")
    copy_artifacts(artifacts.run_dir, model_dir)

    metrics = pipeline.validate()
    write_metrics(model_dir, metrics)

    print("=" * 60)
    print("[CrowdNav] Training Complete")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
