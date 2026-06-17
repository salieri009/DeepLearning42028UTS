# Release v2.0.0

**Date:** 2026-06-18  
**Previous:** v0.1.0

## Package versions

| Component | Artifact | Version |
|-----------|----------|---------|
| Frontend | `application/frontend` | **2.0.0** |
| Backend API | `application/backend/crowdnav-api` | **2.0.0** |
| Train | `train` (`crowdnav-train`) | **2.0.0** |

## Highlights

- **FSD frontend** — 5 routes (Dashboard, Analytics, Live Map, Archive, Settings), 38 Vitest RTL tests
- **Session persistence** — PostgreSQL-backed sessions, `session_id` on analyze-frame, Archive API
- **Specs** — `REQUIREMENTS.md`, `API_SPEC.md`, `DESIGN.md`, ERD
- **CI** — frontend `npm test`, backend `./gradlew test`, mypy strict fixes
- **Integration** — Spring remote inference, CORS, HTTP/1.1 JDK client
- **Training** — editable `crowdnav-train` package, GT label scripts, Phase D hyperparams

## Commits since v0.1.0

```
17f6b24 chore: ignore local agent, packaging, and build artifact dirs
5453d12 fix(train): mypy attr-defined override on ultralytics import sites
f9d3454 fix(ci): mypy ultralytics overrides for installed package on CI
07a1277 fix(train): mypy override for ultralytics root module
7ba6500 fix(train): satisfy mypy strict for ultralytics YOLO imports
b1e86dd feat: FSD frontend, session persistence, RTL tests, archive loop reports
4f1f775 docs(readme): trim to concise English quick-start guide
087d48b docs: add FR/NFR specs, API contract, and README documentation index
8c9d689 fix(frontend): healthcheck uses 127.0.0.1 not localhost
2714c6d docs: update team roster, mark demo operational
0da9d3b test(api): run controller tests in mock mode
cc42769 docs(readme): add Run the Application guide
00f1c2c fix(api): restore HTTP/1.1 to inference call
962de55 Fix CORS configuration and enable remote inference mode
2851eaa feat(data): GT splits rebuild script with dual-camera support
08136f1 feat(data): replace splits labels with official GT labels
6baa98c feat(train): augmentation YAML and model-size presets
1e110d0 feat(train): lr0/lrf hyperparams for Phase D fine-tuning
ec2bec2 fix: clean up test indentation and video type import path
a131f86 fix(backend): RemoteAnalyzeFrameService JDK HttpClient HTTP/1.1
50ef0c2 docs(diagrams): UML and SysML diagram suite
```

## ADR tracker

See GitHub issue **ADR Decision Log** (single tracking issue for all architecture decisions).
