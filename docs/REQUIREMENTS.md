---
last_updated: 2026-06-17
judge_report: docs/reports/ui_spec_judge_evaluation.md
status: draft
related:
  - docs/PRD.md
  - docs/TechSpec.md
  - docs/API_SPEC.md
  - docs/DETECTION_3CLASS_PLAN.md
  - docs/BACKEND_ERD.md
---

# Requirements Specification (FR / NFR)

## 1. Purpose & Scope

This document formalizes the prose requirements scattered in [`docs/PRD.md`](PRD.md) §5 into
**ID'd, testable Functional (FR) and Non-Functional (NFR) Requirements** with traceability to the
implementing source code. It is the single source of truth for *what the system must do*; the *how*
lives in [`docs/TechSpec.md`](TechSpec.md) and the per-area specs cross-referenced below.

**System under specification:** CrowdNav — a 3-tier computer-vision app
(**React → Spring Boot → FastAPI/YOLO**) that detects pedestrians/obstacles in a live camera feed and
returns crowd-density and proximity-risk guidance for travellers with mobility disabilities.

**Priority key (MoSCoW):** `M` Must · `S` Should · `C` Could · `W` Won't (this release).

## 2. Functional Requirements

| ID | Requirement | Pri | Source / Implemented in | Verification |
|----|-------------|-----|--------------------------|--------------|
| **FR-1** | Detect persons in a video frame using a fine-tuned YOLOv8m model. *Extended to 3 classes (person/wheelchair/luggage) per [`DETECTION_3CLASS_PLAN.md`](DETECTION_3CLASS_PLAN.md).* | M | `application/inference-service/main.py` (`model.predict(..., classes=[0])`) | Unit: mock frame → non-empty `persons[]`. mAP gate in NFR-3. |
| **FR-2** | Classify crowd density as `LOW` / `MEDIUM` / `HIGH`. Rule: `n==0`→LOW; `n≥6 or worst==DANGER`→HIGH; `n≥3 or worst==WARNING`→MEDIUM; else LOW. | M | `main.py:_crowd_density()` | Unit table over n ∈ {0,2,3,5,6} and worst-state combos. |
| **FR-3** | Estimate per-detection proximity risk `SAFE` / `WARNING` / `DANGER` from normalized bbox height. Thresholds: `<0.25`→SAFE, `<0.45`→WARNING, else DANGER. | M | `main.py:_alert_state()`; mirrors `train/src/inference/collision_avoidance.py` (`CollisionThresholds 0.25/0.45`) | Unit: heights {0.10, 0.30, 0.60} → {SAFE, WARNING, DANGER}. |
| **FR-4** | Render color-coded bounding boxes over the live feed: SAFE=green, WARNING=yellow, DANGER=red. | M | `application/frontend/src/widgets/video-stage/ui/VideoStage.tsx`, `entities/detection/PersonBBox.tsx` | Manual: webcam demo shows correct colors. |
| **FR-5** | Display a statistics panel: people count, crowd density, max proximity risk, recommendation (`PROCEED`/`CAUTION`/`STOP`). | M | `application/frontend/src/widgets/stats-sidebar/ui/StatsSidebar.tsx`; `main.py:_recommendation()` | Manual: panel values match API response. |
| **FR-6** | Accept a frame at `POST /api/v1/analyze-frame` as JSON (`frame_base64`) **and** as `multipart/form-data` (`image` part). | M | `application/backend/.../controller/AnalyzeFrameController.java` | Integration: both content types → HTTP 200 with valid body. |
| **FR-7** | Route the decoded frame from the Spring backend to the FastAPI inference service at `POST /internal/infer` over HTTP/1.1. | M | `application/backend/.../service/RemoteAnalyzeFrameService.java` | Integration: backend→inference returns detection payload. |
| **FR-8** | Validate input: reject empty/blank `frame_base64` (400) and undecodable base64 (400); surface inference unavailability (502/503). | M | `AnalyzeFrameController.java`; `RemoteAnalyzeFrameService.java`; `main.py` (`HTTPException`) | Integration: bad inputs → documented error codes (see [`API_SPEC.md`](API_SPEC.md) §6). |
| **FR-9** | Expose health endpoints for liveness/readiness of backend and inference (model-loaded check). | M | `main.py:/health`; Spring Actuator (`spring-boot-starter-actuator`) | `GET :9000/health` → 200 when `best.pt` present, 503 otherwise. |
| **FR-10** | Run the full stack via a single `docker compose up --build` (React :80 → Spring :8080 → FastAPI :9000). Canonical compose: [`application/docker-compose.yml`](../application/docker-compose.yml); [`infra/docker/`](../infra/docker/) is a thin wrapper with `MODEL_DIR` override. | M | `application/docker-compose.yml` | Manual: 3 containers healthy; browser path returns 200. |
| **FR-11** | Persist analysis sessions, frames, detections for history and analytics (opt-in via `session_id`). | S | `com.crowdnav.api.persistence.*`, `PersistingAnalyzeFrameService`, `FramePersistenceService` | Integration: session row + N frame/detection rows after a run with `session_id`. |
| **FR-12** | Expose session-history read APIs (`GET /api/v1/sessions`, `GET /api/v1/sessions/{id}/detections`). | S | `SessionController.java`, `SessionService.java` | Integration: stored session retrievable by id. |
| **FR-13** | *(Planned)* Detect and label `wheelchair` and `luggage` in addition to `person`, with class shown in overlay + stats. | S | New — see [`DETECTION_3CLASS_PLAN.md`](DETECTION_3CLASS_PLAN.md) | Per-class mAP gate; demo shows 3 distinct labels. |

