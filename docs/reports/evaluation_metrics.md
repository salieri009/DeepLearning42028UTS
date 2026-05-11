# Evaluation Metrics — CrowdNav feat/full-integration

*Last updated: 2026-05-11*

## 1. Overview

This document records the evaluation results for the integrated CrowdNav system on branch `feat/full-integration`. It covers:

- YOLO model validation metrics (mAP, precision, recall)
- End-to-end inference FPS benchmark
- Comparison against prior training phases

The model used is the YOLOv8m checkpoint produced in Phase C (see [Final_Training_Report.md](Final_Training_Report.md)).

---

## 2. Model Checkpoint

| Field | Value |
|---|---|
| Architecture | YOLOv8m |
| Source | Phase C fine-tune on JRDB ground-truth labels |
| Weights file | `runs/detect/runs/train/crowdnav_yolo/weights/best.pt` |
| SHA-256 | `486e9447d17ca75f3ec53e6dcf6016d1b5e73e07b6a17c96c23fc3d21510e7b4` |
| Trained on | RTX 3050 Laptop 4 GB, CUDA 12.1, PyTorch 2.5.1 |

---

## 3. Validation Metrics

Run command:
```bash
python train/scripts/train_yolo.py \
  --model-cfg runs/train/crowdnav_yolo/weights/best.pt \
  --data-yaml data/processed/splits/data.yaml \
  --epochs 1 --validate --exist-ok
```

Or directly via Python:
```python
from ultralytics import YOLO
m = YOLO("runs/train/crowdnav_yolo/weights/best.pt")
metrics = m.val(data="data/processed/splits/data.yaml", imgsz=640)
print(metrics.results_dict)
```

### 3.1 Results

#### Validation Split

| Metric | Value |
|---|---|
| mAP@IoU=0.5 | **0.4475** |
| mAP@IoU=0.5:0.95 | 0.2086 |
| Precision | 0.6685 |
| Recall | 0.4302 |

#### Test Split

| Metric | Value |
|---|---|
| mAP@IoU=0.5 | **0.6361** |
| mAP@IoU=0.5:0.95 | 0.3684 |
| Precision | 0.7615 |
| Recall | 0.5136 |

---

## 4. FPS Benchmark

### 4.1 Method

Warm-up 5 requests, then N=50 requests against the running inference service:

```bash
# Start inference service first:
MODEL_PATH=runs/train/crowdnav_yolo/weights/best.pt uvicorn main:app --port 9000

# Then run:
python -c "
import time, base64, requests, numpy as np, cv2

dummy = np.zeros((480, 640, 3), dtype=np.uint8)
_, buf = cv2.imencode('.jpg', dummy)
b64 = base64.b64encode(buf.tobytes()).decode()
payload = {'frame_base64': b64}
url = 'http://localhost:9000/internal/infer'

for _ in range(5):
    requests.post(url, json=payload)

N = 50
t0 = time.perf_counter()
for _ in range(N):
    requests.post(url, json=payload)
elapsed = time.perf_counter() - t0
print(f'FPS: {N/elapsed:.1f}   Latency: {1000*elapsed/N:.1f} ms')
"
```

### 4.2 Results

| Hardware | FPS | Avg Latency (ms) |
|---|---|---|
| *(fill after run)* | *(fill)* | *(fill)* |

> The frontend captures frames at 2 FPS (500 ms interval). Any latency under 500 ms per inference call is sufficient for real-time display.

---

## 5. Phase Comparison

| Phase | Labels | Epochs | mAP@0.5 (Val) | Notes |
|---|---|---|---|---|
| A — Baseline | Pseudo-labels (COCO pretrained) | 20 | 0.2556 | Starting point |
| B — JRDB GT | Ground-truth JRDB annotations | 50 | 0.4127 | +61% over Phase A |
| C — Fine-tune | Resume from Phase B | 20 | **0.4475** | +8% over Phase B |
| feat/full-integration | Same weights as Phase C | — | *(validation TBD)* | Integration branch |

---

## 6. Reproduction Steps

### Prerequisites

```bash
pip install -e ./train
# Requires: data/processed/splits/data.yaml to exist
# Requires: runs/train/crowdnav_yolo/weights/best.pt to exist
```

### Full end-to-end test

```bash
# 1. Start inference service
cd application/inference-service
MODEL_PATH=../../runs/train/crowdnav_yolo/weights/best.pt uvicorn main:app --port 9000

# 2. Start Spring backend (mock mode for unit tests, remote for real inference)
cd application/backend/crowdnav-api
APP_INFERENCE_MODE=remote ./gradlew bootRun

# 3. Test the pipeline
curl -s http://localhost:9000/health
curl -s -X POST http://localhost:8080/api/v1/analyze-frame \
  -H "Content-Type: application/json" \
  -d '{"frame_base64": ""}' | python -m json.tool
```

### Docker full-stack

```bash
cd infra/docker
MODEL_DIR=/absolute/path/to/weights docker compose up --build
# Frontend: http://localhost:8080
```
