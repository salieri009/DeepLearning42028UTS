---
last_updated: 2026-05-02
related_code:
  - scripts/train_yolo.py
  - scripts/eval_yolo.py
  - scripts/self_train_loop.py
  - scripts/automate_preprocessing.py
  - src/
related_diagram:
  - ../docs/architecture/data_pipeline_diagram.md
  - ../docs/architecture/System_Architecture_Documentation.md
---

# CrowdNav — training & data (`train/`)

Python package for JRDB → YOLO labels → train/val/test → **Ultralytics YOLO** training, plus MLOps helpers.

**Dataset root** is **`../data/`** at the **repository root** (not inside `train/`). See [`docs/DATA.md`](../docs/DATA.md).

**Assignment overview:** repository root [`README.md`](../README.md).

## Layout

| Path | Role |
|------|------|
| `src/data/formats/` | YOLO label + `data.yaml` writers |
| `src/data/prepare/` | `pseudo_label`, `split`, COCO conversion APIs |
| `src/data/preprocessing/` | JRDB JSON → YOLO internals |
| `src/inference/` | Depth / collision-avoidance / alerts |
| `src/training/` | `TrainPipeline`, `training_device`, cycle logging |
| `src/repo_paths.py` | Resolves repo root for default `data/...` paths |
| `scripts/` | CLIs: `train_yolo.py`, `eval_yolo.py`, `self_train_loop.py`, … |
| `notebooks/` | SageMaker / local CUDA notes |

**Elsewhere in the repo:** `application/` (API + clients), `infra/` (Docker, SageMaker), `docs/`.

## Training defaults (YOLO)

| Parameter | Default | Notes |
|-----------|---------|--------|
| Model | `yolov8m.pt` | Override with `--model-cfg` |
| `data.yaml` | `<repo>/data/processed/splits/data.yaml` | `path: .` inside splits dir |
| Epochs / patience | 100 / 20 | Early stopping |
| Batch / workers | 16 / 4 | Fits **ml.g4dn.xlarge** |
| Device | Auto | `src/training/training_device.py` |

## Primary commands

From **`train/`** (recommended):

```bash
# 1) Pseudo-label (defaults use <repo>/data/...)
python -m src.data.pseudo_label_yolov8

# 2) Split 8:1:1 — pass repo-level data paths (examples)
python src/data/split_by_sequence.py \
  --src-labels ../data/processed/labels \
  --src-images ../data/raw/images/image_0 \
  --output-dir ../data/processed/splits \
  --stem-prefix image0 --train-ratio 0.8 --val-ratio 0.1 --seed 42

# 3) Train
python scripts/train_yolo.py --model-cfg yolov8m.pt --epochs 100 --batch 16 --workers 4

# 3b) Val / export ONNX from checkpoint (no training)
python scripts/eval_yolo.py --weights runs/train/<run>/weights/best.pt --export-onnx

# 4) Self-train loop
python scripts/self_train_loop.py

# 5) YOLO → COCO → Keras skeleton (run Keras script from repo root)
python -m src.data.prepare.yolo_to_coco
cd .. && python infra/train_keras_skeleton.py \
  --train-json data/processed/coco/train.json \
  --val-json data/processed/coco/val.json \
  --images-root data/processed/splits
```

## Programmatic API (`src/data/prepare/`)

```python
from src.data.prepare.pseudo_label import run as pseudo_label
from src.data.prepare.split import run as split_dataset
from src.data.prepare.jrdb_to_yolo import run as convert_json
```

## Change review

- Touch `train/` or `docs/` diagrams if pipeline behavior changes.
- Validate with `python scripts/train_yolo.py --help`.
