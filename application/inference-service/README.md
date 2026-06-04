# Inference service (FastAPI + YOLO)

Python inference process behind the Spring `crowdnav-api`. It loads a trained
**Ultralytics YOLOv8** checkpoint (`best.pt`) and runs person detection plus the
collision-avoidance proximity heuristics, returning the TechSpec-shaped JSON the
backend forwards to the React UI.

**Weights:** loads `best.pt` (e.g. the checkpoint produced by AWS SageMaker training).
Point `MODEL_PATH` at it, or place it next to `main.py`. The repo ships a working copy
as `best.pt` in this directory; the Docker stack mounts `application/models/best.pt`.

## Install & run

```bash
cd inference-service
pip install -r requirements.txt
uvicorn main:app --reload --port 9000
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `MODEL_PATH` | `./best.pt` | Path to the YOLO `best.pt` checkpoint |
| `CONF_THRESH` | `0.35` | YOLO confidence threshold (0–1) |

## Endpoints

- `GET /health` — returns `{"status":"ok","model":"ready"}` (200) when the model file is
  present, or **503** if `MODEL_PATH` is missing.
- `POST /internal/infer` — body `{ "frame_base64": "<base64 JPEG/PNG>" }`. Decodes the
  frame, runs YOLO (class 0 = person), and returns real detections:

```json
{
  "persons": [
    { "class": "person", "confidence": 0.89,
      "bbox": { "x_center": 0.52, "y_center": 0.50, "width": 0.14, "height": 0.34 },
      "proximity_risk": "DANGER" }
  ],
  "crowd_density": "HIGH",
  "max_proximity_risk": "DANGER",
  "recommendation": "STOP"
}
```

Proximity risk is derived from each box's normalised height (`SAFE` < 0.25 ≤ `WARNING`
< 0.45 ≤ `DANGER`), mirroring `train/src/inference/collision_avoidance.py`. Returns **400**
on a missing/invalid `frame_base64` and **503** if the model cannot be loaded.
