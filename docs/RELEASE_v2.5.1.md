# Release v2.5.1

**Date:** 2026-06-18  
**Previous:** v2.5.0

## Package versions

| Component | Artifact | Version |
|-----------|----------|---------|
| Frontend | `application/frontend` | **2.5.1** |
| Backend API | `application/backend/crowdnav-api` | **2.5.1** |
| Train | `train` (`crowdnav-train`) | **2.5.1** |

## Highlights

- **Design enrichment loop** — `loop-design-enrich.ps1`, rotating 9-slice queue, `run-design-enrich-10.ps1`, `run-all-loops-3.ps1` (gap + design)
- **Glass×Y2K UI polish** — ControlBar divider/glow, StatsSidebar hierarchy, TopNav token cleanup, StatCard contrast, shared glass/hover/focus states (DESIGN_RULES §1–7)
- **Accessibility touches** — `focus-visible` on nav controls, alerts `h3`, `prefers-reduced-motion` on pulses, 40px pagination hit targets

## Docker images (GHCR)

| Service | Image |
|---------|-------|
| Frontend | `ghcr.io/salieri009/deeplearning42028uts/crowdnav-frontend:2.5.1` |
| Backend | `ghcr.io/salieri009/deeplearning42028uts/crowdnav-backend:2.5.1` |
| Inference | `ghcr.io/salieri009/deeplearning42028uts/crowdnav-inference:2.5.1` |

```bash
cd application
docker compose up --build
```

## Requirements traceability

Design changes only — no FR/NFR logic changes. See [`DESIGN_RULES.md`](DESIGN_RULES.md) and [`ui_design_audit.md`](reports/ui_design_audit.md).