### 2.1 UI Control Requirements (EARS)

| ID | Requirement | Pri | Source / Implemented in | Verification |
|----|-------------|-----|--------------------------|--------------|
| **FR-UI-1** | WHEN the user clicks **Start Monitoring** while idle, the system SHALL request camera permission via `getUserMedia`, attach the stream to the video element, reset alert history, and start a 500 ms analyze-frame polling loop. | M | `DashboardPage.tsx`, `useCrowdDetection.ts`, `ControlBar.tsx` | Manual: Start → live feed + stats update. |
| **FR-UI-2** | WHEN the user clicks **Stop Monitoring** (primary pill) or the **Stop** icon while running, the system SHALL clear the capture interval, stop all `MediaStream` tracks, cancel speech, reset alerts/history, and clear on-screen stats. | M | `DashboardPage.tsx`, `useCrowdDetection.stop()` | Manual: Stop → camera off, panel empty. |
| **FR-UI-3** | Stop controls SHALL use the `danger` button variant per [`DESIGN_RULES.md`](DESIGN_RULES.md) §3.1. | M | `ControlBar.tsx` | Visual: Stop pill + icon use danger styling. |
| **FR-UI-4** | Video overlays (bounding boxes, alert chips) SHALL stay within layout safe zones: header 64 px, sidebar 320 px (≥1024 px), control bar reserve 72 px from bottom. | M | `tokens.ts` `layout.*`, `VideoStage.tsx` | Visual: no overlap with fixed chrome at 1280×720+. |
| **FR-UI-5** | Placeholder controls (Record, Export, Generate Report, header notifications) SHALL remain disabled with `title="Coming soon"` until implemented. Analytics / Live Map / Archive / Settings routes are active. | C | `ControlBar.tsx`, `TopNav.tsx`, `StatsSidebar.tsx` | Manual: disabled + tooltip on placeholders only. |
| **FR-UI-6** | The running-state primary control label SHALL read **Stop Monitoring** (not "Pause"); true pause/resume semantics are **Won't** this release. | M | `ControlBar.tsx` | Visual: label matches behavior. |

## 3. Non-Functional Requirements

| ID | Category | Requirement | Target | Verification |
|----|----------|-------------|--------|--------------|
| **NFR-1** | Performance — latency | End-to-end inference latency per frame | **< 500 ms** | Benchmark logged to `docs/reports/evaluation_metrics.md` §4.2 (currently TBD). |
| **NFR-2** | Performance — throughput | Sustained frame processing rate (frontend captures every 500 ms) | **≥ 2 FPS** | Frontend capture interval + backend round-trip timing. |
| **NFR-3** | Accuracy | Person-class detection quality on JRDB | **mAP@0.5 > 0.40** (val) | Achieved **0.4475** (val), **0.6361** (test) — Phase C, `docs/reports/Final_Training_Report.md`. |
| **NFR-3b** | Accuracy (planned) | Per-class mAP@0.5 for 3-class model | person ≥ 0.40; wheelchair ≥ 0.35; luggage ≥ 0.35 | Eval split per [`DETECTION_3CLASS_PLAN.md`](DETECTION_3CLASS_PLAN.md) §6. |
| **NFR-4** | Portability | Run on commodity GPU and cloud unchanged | Local RTX 3050 (4 GB) and AWS SageMaker `ml.g4dn.xlarge` (T4) | Same commands run in both; documented in README. |
| **NFR-5** | Deployability | One-command containerized deployment | 3-service Docker stack, healthchecks pass | `docker compose up --build` end-to-end. |
| **NFR-6** | Security | No credentials/keys committed; CORS restricted to known origins | Zero secrets in VCS; explicit allowed-origins | `application.yml` `app.cors.allowed-origins`; secret scan in CI. |
| **NFR-7** | Maintainability | UI styling via design tokens, not hardcoded values | Token coverage; documented rules | [`DESIGN_RULES.md`](DESIGN_RULES.md), `shared/config/theme/tokens.ts` |
| **NFR-8** | Reliability | Persistence (FR-11) must not block the inference response | Async/non-blocking write; ≤ +0 ms to NFR-1 path | Load test: latency unchanged with persistence on (see ERD §6). |
| **NFR-9** | Privacy | No raw frames stored by default; persist only derived metadata (bboxes, states) | Frames not written to DB/disk | ERD stores normalized coordinates + labels only, not images. |
| **NFR-10** | Usability | Risk states must be distinguishable beyond color alone (label text on each box) | Text label per detection | `entities/detection/PersonBBox.tsx` renders risk + confidence label. |

