---
last_updated: 2026-04-22
related_code:
  - src/data/pseudo_label_yolov8.py
  - src/data/jrdb_to_yolo.py
  - src/data/split_by_sequence.py
  - src/data/preprocessing/
  - scripts/automate_preprocessing.py
related_diagram:
  - PROJECTS/docs/data_pipeline_diagram.md
---

# src/data

Data preprocessing and dataset preparation modules for CrowdNav.  
All scripts operate on the **JRDB dataset** (`data/raw/images/image_0/`, `data/raw/images/image_2/`), targeting the `person` class only.

## Module Overview

| Script | Purpose |
|---|---|
| `pseudo_label_yolov8.py` | **Primary pipeline.** Runs YOLOv8 inference on JRDB video frames and generates YOLO `.txt` label files. Also flags low-confidence frames and auto-generates `data.yaml`. |
| `split_by_sequence.py` | Splits labeled data into train/val/test at sequence level and writes `data.yaml` for SageMaker. |
| `jrdb_to_yolo.py` | CLI wrapper for converting JRDB-style JSON annotation files to YOLO `.txt` labels (used when ground-truth JSON annotations are available). |
| `preprocessing/` | Parser and converter package used by `jrdb_to_yolo.py`. |

---

## Step 1: YOLOv8 Pseudo-Labeling (Primary)

Runs pre-trained YOLOv8 on all frames in `data/raw/images/image_0/` and `data/raw/images/image_2/`.

```bash
# Standard run
python src/data/pseudo_label_yolov8.py

# With visual sanity check previews (saves annotated preview images)
python src/data/pseudo_label_yolov8.py --debug

# Custom confidence thresholds
python src/data/pseudo_label_yolov8.py --conf-thresh 0.45 --manual-thresh 0.75
```

**Output:**
```
data/processed/labels/
  <sequence_name>/
    <frame_stem>.txt          ← YOLO format labels
  manual_review_required.csv  ← Frames with conf < 0.8 (needs human review)
  data.yaml                   ← Auto-generated SageMaker training config
data/processed/debug_previews/ ← Only when --debug is used
```

---

## Step 2: Split Dataset for Training

Splits labels and images into train/val/test at the sequence level (default: 70/20/10).

```bash
# NOTE: frame filenames often repeat across JRDB sequences (e.g. 000001.jpg),
# so use --stem-prefix when merging multiple camera views into one splits folder.
python src/data/split_by_sequence.py \
  --src-labels data/processed/labels \
  --src-images data/raw/images/image_0 \
  --output-dir data/processed/splits \
  --stem-prefix image0 \
  --train-ratio 0.7 \
  --val-ratio 0.2 \
  --seed 42

python src/data/split_by_sequence.py \
  --src-labels data/processed/labels \
  --src-images data/raw/images/image_2 \
  --output-dir data/processed/splits \
  --stem-prefix image2 \
  --train-ratio 0.7 \
  --val-ratio 0.2 \
  --seed 42
```

**Output:**
```
data/processed/splits/
  train/images/ + train/labels/
  val/images/   + val/labels/
  test/images/  + test/labels/
  data.yaml
```

---

## Step 3: JRDB JSON Conversion (Supplementary)

Use this only when JRDB ground-truth JSON annotation files are available.  
Runs batch conversion via `scripts/automate_preprocessing.py`.

```bash
python scripts/automate_preprocessing.py \
  data/raw/images/image_0 \
  data/raw/images/image_0 \
  data/processed/labels \
  1920 \
  1080 \
  --recursive \
  --skip-dvc-pull
```

Common options:
- `--validation-only` — skip conversion, validate existing labels only
- `--dry-run` — show planned actions without executing
- `--skip-dvc-pull` — skip DVC pull (use when working locally without DVC)
- `--fail-fast` — stop on first failure
- `--allow-duplicate-stems` — allow repeated frame stems across folders

Output report: `data/processed/labels/preprocessing_report.json`

---

## Single JSON Conversion (Manual)

```bash
python -m src.data.jrdb_to_yolo <input_json> <output_dir> <img_width> <img_height>
```

---

## Review Request Guide
- State which pipeline step (pseudo-labeling / split / JSON conversion) was used.
- Include source image roots and output label paths.
- Attach summary counts for matched pairs and per-split totals.
- If `manual_review_required.csv` was generated, include flagged frame count.
- State whether DVC pull was required or skipped.
