"""Quick EDA utilities for the JRDB->YOLO preprocessing outputs.

Designed to be fast, filesystem-only, and GPU/ML-framework independent.
"""

from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


@dataclass(frozen=True)
class SequenceStats:
    name: str
    image_count: int
    label_count: int


@dataclass(frozen=True)
class SplitStats:
    name: str
    images: int
    labels: int
    stems_match: bool


@dataclass(frozen=True)
class EdaSummary:
    image_0_sequences: int
    image_2_sequences: int
    labels_sequences: int
    labels_txt_total: int
    labels_per_sequence: dict[str, int]
    manual_review_rows: int
    splits: dict[str, SplitStats]


def _count_images(sequence_dir: Path) -> int:
    return sum(1 for p in sequence_dir.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS)


def _count_labels(sequence_dir: Path) -> int:
    return sum(1 for p in sequence_dir.glob("*.txt") if p.is_file())


def _read_manual_review_rows(csv_path: Path) -> int:
    if not csv_path.exists():
        return 0
    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader, None)
        return sum(1 for _ in reader)


def _stems(dir_path: Path, patterns: Iterable[str]) -> set[str]:
    stems: set[str] = set()
    for pat in patterns:
        for p in dir_path.glob(pat):
            if p.is_file():
                stems.add(p.stem)
    return stems


def summarize(
    *,
    raw_images_root: Path,
    labels_root: Path,
    splits_root: Path,
) -> EdaSummary:
    image_0 = raw_images_root / "image_0"
    image_2 = raw_images_root / "image_2"
    image_0_sequences = [d for d in image_0.iterdir() if d.is_dir()] if image_0.exists() else []
    image_2_sequences = [d for d in image_2.iterdir() if d.is_dir()] if image_2.exists() else []

    label_sequences = [d for d in labels_root.iterdir() if d.is_dir()] if labels_root.exists() else []
    labels_per_sequence = {d.name: _count_labels(d) for d in label_sequences}
    labels_txt_total = sum(labels_per_sequence.values())

    manual_review_rows = _read_manual_review_rows(labels_root / "manual_review_required.csv")

    split_stats: dict[str, SplitStats] = {}
    for split_name in ("train", "val", "test"):
        img_dir = splits_root / split_name / "images"
        lbl_dir = splits_root / split_name / "labels"
        images = sum(1 for p in img_dir.iterdir() if p.is_file()) if img_dir.exists() else 0
        labels = sum(1 for p in lbl_dir.glob("*.txt") if p.is_file()) if lbl_dir.exists() else 0
        stems_match = False
        if img_dir.exists() and lbl_dir.exists():
            img_stems = _stems(img_dir, ["*"])
            lbl_stems = _stems(lbl_dir, ["*.txt"])
            stems_match = img_stems == lbl_stems
        split_stats[split_name] = SplitStats(
            name=split_name,
            images=images,
            labels=labels,
            stems_match=stems_match,
        )

    return EdaSummary(
        image_0_sequences=len(image_0_sequences),
        image_2_sequences=len(image_2_sequences),
        labels_sequences=len(label_sequences),
        labels_txt_total=labels_txt_total,
        labels_per_sequence=labels_per_sequence,
        manual_review_rows=manual_review_rows,
        splits=split_stats,
    )


def write_report(report_path: Path, summary: EdaSummary) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    payload = asdict(summary)
    report_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    from src.repo_paths import repo_root, train_root

    r = repo_root()
    raw_images_root = r / "data/raw/images"
    labels_root = r / "data/processed/labels"
    splits_root = r / "data/processed/splits"
    summary = summarize(raw_images_root=raw_images_root, labels_root=labels_root, splits_root=splits_root)
    out = train_root() / "src/analysis/eda_summary.json"
    write_report(out, summary)
    print(f"Wrote: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

