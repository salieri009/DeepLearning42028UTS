<p align="center">
  <img src="./project_logo.svg" alt="Project Logo" width="120" />
  <h1 align="center">Crowd Detection and Accessibility Navigation</h1>
  <p align="center"><strong>Real-time crowd & proximity alerts for mobility-impaired travellers.</strong></p>
</p>

![Release](https://img.shields.io/badge/Release-v2.5.0-blue?style=flat-square)
![Live Demo](https://img.shields.io/badge/Live_Demo-Operational-success?style=flat-square)
![Subject](https://img.shields.io/badge/Subject-Deep_Learning_42028-blue?style=flat-square)
![University](https://img.shields.io/badge/University-UTS_2026-002366?style=flat-square)

YOLOv8 person detection + bounding-box proximity heuristics, served as **React → Spring Boot → FastAPI/YOLO**. Fine-tuned on [JRDB](https://jrdb.erc.monash.edu/) (Stanford JackRabbot data, Monash ERC host).

## Quick start (Docker)

```bash
cd application
mkdir -p models && cp inference-service/best.pt models/best.pt   # Windows: copy inference-service\best.pt models\best.pt
docker compose up --build
```

Open **http://localhost** → **Start Detection** → allow webcam. Needs `application/models/best.pt` (shipped copy in `inference-service/`).

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| API | http://localhost:8080/api/v1/analyze-frame |
| Inference (internal) | http://localhost:9000/health |

**Local dev:** run [inference-service](application/inference-service/README.md), [backend](application/backend/README.md), and [frontend](application/frontend/README.md) on ports 9000 / 8080 / 5173.

## Repository

```text
train/          YOLO training, preprocessing, notebooks
application/    React UI, Spring API, FastAPI inference (docker-compose.yml)
infra/          SageMaker launcher, Docker wrapper
docs/           Specs, architecture, runbooks, diagrams
data/           Dataset root (DVC) — see docs/DATA.md
```

**Python setup** (repo root): `python -m venv .venv` → activate → `pip install -r requirements.txt`  
**Train:** `cd train && python scripts/train_yolo.py` (default `yolov8m.pt`, 8:1:1 split)  
**Data:** `dvc pull` — details in [`docs/DATA.md`](docs/DATA.md)  
**Cloud train:** [`infra/sagemaker/sagemaker_launch.py`](infra/sagemaker/sagemaker_launch.py) (default `ml.g5.xlarge`)

## Documentation

| Doc | Topic |
|-----|-------|
| [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) | FR / NFR |
| [`docs/API_SPEC.md`](docs/API_SPEC.md) | REST + inference API |
| [`docs/TechSpec.md`](docs/TechSpec.md) | Stack & deployment |
| [`docs/PRD.md`](docs/PRD.md) | Product vision |
| [`docs/DATA.md`](docs/DATA.md) | DVC & dataset layout |
| [`docs/reports/Final_Training_Report.md`](docs/reports/Final_Training_Report.md) | Training results |
| [`docs/RELEASE_v2.5.0.md`](docs/RELEASE_v2.5.0.md) | v2.5.0 release notes |
| [`docs/architecture/`](docs/architecture/) · [`docs/diagrams/`](docs/diagrams/) · [`docs/decisions/`](docs/decisions/) | Architecture & ADRs |

## Team

| Name | ID | Focus | Commits* | Share* |
|------|-----|-------|----------|--------|
| Jungwook Van | 25167747 | YOLO training (lead), inference & alerting | 193 | 97.0% |
| Phoi Gia Vuong | 25736012 | Data pipeline, preprocessing, documentation | 3 | 1.5% |
| Chihyun An | 14707133 | Frontend UI | 3 | 1.5% |

\*From `git log --all --no-merges` on `main` (excludes merge commits and bots). `Salieri009` + `Jungwook Van` are the same contributor (`kordalek@*` emails). Last updated: 2026-06-18.

## Assignment (42028 S1 2026)

- **3 students** per group; **model training required** (transfer learning OK).
- Parts A & E & G submitted **individually**; B–D one per team. Oral defense (G) is mandatory.
- Filename: `Assignment-3-<Part>-<Name>-<ID>.pdf`

Questions → subject coordinator by email.

<p align="center"><strong>UTS Deep Learning (42028) · Semester 1, 2026</strong></p>
