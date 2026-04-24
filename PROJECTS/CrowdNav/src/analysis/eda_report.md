---
last_updated: 2026-04-24
scope:
  - JRDB image_0
  - JRDB image_2
  - pseudo labels (YOLO txt)
  - train/val/test splits
paths:
  raw_images: data/raw/images
  labels: data/processed/labels
  splits: data/processed/splits
---

## Summary (current workspace)

- **Raw sequences**: `image_0=27`, `image_2=27`
- **Label sequences**: `27` (directories under `data/processed/labels/`)
- **Total label txt files**: `27210`
  - per-sequence `min/median/max`: `402 / 918 / 1735`
- **Manual review rows** (`manual_review_required.csv`): `32986`
- **Split integrity** (images == labels, stems match):
  - **train**: `34676` / `34676`, stems_match ✅
  - **val**: `9834` / `9834`, stems_match ✅
  - **test**: `9950` / `9950`, stems_match ✅

## Notes

- Ultralytics training consumes `data/processed/splits/data.yaml` and performs resizing/letterboxing internally using `--imgsz`.
- Pseudo-label quality monitoring proxy: `manual_review_required.csv` ratio over time (track per cycle).
- If self-training cycles cause `manual_review_required.csv` to spike, reduce noise by increasing `--conf-thresh` or tightening `--manual-thresh` and/or limiting augmentation (mosaic) during training.

## Reproduce the numbers

```bash
python -m src.analysis.eda_report
```

