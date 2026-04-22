---
last_updated: 2026-04-22
related_code:
  - src/data/pseudo_label_yolov8.py
  - src/data/split_by_sequence.py
related_diagram:
  - PROJECTS/docs/data_pipeline_diagram.md
branch: feat/docker-dev-env
commits:
  - 6b8f9b5 chore: clean up unused raw image sequences and root images
  - 14eebf8 feat(data): add YOLOv8 pseudo-labeling pipeline with ClearML and dynamic batching
---

# PR: feat/data — YOLOv8 Pseudo-Labeling Pipeline for JRDB Subset

## Summary
Introduces the YOLOv8-based pseudo-labeling pipeline for JRDB video frame sequences (`image_0`, `image_2`). Covers data cleanup, auto-labeling, manual review flagging, ClearML integration, and AWS SageMaker-compatible `data.yaml` output.

---

## Why This PR?
This is **Phase 1 (Part-B)** work per the PRD. Before any YOLO fine-tuning can be run on AWS SageMaker, we need:
1. A clean, scoped image subset (20 location-based video sequences).
2. YOLO-format `.txt` label files generated via a pre-trained model (pseudo-labeling).
3. Confidence-based flagging for frames requiring human review.
4. A `data.yaml` ready for direct use in SageMaker training jobs.

---

## What Changed

### 🗑️ Data Cleanup
- Removed unused camera-view image sets from `data/raw/images/`:
  - `image_4/`, `image_6/`, `image_8/`, `image_stitched/`
  - Root-level `.jpg` files in `data/raw/`
- ⚠️ Raw data is **not tracked by Git** (managed separately / excluded by `.gitignore`).

### 🆕 New Script: `src/data/pseudo_label_yolov8.py`

| Feature | Detail |
|---|---|
| Model | `yolov8x.pt` (pre-trained COCO) |
| Target class | Person (COCO class 0, mapped to `CLASS_MAP['person'] = 0`) |
| Inference device | Auto-detected: GPU (batch=16) or CPU (batch=4) |
| Label output | `data/processed/labels/<sequence_name>/<frame_stem>.txt` (YOLO format) |
| Manual review flag | Frames with any detection `conf < 0.8` → `data/processed/labels/manual_review_required.csv` |
| Debug mode | `--debug` → bounding box previews saved to `data/processed/debug_previews/` |
| data.yaml | Auto-generated at `data/processed/labels/data.yaml` on completion |
| ClearML | `Task.init(project='CrowdNav', task_name='pseudo_labeling_v1')` logs all run params |

---

## How to Run

```bash
# Standard run (all sequences in image_0 / image_2)
python src/data/pseudo_label_yolov8.py

# With visual sanity check previews
python src/data/pseudo_label_yolov8.py --debug

# Custom confidence threshold
python src/data/pseudo_label_yolov8.py --conf-thresh 0.45 --manual-thresh 0.75
```

---

## Output Artefacts

```
data/processed/
  labels/
    <sequence_name>/
      <frame_stem>.txt     ← YOLO format labels
    manual_review_required.csv
    data.yaml              ← SageMaker training config
  debug_previews/          ← Only when --debug is used
    <sequence_name>/
      preview_<frame>.jpg
```

---

## Validation
- `python src/data/pseudo_label_yolov8.py -h` → CLI parses without errors ✅
- `typing_extensions` updated to 4.15.0 to unblock `torch` import ✅

## Next Steps
- [ ] Run full pseudo-labeling over `image_0` / `image_2` sequences.
- [ ] Human review of `manual_review_required.csv` flagged frames.
- [ ] Run `src/data/split_by_sequence.py` to generate train/val/test splits.
- [ ] Upload `data/processed/` to S3 and trigger SageMaker training job.
