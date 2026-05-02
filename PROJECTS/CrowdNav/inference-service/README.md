# Inference service (stub)

Python-side placeholder aligned with the future split: Java `crowdnav-api` orchestrates; this process runs YOLO + proximity logic later.

## Install & run

```bash
cd inference-service
pip install -r requirements.txt
uvicorn main:app --reload --port 9000
```

- `GET /health` — liveness
- `POST /internal/infer` — returns stub JSON (wire Ultralytics + `src/inference/` next)
