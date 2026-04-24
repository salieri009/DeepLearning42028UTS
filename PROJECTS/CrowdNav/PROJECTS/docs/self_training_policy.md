---
last_updated: 2026-04-24
audience: project team
scope: JRDB pseudo-label self-training loop (10 cycles)
---

## Preprocessing policy

We rely on Ultralytics internal preprocessing (letterbox resize + normalization). We do **not** pre-resize images on disk.

- **Input images**: `data/raw/images/image_0`, `data/raw/images/image_2` (native JRDB frames)
- **Training resize**: controlled by `--imgsz` (Ultralytics)
- **Label format**: YOLO normalized xywh in `.txt` files

Recommended defaults:
- `imgsz=640` for best accuracy (GPU permitting)
- `imgsz=320` for fast iterations / smoke cycles

## Augmentation policy

Use Ultralytics defaults initially. For self-training, aggressive augmentation can amplify label noise.

Recommended starting point:
- keep defaults
- reduce mosaic in later cycles if validation becomes unstable (use `close_mosaic` and/or lower mosaic probability)

## Self-training (10 cycles) defaults

- **Cycle definition**: (Train → Pseudo-label regenerate → Split regenerate) = 1 cycle
- **Base model**: cycle0 uses `yolov8x.pt` (or smaller if GPU memory constrained)
- **Pseudo-label source**: cycleN uses cycle(N-1) `weights/best.pt`
- **Pseudo-label overwrite**: use `--overwrite-existing` for full refresh each cycle
- **Resume**: `pseudo_label_checkpoint.json` is written periodically for restart

## Sanity checks per cycle

- Split integrity: `train/val/test` images count == labels count, and stems match.
- Manual review ratio: compare `manual_review_required.csv` rows vs total candidates; spikes indicate label noise.
- Validation metrics: mAP/precision/recall should not collapse across cycles.

