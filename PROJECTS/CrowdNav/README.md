---
last_updated: 2026-04-22
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
- `src/`: preprocessing, inference, and mlops Python modules
- `scripts/`: command-line wrappers for preprocessing and training
- `data/`: raw and processed data roots
- `deploy/`: docker and training skeleton artifacts
- `PROJECTS/`: PRD, TechSpec, and SysML architecture docs

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
```

## Review Request Guide
- Link the exact scope under `PROJECTS/CrowdNav` that changed.
- Include one command used to validate your change.
- Include output artifact path(s) if generated.
- Link SysML diagram section when architecture-level behavior changed.
