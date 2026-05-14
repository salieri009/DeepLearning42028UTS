"""Rebuild YOLO splits from scratch using official GT labels (both cameras).

What this script does:
  1. Scans labels_gt/image_0/ and labels_gt/image_2/ for all GT-labeled sequences
  2. Assigns sequences to train/val/test at sequence level (no frame-level leakage)
     Split ratio: ~80% train / ~10% val / ~10% test (by frame count)
  3. Copies images from data/raw/images/ and labels from labels_gt/ into
     a fresh splits_gt/ directory
  4. Writes data.yaml for Ultralytics
  5. Deletes outdated experimental label folders

Usage:
    python train/scripts/rebuild_splits_gt.py
    python train/scripts/rebuild_splits_gt.py --dry-run   # preview only

Output: data/processed/splits_gt/  (new clean splits)
"""

from __future__ import annotations

import argparse
import shutil
import yaml
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
PROCESSED  = Path(r"D:\UTS\2026-01\Deep Learning\Assignment 3\PROJECTS\CrowdNav\data\processed")
RAW_IMAGES = Path(r"D:\UTS\2026-01\Deep Learning\Assignment 3\PROJECTS\CrowdNav\data\raw\images")
LABELS_GT  = PROCESSED / "labels_gt"
OUT_ROOT   = PROCESSED / "splits_gt"

CAMERAS = ["image_0", "image_2"]   # both camera views

# Sequences to hold out for val / test (hand-picked for scene diversity)
# Remaining sequences go to train.
VAL_SEQS = {
    "jordan-hall-2019-04-22_0",           # large indoor
    "clark-center-2019-02-28_1",          # medium outdoor intersection
    "tressider-2019-03-16_0",             # medium outdoor plaza
}
TEST_SEQS = {
    "cubberly-auditorium-2019-04-22_0",   # indoor auditorium
    "bytes-cafe-2019-02-07_0",            # indoor cafe
}

# Old experimental folders to delete after rebuild
DELETE_DIRS = [
    "labels_A_no_aug_iou05",
    "labels_B_no_aug_iou07",
    "labels_C_tta_iou07",
    "labels_D_clark",
    "labels_smoke",
    "labels_backup_pre_v2",
    "labels_backup_20260423_160702",
    "auto_labels_debug",
    "coco_smoke",
    "debug_previews",
    "splits_pseudo_20260426_110911",  # pseudo-label splits (replaced by GT)
]


def get_seq_frame_count(cam_dir: Path) -> dict[str, int]:
    """Return {seq_name: frame_count} for all sequences under a camera dir."""
    counts: dict[str, int] = {}
    for seq_dir in sorted(cam_dir.iterdir()):
        if seq_dir.is_dir():
            counts[seq_dir.name] = len(list(seq_dir.glob("*.txt")))
    return counts


def assign_split(seq: str) -> str:
    if seq in VAL_SEQS:
        return "val"
    if seq in TEST_SEQS:
        return "test"
    return "train"


def copy_split(
    cam_key: str,        # "image_0" or "image_2"
    cam_prefix: str,     # "image0" or "image2"  (filename prefix)
    seq: str,
    split: str,
    dry_run: bool,
) -> tuple[int, int]:
    """Copy images + labels for one camera/sequence into OUT_ROOT/split/.

    Returns (images_copied, labels_copied).
    """
    img_src_dir   = RAW_IMAGES / cam_key / seq
    label_src_dir = LABELS_GT  / cam_key / seq
    img_dst_dir   = OUT_ROOT / split / "images"
    label_dst_dir = OUT_ROOT / split / "labels"

    if not img_src_dir.exists():
        print(f"    [WARN] images not found: {img_src_dir}")
        return 0, 0
    if not label_src_dir.exists():
        print(f"    [WARN] labels not found: {label_src_dir}")
        return 0, 0

    if not dry_run:
        img_dst_dir.mkdir(parents=True, exist_ok=True)
        label_dst_dir.mkdir(parents=True, exist_ok=True)

    imgs_copied = labels_copied = 0

    for img_src in sorted(img_src_dir.glob("*.jpg")):
        frame = img_src.stem                          # e.g. "000000"
        flat_name = f"{cam_prefix}_{seq}_{frame}"    # e.g. "image0_clark-..._000000"

        img_dst   = img_dst_dir   / f"{flat_name}.jpg"
        label_src = label_src_dir / f"{frame}.txt"
        label_dst = label_dst_dir / f"{flat_name}.txt"

        if not dry_run:
            shutil.copy2(img_src, img_dst)
            if label_src.exists():
                shutil.copy2(label_src, label_dst)
            else:
                label_dst.write_text("", encoding="utf-8")  # no pedestrians

        imgs_copied += 1
        if label_src.exists():
            labels_copied += 1

    return imgs_copied, labels_copied


