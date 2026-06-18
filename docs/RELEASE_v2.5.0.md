# Release v2.5.0

**Date:** 2026-06-18  
**Previous:** v2.2.0 (frontend) / v2.0.0 (backend & train packages)

## Package versions

| Component | Artifact | Version |
|-----------|----------|---------|
| Frontend | `application/frontend` | **2.5.0** |
| Backend API | `application/backend/crowdnav-api` | **2.5.0** |
| Train | `train` (`crowdnav-train`) | **2.5.0** |

## Highlights

- **Placeholder → live features** — Record (WebM), Export (session JSON), Generate Report (HTML), TopNav notifications, Archive VIEW DETAIL, Settings Add Source, SideNav Health/Assets/Help/Logout (FR-UI-5 … FR-UI-12)
- **Shared features** — `session-recording`, `session-export`, `report-generation`, `AlertHistoryProvider`, `customSourcesStorage`
- **Docker** — frontend Nginx proxies `/api/` and `/actuator/`; compose images tagged `2.5.0`; backend `/actuator/**` CORS for health UI
- **Tests** — 65 Vitest RTL tests (incl. recording, session table, report builder)
- **Agent loop** — `.cursor/rules/gap-implementation-loop.mdc`, `application/scripts/loop-gap-impl.ps1`

## Docker images (GHCR)

| Service | Image |
|---------|-------|
| Frontend | `ghcr.io/salieri009/deeplearning42028uts/crowdnav-frontend:2.5.0` |
| Backend | `ghcr.io/salieri009/deeplearning42028uts/crowdnav-backend:2.5.0` |
| Inference | `ghcr.io/salieri009/deeplearning42028uts/crowdnav-inference:2.5.0` |

```bash
cd application
docker compose up --build
```

## Requirements traceability

See [`REQUIREMENTS.md`](REQUIREMENTS.md) FR-UI-7 … FR-UI-12 and [`ui_implementation_evaluate_matrix.md`](reports/ui_implementation_evaluate_matrix.md).
