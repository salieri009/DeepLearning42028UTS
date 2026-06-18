# Release v2.6.0

**Date:** 2026-06-18  
**Previous:** v2.5.1

## Package versions

| Component | Artifact | Version |
|-----------|----------|---------|
| Frontend | `application/frontend` | **2.6.0** |
| Backend API | `application/backend/crowdnav-api` | **2.6.0** |
| Train | `train` (`crowdnav-train`) | **2.6.0** |
| Inference | `application/inference-service` | **2.6.0** (image label aligned) |

## Highlights

### Backend & policy
- **CrowdNavPolicy** — shared Java policy module; `CrowdNavPolicyContractTest` guards parity with Python
- **Inference-service policy** — `crowdnav_policy.py` + contract test; `main.py` delegates to shared policy
- **Session API** — list filters (`started_after`, `client_label`, `source_type`), aggregate queries, closed-session 409 on analyze
- **Analytics** — hotspot/zone DTO labels (ADR-0011 Option A); synthetic data disclaimer fields
- **Async persistence** — `AsyncConfig`, bounded executor; `FramePersistenceService` sequence retry
- **OpenAPI** — `OpenApiConfig` + `OpenApiDocsTest`

### Frontend
- **Risk Hotspot Map** — session-ranking labels per ADR-0011; analytics disclaimer
- **Archive** — session list filters wired to API; export/preview refactor
- **Dashboard mobile** — `MobileStatsBar` in shell; nav vocabulary (Dashboard/Home, Archive/Logs)
- **Alert history** — bounded retention helper; honest meta for mock alerts
- **Orphan cleanup** — removed `map-controls` widget
- **Settings** — notification toggles honesty; `visual_overlays` path documented

### Docs & tooling
- **ADR-0011** — Risk Hotspot widget redesign decision
- **Technical debt discovery** — `docs/reports/technical_debt_review.md`, `loop-tech-debt.ps1` (10-section due-diligence loop)
- **API_SPEC / REQUIREMENTS** — session filters, density_limit, drift markers synced
- **Analytics hotspot gap analysis** — G-7/G-8 documented

## Docker images (GHCR)

| Service | Image |
|---------|-------|
| Frontend | `ghcr.io/salieri009/deeplearning42028uts/crowdnav-frontend:2.6.0` |
| Backend | `ghcr.io/salieri009/deeplearning42028uts/crowdnav-backend:2.6.0` |
| Inference | `ghcr.io/salieri009/deeplearning42028uts/crowdnav-inference:2.6.0` |

Image labels in all three Dockerfiles aligned to **2.6.0** (fixes prior 2.5.0 label drift).

```bash
cd application
docker compose up --build
```

Thin wrapper (no Postgres): `infra/docker/docker-compose.yml`

## Requirements traceability

| Area | FR/NFR |
|------|--------|
| Session list filters | FR-11, API_SPEC §sessions |
| Closed session 409 | user_scenarios S3 |
| Analytics hotspot labels | FR-14, ADR-0011 |
| Policy contract | NFR policy parity |
| Tech debt review | engineering hygiene (non-FR) |

See [`REQUIREMENTS.md`](REQUIREMENTS.md), [`API_SPEC.md`](API_SPEC.md), [`technical_debt_review.md`](reports/technical_debt_review.md).