def write_data_yaml(dry_run: bool) -> None:
    yaml_path = OUT_ROOT / "data.yaml"
    config = {
        "path": str(OUT_ROOT),
        "train": "train/images",
        "val":   "val/images",
        "test":  "test/images",
        "nc": 1,
        "names": ["person"],
    }
    if not dry_run:
        yaml_path.write_text(
            yaml.dump(config, default_flow_style=False, allow_unicode=True),
            encoding="utf-8",
        )
    print(f"  data.yaml → {yaml_path}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Preview without copying")
    args = parser.parse_args()
    dry_run: bool = args.dry_run

    if dry_run:
        print("DRY RUN — no files will be copied or deleted\n")

    # ── Collect sequences ─────────────────────────────────────────────────────
    print("=" * 65)
    print("Step 1: Scanning GT labels")
    print("=" * 65)

    # Use image_0 as the authoritative sequence list
    cam0_dir = LABELS_GT / "image_0"
    seq_counts = get_seq_frame_count(cam0_dir)
    all_seqs = sorted(seq_counts)
    total_frames = sum(seq_counts.values())
    print(f"Sequences found: {len(all_seqs)}")
    print(f"Total GT frames (image_0): {total_frames:,}")

    # ── Print split assignment ────────────────────────────────────────────────
    split_summary: dict[str, list[tuple[str, int]]] = {"train": [], "val": [], "test": []}
    for seq in all_seqs:
        sp = assign_split(seq)
        split_summary[sp].append((seq, seq_counts[seq]))

    print("\nSplit assignment:")
    for sp, seqs in split_summary.items():
        frames = sum(c for _, c in seqs)
        pct = frames / total_frames * 100
        print(f"  {sp:5}: {len(seqs):2} sequences, {frames:6,} frames ({pct:.1f}%)")
        for seq, cnt in seqs:
            print(f"         {seq}  [{cnt} frames]")

    # ── Copy data ─────────────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("Step 2: Copying images + labels (both cameras)")
    print("=" * 65)

    cam_map = {"image_0": "image0", "image_2": "image2"}
    totals: dict[str, dict[str, int]] = {sp: {"img": 0, "lbl": 0} for sp in ("train", "val", "test")}

    for sp, seqs in split_summary.items():
        print(f"\n  [{sp}]")
        for seq, _ in seqs:
            for cam_key, cam_prefix in cam_map.items():
                imgs, lbls = copy_split(cam_key, cam_prefix, seq, sp, dry_run)
                totals[sp]["img"] += imgs
                totals[sp]["lbl"] += lbls
                if imgs:
                    print(f"    {cam_key}/{seq}: {imgs} imgs, {lbls} labels")

    # ── Write data.yaml ───────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("Step 3: Writing data.yaml")
    print("=" * 65)
    write_data_yaml(dry_run)

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("Step 4: Final counts")
    print("=" * 65)
    grand_img = grand_lbl = 0
    for sp, t in totals.items():
        print(f"  {sp:5}: {t['img']:6,} images  {t['lbl']:6,} GT labels")
        grand_img += t["img"]
        grand_lbl += t["lbl"]
    print(f"  {'TOTAL':5}: {grand_img:6,} images  {grand_lbl:6,} GT labels")

    # ── Delete old folders ────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("Step 5: Deleting outdated folders")
    print("=" * 65)
    for name in DELETE_DIRS:
        target = PROCESSED / name
        if target.exists():
            if not dry_run:
                shutil.rmtree(target)
            print(f"  {'[DRY]' if dry_run else 'DELETED'} {name}/")
        else:
            print(f"  SKIP    {name}/ (not found)")

    print("\n✓ Done!")
    if not dry_run:
        print(f"New splits: {OUT_ROOT}")
        print(f"data.yaml : {OUT_ROOT / 'data.yaml'}")
        print("\nTo train with new splits, use:")
        print(f'  --data-yaml "{OUT_ROOT / "data.yaml"}"')

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
