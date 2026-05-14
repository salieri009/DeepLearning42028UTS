"""Replace splits labels with official GT labels from labels_gt/.

labels_gt structure:
    labels_gt/image_0/<sequence>/<frame>.txt  (e.g. 000000.txt)

splits label filename format:
    image0_<sequence>_<frame>.txt  (e.g. image0_clark-center-2019-02-28_0_000000.txt)

This script:
1. Iterates splits/{train,val,test}/labels/*.txt
2. Parses camera / sequence / frame from each filename
3. Copies matching GT label (empty file if GT has no annotations for that frame)
4. Deletes outdated experimental label folders

Usage:
    python train/scripts/replace_labels_with_gt.py
"""

from __future__ import annotations

import shutil
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
PROCESSED = Path(r"D:\UTS\2026-01\Deep Learning\Assignment 3\PROJECTS\CrowdNav\data\processed")
LABELS_GT = PROCESSED / "labels_gt"
SPLITS    = PROCESSED / "splits"

# Folders to delete (experimental / backup only — keep labels, labels_gt, splits, coco)
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
]


# ── Helpers ───────────────────────────────────────────────────────────────────
def parse_split_stem(stem: str) -> tuple[str, str, str]:
    """Parse 'image0_clark-center-2019-02-28_0_000000' → (cam_dir, seq, frame).

    Frame is always a fixed-width numeric string (e.g. '000000').
    Camera is the token before the first underscore.
    Sequence is everything in between.
    """
    first_under = stem.index("_")
    cam_raw = stem[:first_under]          # e.g. "image0"
    rest    = stem[first_under + 1:]      # e.g. "clark-center-2019-02-28_0_000000"

    last_under = rest.rfind("_")
    frame = rest[last_under + 1:]         # e.g. "000000"
    seq   = rest[:last_under]             # e.g. "clark-center-2019-02-28_0"

    # image0 → image_0
    if cam_raw.startswith("image") and cam_raw[5:].isdigit():
        cam_dir = f"image_{cam_raw[5:]}"
    else:
        cam_dir = cam_raw

    return cam_dir, seq, frame


# ── Step 1: Replace labels ────────────────────────────────────────────────────
print("=" * 60)
print("Step 1: Replacing splits labels with GT labels")
print("=" * 60)

replaced  = 0
no_gt     = 0   # GT file missing — write empty label (no pedestrians)
errors    = 0

for split in ("train", "val", "test"):
    label_dir = SPLITS / split / "labels"
    if not label_dir.exists():
        print(f"  [SKIP] {split}/labels/ not found")
        continue

    txt_files = sorted(label_dir.glob("*.txt"))
    print(f"\n  {split}: {len(txt_files)} label files")

    for txt in txt_files:
        try:
            cam_dir, seq, frame = parse_split_stem(txt.stem)
            gt_label = LABELS_GT / cam_dir / seq / f"{frame}.txt"

            if gt_label.exists():
                shutil.copy2(gt_label, txt)
                replaced += 1
            else:
                # No GT annotation = no pedestrians in this frame → empty label
                txt.write_text("", encoding="utf-8")
                no_gt += 1
        except Exception as exc:
            print(f"    ERROR {txt.name}: {exc}")
            errors += 1

print(f"\nReplaced with GT : {replaced}")
print(f"Empty (no GT)    : {no_gt}")
print(f"Errors           : {errors}")


# ── Step 2: Delete old folders ────────────────────────────────────────────────
print("\n" + "=" * 60)
print("Step 2: Deleting outdated label folders")
print("=" * 60)

for folder_name in DELETE_DIRS:
    folder = PROCESSED / folder_name
    if folder.exists():
        shutil.rmtree(folder)
        print(f"  DELETED  {folder_name}/")
    else:
        print(f"  SKIP     {folder_name}/ (not found)")

print("\nDone! Remaining folders in processed/:")
for p in sorted(PROCESSED.iterdir()):
    if p.is_dir():
        print(f"  {p.name}/")
