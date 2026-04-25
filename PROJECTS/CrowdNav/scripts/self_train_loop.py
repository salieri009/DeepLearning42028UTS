"""Multi-cycle self-training loop for JRDB pseudo-labeling.

Cycle definition:
  (train -> pseudo-label regenerate -> split regenerate) = 1 cycle

This script is intentionally lightweight and delegates to existing CLIs/APIs:
- Train: src.mlops.train_pipeline.TrainPipeline
- Pseudo-label: src.data.prepare.pseudo_label.run()
- Split: src.data.prepare.split.run()
"""

from __future__ import annotations

import argparse
import json
import time
from dataclasses import asdict, dataclass
from pathlib import Path

from src.data.prepare import pseudo_label as pseudo_label_api
from src.data.prepare import split as split_api
from src.mlops.cycle_logging import CycleMetrics, append_cycle_metrics_csv, write_cycle_metrics_json
from src.mlops.train_pipeline import TrainPipeline
from src.mlops.training_device import describe_runtime, resolve_training_device


@dataclass(frozen=True)
class CycleSummary:
    cycle: int
    model_used: str
    run_dir: str
    best_weights: str | None
    last_weights: str | None
    started_unix: float
    ended_unix: float
    elapsed_seconds: float


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Run a multi-cycle self-training loop (train->relabel->split).")
    p.add_argument("--cycles", type=int, default=5, help="Number of self-training cycles")
    p.add_argument("--base-model", type=str, default="yolov8m.pt", help="Base model for cycle 0")
    p.add_argument(
        "--device",
        type=str,
        default=None,
        help="Training device; if omitted, same auto rule as train_yolo (CUDA 0 or cpu).",
    )
    p.add_argument("--epochs", type=int, default=15, help="Epochs per cycle")
    p.add_argument("--imgsz", type=int, default=640, help="Training image size")
    p.add_argument("--batch", type=int, default=16, help="Training batch size")
    p.add_argument("--patience", type=int, default=20, help="Early stopping patience")
    p.add_argument(
        "--workers",
        type=int,
        default=4,
        help="DataLoader workers (keep low on 16GB system RAM, e.g. ml.g4dn.xlarge)",
    )
    p.add_argument("--labels-dir", type=Path, default=Path("data/processed/labels"), help="Pseudo-label output dir")
    p.add_argument("--splits-dir", type=Path, default=Path("data/processed/splits"), help="Split output dir")
    p.add_argument("--raw-images", type=Path, default=Path("data/raw/images"), help="Raw images root dir")
    p.add_argument("--conf-thresh", type=float, default=0.4, help="Pseudo-label confidence threshold")
    p.add_argument("--manual-thresh", type=float, default=0.6, help="Manual-review threshold")
    p.add_argument("--overwrite-labels", action="store_true", help="Overwrite existing labels each cycle")
    p.add_argument("--checkpoint-interval", type=int, default=500, help="Pseudo-label checkpoint interval")
    p.add_argument("--no-clearml", action="store_true", help="Disable ClearML in pseudo-labeling")
    p.add_argument("--project", type=str, default="runs/train", help="Ultralytics project output directory")
    p.add_argument("--name-prefix", type=str, default="selftrain", help="Run name prefix")
    p.add_argument("--log-dir", type=Path, default=Path("scratch/self_train_logs"), help="Where to write cycle logs")
    return p


def _write_cycle_log(log_dir: Path, summary: CycleSummary) -> None:
    log_dir.mkdir(parents=True, exist_ok=True)
    path = log_dir / f"cycle_{summary.cycle:02d}.json"
    path.write_text(json.dumps(asdict(summary), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _count_manual_review_rows(labels_dir: Path) -> int:
    import csv

    path = labels_dir / "manual_review_required.csv"
    if not path.exists():
        return 0
    with path.open(newline="", encoding="utf-8") as f:
        r = csv.reader(f)
        next(r, None)
        return sum(1 for _ in r)


def _count_label_txt(labels_dir: Path) -> int:
    if not labels_dir.exists():
        return 0
    total = 0
    for seq in labels_dir.iterdir():
        if seq.is_dir():
            total += sum(1 for p in seq.glob("*.txt") if p.is_file())
    return total


def _count_split_pairs(splits_dir: Path, split_name: str) -> int:
    img_dir = splits_dir / split_name / "images"
    lbl_dir = splits_dir / split_name / "labels"
    if not img_dir.exists() or not lbl_dir.exists():
        return 0
    img_stems = {p.stem for p in img_dir.glob("*") if p.is_file()}
    lbl_stems = {p.stem for p in lbl_dir.glob("*.txt") if p.is_file()}
    return len(img_stems & lbl_stems)


def main() -> int:
    args = build_parser().parse_args()

    train_device = resolve_training_device(args.device)
    print(f"[CrowdNav] self_train runtime={describe_runtime()} device={train_device!r}")

    model_for_cycle = args.base_model
    for cycle in range(args.cycles):
        started = time.time()
        run_name = f"{args.name_prefix}_c{cycle:02d}"

        pipeline = TrainPipeline(
            model_cfg=model_for_cycle,
            data_yaml=str(args.splits_dir / "data.yaml"),
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch=args.batch,
            device=train_device,
            project=args.project,
            name=run_name,
            patience=args.patience,
            exist_ok=True,
            workers=args.workers,
        )
        artifacts = pipeline.train()

        best = str(artifacts.best_weights) if artifacts.best_weights is not None else None
        last = str(artifacts.last_weights) if artifacts.last_weights is not None else None
        # Prefer best for relabeling; fall back to last; fall back to current model cfg.
        model_for_cycle = best or last or model_for_cycle

        # Pseudo-label regenerate
        pseudo_label_api.run(
            model=model_for_cycle,
            src_dir=args.raw_images,
            out_dir=args.labels_dir,
            conf_thresh=args.conf_thresh,
            manual_thresh=args.manual_thresh,
            device="cuda",
            debug=False,
            no_clearml=args.no_clearml,
            checkpoint_interval=args.checkpoint_interval,
            overwrite_existing=args.overwrite_labels,
        )

        # Split regenerate (merge both camera views into one splits dir)
        for cam, prefix in (("image_0", "image0"), ("image_2", "image2")):
            split_api.run(
                src_labels=args.labels_dir,
                src_images=args.raw_images / cam,
                output_dir=args.splits_dir,
                stem_prefix=prefix,
            )

        ended = time.time()
        summary = CycleSummary(
            cycle=cycle,
            model_used=model_for_cycle,
            run_dir=str(artifacts.run_dir),
            best_weights=best,
            last_weights=last,
            started_unix=started,
            ended_unix=ended,
            elapsed_seconds=ended - started,
        )
        _write_cycle_log(args.log_dir, summary)
        print(f"[cycle {cycle}] done: {args.log_dir / f'cycle_{cycle:02d}.json'}")

        # Write compact metrics for trend tracking.
        metrics = CycleMetrics(
            cycle=cycle,
            run_dir=str(artifacts.run_dir),
            best_weights=best,
            last_weights=last,
            manual_review_rows=_count_manual_review_rows(args.labels_dir),
            labels_txt_total=_count_label_txt(args.labels_dir),
            split_train_pairs=_count_split_pairs(args.splits_dir, "train"),
            split_val_pairs=_count_split_pairs(args.splits_dir, "val"),
            split_test_pairs=_count_split_pairs(args.splits_dir, "test"),
        )
        write_cycle_metrics_json(args.log_dir / f"cycle_{cycle:02d}_metrics.json", metrics)
        append_cycle_metrics_csv(args.log_dir / "cycle_metrics.csv", metrics)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

