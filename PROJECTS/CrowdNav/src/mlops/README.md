---
last_updated: 2026-04-22
related_code:
  - src/mlops/train_pipeline.py
  - src/clearml_smoketest.py
  - src/utils/clearml_setup.py
  - scripts/train_yolo.py
related_diagram:
  - PROJECTS/sysml/System_Architecture_Documentation.md
---

# src/mlops

Training lifecycle and experiment support for YOLO training.

## Current Components
- `train_pipeline.py`: reusable wrapper for train, validate, export.
- `clearml_smoketest.py`: minimal ClearML connectivity check.
- `utils/clearml_setup.py`: helper to initialize/log ClearML task context.

## CLI Entry
```bash
python scripts/train_yolo.py \
  --model yolov8x.pt \
  --data data/processed/splits/data.yaml \
  --epochs 5 \
  --imgsz 640 \
  --export onnx
```

## Expected Artifacts
- training run directory under YOLO output root
- validation metrics from `validate()`
- exported model file when `--export` is set

## Review Request Guide
- Include model, data yaml path, epochs, imgsz, and export format.
- Include validation metric snapshot from the run.
- Note whether ClearML tracking was enabled and task ID if available.
- Note artifact path(s) produced by the run.
