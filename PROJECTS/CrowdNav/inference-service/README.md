# Inference service (stub)

Python-side placeholder aligned with the future split: Java `crowdnav-api` orchestrates; this process runs YOLO + proximity logic later.

**Weights:** Real inference will load **`best.pt` produced when AWS SageMaker training finishes** (download/copy from the training job output or S3 into a local path and reference it here). Same contract as `PROJECTS/TechSpec.md` §4.2 — local process, not a managed SageMaker inference endpoint.

## Install & run

```bash
cd inference-service
pip install -r requirements.txt
uvicorn main:app --reload --port 9000
```

- `GET /health` — liveness
- `POST /internal/infer` — returns stub JSON (wire Ultralytics + `src/inference/` next)
