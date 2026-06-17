# infra — deployment glue

Infrastructure for **running the webapp in Docker** and **training on AWS SageMaker**. Application runtime code lives under `application/`; training code under `train/`.

| Path | Purpose |
|------|---------|
| [`docker/`](docker/) | Thin Compose wrapper → canonical [`application/docker-compose.yml`](../application/docker-compose.yml) |
| [`sagemaker/`](sagemaker/) | SageMaker launcher + in-container training entrypoint ([README](sagemaker/README.md)) |
| [`scripts/`](scripts/) | Artifact handoff helpers (`best.pt` from S3) |
| [`setup.sh`](setup.sh) | Optional SageMaker Studio notebook lifecycle hook |
| [`versions.lock.toml`](versions.lock.toml) | Shared `ultralytics` pin across train / SM / inference |

## Architecture (ADR-0003)

- **Docker** packages frontend + Spring backend + FastAPI inference (`best.pt` bind-mount).
- **SageMaker** runs YOLO fine-tuning via `TrainPipeline` (`crowdnav-train`) and uploads `model.tar.gz` to S3.
- The two paths connect only via the **`best.pt` checkpoint** — no shared training code in the webapp image.

> **Version lock:** Load SageMaker-produced `best.pt` in the inference container using the **same ultralytics version** as training (see [`versions.lock.toml`](versions.lock.toml)).

## Quick links

- Live demo: root [`README.md`](../README.md#run-the-application-live-demo)
- SageMaker runbook: [`docs/runbooks/SageMaker_Migration_Plan.md`](../docs/runbooks/SageMaker_Migration_Plan.md)
- Design decision: [`docs/decisions/ADR-0003-deployment-split-docker-sagemaker.md`](../docs/decisions/ADR-0003-deployment-split-docker-sagemaker.md)
