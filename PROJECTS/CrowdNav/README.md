---
last_updated: 2026-04-24
related_code:
  - scripts/train_yolo.py
  - scripts/automate_preprocessing.py
  - src/
related_diagram:
  - PROJECTS/sysml/System_Architecture_Documentation.md
---

# CrowdNav (Project Scope README)

This README is the project-local summary for `PROJECTS/CrowdNav`.

Canonical project overview, setup, and top-level workflow documentation is maintained in the repository root README:
- `README.md`

## What Lives Here
- `src/data/formats/`: shared YOLO label and dataset config utilities (single source of truth)
- `src/data/prepare/`: official data preparation pipeline entry-points
- `src/data/preprocessing/`: JRDB JSON parsing and conversion internals
- `src/`: inference, analysis (Awareness layer), and mlops Python modules
- `scripts/`: command-line wrappers for preprocessing and training (thin — all logic in `src/`)
- `data/`: raw and processed data roots
- `deploy/`: docker and training skeleton artifacts
- `PROJECTS/`: PRD, TechSpec, and SysML architecture docs

## Situational Awareness
The pipeline supports **Extended YOLO Format** (6 columns) which includes `track_id`,
controlled via the `include_track_id` option in `src/data/formats/yolo_label.py`.
This enables the **Awareness Layer** for:
- People density analysis
- Heading and movement flow estimation
- Bottleneck detection in crowded environments

## Primary Commands
```bash
# preprocess / pseudo-label (images -> YOLO txt labels)
python src/data/pseudo_label_yolov8.py --src-dir data/raw/images --out-dir data/processed/labels

# split dataset (train/val/test) for training
# run once per camera view and merge into one splits/ folder via --stem-prefix
python src/data/split_by_sequence.py --src-labels data/processed/labels --src-images data/raw/images/image_0 --output-dir data/processed/splits --stem-prefix image0 --train-ratio 0.7 --val-ratio 0.2 --seed 42
python src/data/split_by_sequence.py --src-labels data/processed/labels --src-images data/raw/images/image_2 --output-dir data/processed/splits --stem-prefix image2 --train-ratio 0.7 --val-ratio 0.2 --seed 42

# train / validate / export YOLO model
python scripts/train_yolo.py --model-cfg yolov8x.pt --data-yaml data/processed/splits/data.yaml --epochs 5 --imgsz 640 --export onnx

# Keras path: YOLO splits -> COCO JSON
python -m src.data.prepare.yolo_to_coco --splits-dir data/processed/splits --out-dir data/processed/coco

# Keras path: SageMaker entry-point (expects COCO JSON + images root)
python deploy/train_keras_skeleton.py \
  --train-json data/processed/coco/train.json \
  --val-json data/processed/coco/val.json \
  --images-root data/processed/splits
```

## Programmatic API (New)
```python
from src.data.prepare.pseudo_label import run as pseudo_label
from src.data.prepare.split import run as split_dataset
from src.data.prepare.jrdb_to_yolo import run as convert_json

# Use these entry-points for notebooks, orchestration, or testing
```

## Review Request Guide
- Link the exact scope under `PROJECTS/CrowdNav` that changed.
- Include one command used to validate your change.
- Include output artifact path(s) if generated.
- Link SysML diagram section when architecture-level behavior changed.
