"""Cycle-level logging helpers for self-training runs."""

from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass(frozen=True)
class CycleMetrics:
    cycle: int
    run_dir: str
    best_weights: str | None
    last_weights: str | None
    manual_review_rows: int
    labels_txt_total: int
    split_train_pairs: int
    split_val_pairs: int
    split_test_pairs: int


def write_cycle_metrics_json(path: Path, metrics: CycleMetrics) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(asdict(metrics), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def append_cycle_metrics_csv(path: Path, metrics: CycleMetrics) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    exists = path.exists()
    with path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(asdict(metrics).keys()))
        if not exists:
            writer.writeheader()
        writer.writerow(asdict(metrics))

