# infra/docker — Compose wrapper

The **canonical** Docker Compose file is [`application/docker-compose.yml`](../../application/docker-compose.yml) (FR-10).

This directory is a thin wrapper for operators who start the stack from `infra/` after SageMaker training.

## When to use which path

| Start from | Use when |
|------------|----------|
| `application/` | Default demo — weights in `application/models/best.pt` |
| `infra/docker/` | Same stack, but `MODEL_DIR` defaults to SageMaker / `runs/` output |

Both paths run the **same three services**; training is never performed in Docker (ADR-0003).

## Quick start

```bash
# From repo root — ensure weights exist
mkdir -p application/models
cp application/inference-service/best.pt application/models/best.pt

cd infra/docker
cp .env.example .env   # optional
docker compose up --build
```

Open **http://localhost**.

After a SageMaker job, fetch artifacts first:

```powershell
# Windows
.\infra\scripts\fetch_best_pt.ps1 -JobName crowdnav-yolo-1234567890
```

```bash
# macOS / Linux
./infra/scripts/fetch_best_pt.sh crowdnav-yolo-1234567890
```

Then set `MODEL_DIR` in `.env` to the extracted directory, or copy `best.pt` into `application/models/`.

See also: [`docs/runbooks/SageMaker_Migration_Plan.md`](../../docs/runbooks/SageMaker_Migration_Plan.md).