## 4. Out of Scope (this release)

From [`docs/PRD.md`](PRD.md) §9 — explicitly **Won't (W)**:

| Item | Reason |
|------|--------|
| Audio / haptic alerts | Removed — proximity alerts are text + color only. |
| Screen-reader / WCAG / ARIA compliance | Removed — no accessibility audit in scope (note: NFR-10 keeps non-color cue). |
| Route selection / path-clearance markers | Deferred — static text recommendation only. |
| Visually-impaired audio feedback | Removed — no audio output. |
| Wheelchair/luggage detection in the *current shipped model* | The shipped `best.pt` is person-only; multi-class is the **planned** FR-13 (Should). |
| Pause/resume monitoring (camera stays on, loop paused) | **Won't** — Stop fully releases camera; see FR-UI-6. |
| Session create UI + `session_id` on analyze-frame | **Done** — `useCrowdDetection` auto-creates `WEBCAM` session on Start and passes `session_id` on each analyze call; closes on Stop. |

## 5. Traceability Matrix

| Req | Primary artifact |
|-----|------------------|
| FR-1, FR-2, FR-3 | `application/inference-service/main.py` |
| FR-3 (logic origin) | `train/src/inference/collision_avoidance.py` |
| FR-4, FR-10 (UI) | `application/frontend/src/widgets/video-stage/`, `entities/detection/PersonBBox.tsx` |
| FR-5 | `application/frontend/src/widgets/stats-sidebar/ui/StatsSidebar.tsx` |
| FR-UI-1 … FR-UI-6 | `pages/dashboard/`, `widgets/control-bar/`, `features/crowd-detection/` — see [`DESIGN.md`](DESIGN.md) §9 |
| FR-UI (pages) | `pages/analytics/`, `pages/live-map/`, `pages/archive/`, `pages/settings/` — see [`DESIGN.md`](DESIGN.md) §9.8 |
| FR-6, FR-8 | `application/backend/crowdnav-api/.../controller/AnalyzeFrameController.java` |
| FR-7, FR-8 | `application/backend/crowdnav-api/.../service/RemoteAnalyzeFrameService.java` |
| FR-9 | `main.py:/health`, Spring Actuator |
| FR-10 | `application/docker-compose.yml` |
| FR-11, FR-12, NFR-8, NFR-9 | [`BACKEND_ERD.md`](BACKEND_ERD.md), `com.crowdnav.api.persistence.*`, `SessionController.java` |
| FR-12 | [`API_SPEC.md`](API_SPEC.md) §5 |
| FR-13, NFR-3b | [`DETECTION_3CLASS_PLAN.md`](DETECTION_3CLASS_PLAN.md) |
| NFR-1, NFR-2, NFR-3 | `docs/reports/evaluation_metrics.md`, `Final_Training_Report.md` |
| NFR-6 | `application/backend/crowdnav-api/src/main/resources/application.yml` |
| NFR-7 | [`DESIGN_RULES.md`](DESIGN_RULES.md), `application/frontend/src/design/tokens.ts` |

## 6. Verification Summary

- **Unit:** FR-2, FR-3 heuristics (Python); density/recommendation mapping tables.
- **Integration:** FR-6–FR-9, FR-12 (Spring `@SpringBootTest`, run in mock mode per repo convention).
- **System:** FR-4, FR-5, FR-10, FR-13 via the Docker demo + webcam.
- **Benchmark:** NFR-1, NFR-2, NFR-3/3b recorded in `docs/reports/`.

> **Change control:** new requirements get the next free ID; never renumber. Mark superseded
> requirements `~~FR-x~~ (superseded by FR-y)` rather than deleting.
