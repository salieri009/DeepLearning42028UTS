---
last_updated: 2026-04-24
purpose: Runbook for 10-cycle pseudo-label self-training on GPU
---

## Prereqs (GPU)

- NVIDIA driver + CUDA installed
- PyTorch CUDA build installed (verify `torch.cuda.is_available()` is True)
- In this repo, Ultralytics uses `--device 0` to target the first GPU

Quick check:

```bash
python -c "import torch; print('cuda', torch.cuda.is_available(), torch.cuda.get_device_name(0) if torch.cuda.is_available() else None)"
```

## Data layout (expected)

```text
data/raw/images/
  image_0/<sequence>/*.jpg
  image_2/<sequence>/*.jpg

data/processed/labels/
  <sequence>/*.txt
  manual_review_required.csv
  pseudo_label_checkpoint.json

data/processed/splits/
  train/images + train/labels
  val/images + val/labels
  test/images + test/labels
  data.yaml
```

## Single-cycle commands (manual)

### 1) Train (produces `weights/best.pt`)

```bash
python scripts/train_yolo.py ^
  --model-cfg yolov8x.pt ^
  --data-yaml data/processed/splits/data.yaml ^
  --epochs 5 ^
  --imgsz 640 ^
  --batch 16 ^
  --device 0 ^
  --validate ^
  --project runs/train ^
  --name selftrain_c00
```

### 2) Pseudo-label regenerate (overwrite)

```bash
python src/data/pseudo_label_yolov8.py ^
  --model runs/detect/runs/train/selftrain_c00/weights/best.pt ^
  --src-dir data/raw/images ^
  --out-dir data/processed/labels ^
  --device cuda ^
  --overwrite-existing ^
  --checkpoint-interval 500
```

Resume behavior:
- if you omit `--overwrite-existing`, existing `.txt` are skipped (resume fill-missing mode)
- `pseudo_label_checkpoint.json` is updated every `--checkpoint-interval`

### 3) Split regenerate (merge two cameras into one `splits/`)

```bash
python src/data/split_by_sequence.py --src-labels data/processed/labels --src-images data/raw/images/image_0 --output-dir data/processed/splits --stem-prefix image0
python src/data/split_by_sequence.py --src-labels data/processed/labels --src-images data/raw/images/image_2 --output-dir data/processed/splits --stem-prefix image2
```

## 10-cycle automation (recommended)

Use the orchestrator:

```bash
python scripts/self_train_loop.py ^
  --cycles 10 ^
  --base-model yolov8x.pt ^
  --device 0 ^
  --epochs 5 ^
  --imgsz 640 ^
  --batch 16 ^
  --overwrite-labels ^
  --checkpoint-interval 500 ^
  --project runs/train ^
  --name-prefix selftrain ^
  --log-dir scratch/self_train_logs
```

### Logs/artefacts

- Cycle logs: `scratch/self_train_logs/cycle_XX.json`
- Compact metrics:
  - `scratch/self_train_logs/cycle_XX_metrics.json`
  - `scratch/self_train_logs/cycle_metrics.csv`

## Sanity checks

- Split integrity:
  - `train/val/test` each has `images == labels`
  - stem sets match (no missing/orphans)
- Label noise proxy:
  - `manual_review_required.csv` rows / total candidate frames
  - sudden increase suggests noisy pseudo-labels

