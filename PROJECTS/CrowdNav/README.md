---
last_updated: 2026-04-25
related_code:
  - scripts/train_yolo.py
  - scripts/self_train_loop.py
  - scripts/automate_preprocessing.py
  - src/
related_diagram:
  - PROJECTS/docs/data_pipeline_diagram.md
  - PROJECTS/sysml/System_Architecture_Documentation.md
---

# CrowdNav (package README)

This folder is the **main application**: JRDB → YOLO labels → train/val/test → **Ultralytics YOLO** training → inference / MLOps helpers.

**Assignment-level overview** (setup, DVC, FAQ): repository root [`README.md`](../../README.md).

## Layout

| Path | Role |
|------|------|
| `src/data/formats/` | YOLO label + `data.yaml` writers (single source of truth) |
| `src/data/prepare/` | Official `pseudo_label`, `split`, COCO conversion APIs |
| `src/data/preprocessing/` | JRDB JSON → YOLO conversion internals |
| `src/inference/` | Depth / collision-avoidance / alerts |
| `src/mlops/` | `TrainPipeline`, `training_device`, cycle logging |
| `scripts/` | CLIs: `train_yolo.py`, `self_train_loop.py`, `automate_preprocessing.py` |
| `data/` | `raw/`, `processed/` (usually gitignored; use DVC if configured) |
| `deploy/` | PyTorch + CUDA Dockerfile, `docker-compose` (Jupyter + GPU) |
| `notebooks/` | Training notes (SageMaker **ml.g4dn.xlarge** + local CUDA) |
| `PROJECTS/docs/` | Architecture diagrams (e.g. `data_pipeline_diagram.md`) |
| `PROJECTS/sysml/` | SysML and test-dataset requirements |

## Training defaults (YOLO)

| Parameter | Default | Notes |
|-----------|---------|--------|
| Model | `yolov8m.pt` | `TrainPipeline` / `train_yolo.py` |
| `data.yaml` | `data/processed/splits/data.yaml` | `path: .` in YAML for portability |
| Epochs / patience | 100 / 20 | Early stopping |
| Batch / workers | 16 / 4 | Tuned for **ml.g4dn.xlarge** (T4, 16 GB system RAM) |
| Device | Auto | `src/mlops/training_device.py` — GPU if `torch.cuda.is_available()`, else CPU; `CROWDNAV_DEVICE` or `--device` overrides |
| Split | 8 : 1 : 1 | `split_by_sequence.py` / `prepare/split` |

**No S3 required:** run on a SageMaker GPU notebook (data on EBS) or a local CUDA machine; pass `--data-yaml` to any path that contains `train/`, `val/`, `test/` and `data.yaml`.

## Primary commands

```bash
# From this directory (PROJECTS/CrowdNav), with venv active

# 1) Pseudo-label (default model yolov8m, conf 0.4, manual 0.6)
python -m src.data.pseudo_label_yolov8 --src-dir data/raw/images --out-dir data/processed/labels

# 2) Split 8:1:1 (once per camera view; use --stem-prefix to avoid name clashes)
python src/data/split_by_sequence.py --src-labels data/processed/labels --src-images data/raw/images/image_0 --output-dir data/processed/splits --stem-prefix image0 --train-ratio 0.8 --val-ratio 0.1 --seed 42
python src/data/split_by_sequence.py --src-labels data/processed/labels --src-images data/raw/images/image_2 --output-dir data/processed/splits --stem-prefix image2 --train-ratio 0.8 --val-ratio 0.1 --seed 42

# 3) Train (SageMaker ml.g4dn.xlarge or local — same command)
python scripts/train_yolo.py \
  --data-yaml data/processed/splits/data.yaml \
  --model-cfg yolov8m.pt --epochs 100 --batch 16 --workers 4

# 4) Optional: multi-cycle self-train (5×15 epochs per cycle by default)
python scripts/self_train_loop.py

# 5) Optional: YOLO splits → COCO → Keras skeleton
python -m src.data.prepare.yolo_to_coco --splits-dir data/processed/splits --out-dir data/processed/coco
python deploy/train_keras_skeleton.py \
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

## Situational awareness (6-column YOLO)

**Extended format** (optional 6th column: `track_id`) is implemented in `src/data/formats/yolo_label.py` and supports density / flow analysis in later layers.

## Change review checklist

- Scope under `PROJECTS/CrowdNav` and one validation command.
- Output paths for generated artifacts.
- Update [`PROJECTS/docs/data_pipeline_diagram.md`](PROJECTS/docs/data_pipeline_diagram.md) or SysML if behavior changes.
