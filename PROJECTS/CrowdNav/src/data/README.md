---
last_updated: 2026-04-24
related_code:
  - src/data/prepare/
  - src/data/formats/
  - src/data/preprocessing/
  - src/data/pseudo_label_yolov8.py
  - src/data/jrdb_to_yolo.py
  - src/data/split_by_sequence.py
  - scripts/automate_preprocessing.py
related_diagram:
  - PROJECTS/docs/data_pipeline_diagram.md
---

# src/data

Data preprocessing and dataset preparation modules for CrowdNav.  
All scripts operate on the **JRDB dataset** (`data/raw/images/image_0/`, `data/raw/images/image_2/`), targeting the `person` class only.

## Package Structure

```text
src/data/
  formats/                  ← Shared YOLO label & dataset config utilities (single source of truth)
    yolo_label.py           ← format / parse / validate YOLO label lines (5 or 6 columns)
    dataset_config.py       ← write_data_yaml(), write_classes_txt()
  prepare/                  ← Official data preparation pipeline entry-points
    jrdb_to_yolo.py         ← GT JSON → YOLO conversion (wraps preprocessing/)
    pseudo_label.py         ← YOLOv8 inference pseudo-labeling
    split.py                ← Sequence-level train/val/test split
    reporting.py            ← Label/image validation and reporting
  preprocessing/            ← JRDB JSON parsing & conversion internals
    types.py                ← BoundingBox, YoloBox, AnnotationRecord dataclasses
    io_utils.py             ← JSON loading, raw item iteration, bbox parsing
    converter.py            ← Coordinate normalisation (xyxy → YOLO xywh) + file writing
    cli.py                  ← CLI entrypoint and ConversionSummary
  pseudo_label_yolov8.py    ← Legacy CLI entry (delegates to prepare.pseudo_label logic)
  split_by_sequence.py      ← Legacy CLI entry (delegates to prepare.split logic)
  jrdb_to_yolo.py           ← Legacy CLI entry (delegates to preprocessing.cli)
```

## YOLO Label Format

CrowdNav supports **both** standard and extended label formats via a single option:

| Format | Columns | Example |
|---|---|---|
| Standard (5-col) | `class x y w h` | `0 0.512000 0.634000 0.123400 0.245600` |
| Extended (6-col) | `class x y w h track_id` | `0 0.512000 0.634000 0.123400 0.245600 101` |

- The **extended format** appends `track_id` for downstream situational awareness tasks.
- Label formatting and parsing is centralised in `src/data/formats/yolo_label.py`.
- The `include_track_id` parameter controls which format is emitted.

---

## Step 1: YOLOv8 Pseudo-Labeling (Primary)

Runs pre-trained YOLOv8 on all frames in `data/raw/images/image_0/` and `data/raw/images/image_2/`.

```bash
python src/data/pseudo_label_yolov8.py

# With visual sanity check previews
python src/data/pseudo_label_yolov8.py --debug

# Custom confidence thresholds
python src/data/pseudo_label_yolov8.py --conf-thresh 0.45 --manual-thresh 0.75
```

**Programmatic API:**
```python
from src.data.prepare.pseudo_label import run
run(model="yolov8x.pt", src_dir=Path("data/raw/images"), out_dir=Path("data/processed/labels"))
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
# Run once per camera view and merge into one splits/ folder via --stem-prefix
python src/data/split_by_sequence.py \
  --src-labels data/processed/labels \
  --src-images data/raw/images/image_0 \
  --output-dir data/processed/splits \
  --stem-prefix image0 \
  --train-ratio 0.7 --val-ratio 0.2 --seed 42

python src/data/split_by_sequence.py \
  --src-labels data/processed/labels \
  --src-images data/raw/images/image_2 \
  --output-dir data/processed/splits \
  --stem-prefix image2 \
  --train-ratio 0.7 --val-ratio 0.2 --seed 42
```

**Programmatic API:**
```python
from src.data.prepare.split import run
run(src_labels=Path("data/processed/labels"), src_images=Path("data/raw/images/image_0"), stem_prefix="image0")
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
  1920 1080 \
  --recursive --skip-dvc-pull
```

Common options:
- `--validation-only` — skip conversion, validate existing labels only
- `--dry-run` — show planned actions without executing
- `--skip-dvc-pull` — skip DVC pull (use when working locally without DVC)
- `--fail-fast` — stop on first failure
- `--allow-duplicate-stems` — allow repeated frame stems across folders

**Programmatic API (single file):**
```python
from src.data.prepare.jrdb_to_yolo import run
summary = run(input_json=Path("annotations.json"), output_dir=Path("labels/"), img_width=1920, img_height=1080)
print(summary.written, summary.parsed)
```

Output report: `data/processed/labels/preprocessing_report.json`

---

## Single JSON Conversion (Manual)

```bash
python -m src.data.jrdb_to_yolo <input_json> <output_dir> <img_width> <img_height>

# Optionally write a machine-readable JSON summary
python -m src.data.jrdb_to_yolo annotations.json labels/ 1920 1080 --summary-json summary.json
```

---

## Review Request Guide
- State which pipeline step (pseudo-labeling / split / JSON conversion) was used.
- Include source image roots and output label paths.
- Attach summary counts for matched pairs and per-split totals.
- If `manual_review_required.csv` was generated, include flagged frame count.
- State whether DVC pull was required or skipped.
