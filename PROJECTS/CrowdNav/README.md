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
# preprocess / validate labels
python scripts/automate_preprocessing.py data/raw/jrdb/annotations data/raw/jrdb/images data/processed/auto_labels 1920 1080 --recursive

# train / validate / export YOLO model
python scripts/train_yolo.py --model yolov8x.pt --data data/processed/splits/data.yaml --epochs 5 --imgsz 640 --export onnx
```

## Review Request Guide
- Link the exact scope under `PROJECTS/CrowdNav` that changed.
- Include one command used to validate your change.
- Include output artifact path(s) if generated.
- Link SysML diagram section when architecture-level behavior changed.
