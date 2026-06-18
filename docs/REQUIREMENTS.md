---
last_updated: 2026-06-18
judge_report: docs/reports/requirements_prd_traceability_judge.md
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

This document formalizes the prose requirements in [`docs/PRD.md`](PRD.md) §5–§9 into
**ID'd, testable Functional (FR) and Non-Functional (NFR) Requirements** with traceability to the
implementing source code. It is the single source of truth for *what the system must do*; the *how*
lives in [`docs/TechSpec.md`](TechSpec.md) and the per-area specs cross-referenced below.

**Ground Truth:** [`docs/PRD.md`](PRD.md) is immutable for this release. Where implementation or
extension requirements diverge from PRD prose, they are classified below as **Extension** or
**Known drift** — never by editing PRD.

**System under specification:** CrowdNav — a 3-tier computer-vision app
(**React → Spring Boot → FastAPI/YOLO**) that detects pedestrians/obstacles in a live camera feed and
returns crowd-density and proximity-risk guidance for travellers with mobility disabilities.

**Priority key (MoSCoW):** `M` Must · `S` Should · `C` Could · `W` Won't (this release).

### 1.1 PRD Traceability Matrix

Cross-artifact coverage check (spec-kit `/speckit.analyze` equivalent). PRD is read-only Ground Truth.

| PRD Ref | PRD content (summary) | FR / NFR | Coverage | Notes |
|---------|------------------------|----------|----------|-------|
| §5.1 | YOLOv8m person detection on JRDB | FR-1, NFR-3 | **Full** | Shipped `best.pt` is person-only. |
| §5.1 | Crowd density LOW / MEDIUM / HIGH | FR-2 | **Full** | PRD §8: `n≤2` LOW, `n≤5` MEDIUM, else HIGH; risk elevation per FR-2. |
| §5.1 | Proximity SAFE / WARNING / DANGER (bbox height) | FR-3 | **Full** | Thresholds 0.25 / 0.45. |
| §5.1 | SageMaker training + FastAPI `/internal/infer` | FR-7, FR-9, FR-10 | **Full** | 3-tier Docker stack. |
| §5.2 | Color-coded bounding boxes | FR-4, NFR-10 | **Full** | |
| §5.2 | Stats panel (density, risk, recommendation) | FR-5 | **Full** | |
| §5.3 | 2 FPS capture, &lt; 500 ms latency | NFR-1, NFR-2, FR-UI-1 | **Full** | Mock gate in `NfrLatencyMockTest`; live `latencyMs` in UI. |
| §5.3 | mAP@0.5 = 0.4475 (val) | NFR-3 | **Full** | Achieved 0.4475 val, 0.6361 test. |
| §8 | Success metrics table | NFR-1, NFR-3, FR-2 | **Full** | Mock latency gate + `evaluation_metrics.md`; remote GPU benchmark optional. |
| §9 | Audio / haptic removed | §4 Won't | **Full** | Audio/haptic removed from UI and `useRiskAlerts` (2026-06-18). |
| §6 NOTE | Person-only detection | FR-13 | **Conflict** | FR-13 is research extension outside PRD §6 shipped scope. |
| §3 Vision | Analytics / map / settings (not in PRD §5) | FR-14 … FR-17 | **Extension** | v2.2 multi-page app; derived from product vision + runbooks S3–S5. |

## 2. Functional Requirements

| ID | Requirement | Pri | PRD Ref | Source / Implemented in | Verification |
|----|-------------|-----|---------|--------------------------|--------------|
| **FR-1** | Detect persons in a video frame using a fine-tuned YOLOv8m model. *Extended to 3 classes (person/wheelchair/luggage) per [`DETECTION_3CLASS_PLAN.md`](DETECTION_3CLASS_PLAN.md) — outside PRD §6 shipped scope (FR-13).* | M | §5.1 | `application/inference-service/main.py` (`model.predict(..., classes=[0])`) | Unit: mock frame → non-empty `persons[]`. mAP gate in NFR-3. |
| **FR-2** | Classify crowd density as `LOW` / `MEDIUM` / `HIGH`. **Normative (PRD §8):** `n≤2`→LOW; `n≤5`→MEDIUM; else HIGH (`n` = person count). Worst proximity risk may elevate severity in implementation. | M | §5.1, §8 | `main.py:_crowd_density()` | Unit table over n ∈ {0,1,2,3,5,6} per PRD rule. |
| **FR-3** | Estimate per-detection proximity risk `SAFE` / `WARNING` / `DANGER` from normalized bbox height. Thresholds: `<0.25`→SAFE, `<0.45`→WARNING, else DANGER. | M | §5.1 | `main.py:_alert_state()`; mirrors `train/src/inference/collision_avoidance.py` (`CollisionThresholds 0.25/0.45`) | Unit: heights {0.10, 0.30, 0.60} → {SAFE, WARNING, DANGER}. |
| **FR-4** | Render color-coded bounding boxes over the live feed: SAFE=green, WARNING=yellow, DANGER=red. | M | §5.2 | `application/frontend/src/widgets/video-stage/ui/VideoStage.tsx`, `entities/detection/PersonBBox.tsx` | Manual: webcam demo shows correct colors. |
| **FR-5** | Display a statistics panel: people count, crowd density, max proximity risk, recommendation (`PROCEED`/`CAUTION`/`STOP`). | M | §5.2 | `application/frontend/src/widgets/stats-sidebar/ui/StatsSidebar.tsx`; `main.py:_recommendation()` | Manual: panel values match API response. |
| **FR-6** | Accept a frame at `POST /api/v1/analyze-frame` as JSON (`frame_base64`) **and** as `multipart/form-data` (`image` part). | M | §5.1 | `application/backend/.../controller/AnalyzeFrameController.java` | Integration: both content types → HTTP 200 with valid body. |
| **FR-7** | Route the decoded frame from the Spring backend to the FastAPI inference service at `POST /internal/infer` over HTTP/1.1. | M | §5.1 | `application/backend/.../service/RemoteAnalyzeFrameService.java` | Integration: backend→inference returns detection payload. |
| **FR-8** | Validate input: reject empty/blank `frame_base64` (400) and undecodable base64 (400); surface inference unavailability (502/503). | M | — | `AnalyzeFrameController.java`; `RemoteAnalyzeFrameService.java`; `main.py` (`HTTPException`) | Integration: bad inputs → documented error codes (see [`API_SPEC.md`](API_SPEC.md) §6). |
| **FR-9** | Expose health endpoints for liveness/readiness of backend and inference (model-loaded check). | M | §5.1 | `main.py:/health`; Spring Actuator (`spring-boot-starter-actuator`) | `GET :9000/health` → 200 when `best.pt` present, 503 otherwise. |
| **FR-10** | Run the full stack via a single `docker compose up --build` (React :80 → Spring :8080 → FastAPI :9000). Canonical compose: [`application/docker-compose.yml`](../application/docker-compose.yml); [`infra/docker/`](../infra/docker/) is a thin wrapper with `MODEL_DIR` override. | M | §5.1 | `application/docker-compose.yml` | Manual: 3 containers healthy; browser path returns 200. |
| **FR-11** | Persist analysis sessions, frames, detections for history and analytics (opt-in via `session_id`). | S | — | `com.crowdnav.api.persistence.*`, `PersistingAnalyzeFrameService`, `FramePersistenceService` | Integration: session row + N frame/detection rows after a run with `session_id`. |
| **FR-12** | Expose session-history read APIs (`GET /api/v1/sessions`, `GET /api/v1/sessions/{id}/detections`). | S | — | `SessionController.java`, `SessionService.java` | Integration: stored session retrievable by id. |
| **FR-13** | *(Research extension — not PRD §6 shipped scope)* Detect and label `wheelchair` and `luggage` in addition to `person`, with class shown in overlay + stats. | S | §6 (out of scope) | New — see [`DETECTION_3CLASS_PLAN.md`](DETECTION_3CLASS_PLAN.md) | Per-class mAP gate; demo shows 3 distinct labels. |
| **FR-14** | *(Extension)* Expose `GET /api/v1/analytics/summary?days=N` aggregating frame-level density and risk over persisted sessions for the Analytics page. | C | §3 Vision | `AnalyticsController.java`, `AnalyticsService.java`, `features/analytics-data/` | Integration: `AnalyticsControllerTest`; manual `/analytics` charts populate. |
| **FR-15** | *(Extension)* Expose `GET/PUT /api/v1/settings` to persist sensor/detection preferences (`confidence`, `model`, etc.) in PostgreSQL; `confidence` and `model` flow into inference on `/internal/infer`. | S | §3 Vision | `SettingsController.java`, `SettingsService.java`, `features/sensor-settings/` | Integration: `SettingsControllerTest`, `AnalyzeFrameSettingsIntegrationTest`. |
| **FR-16** | *(Extension of FR-11)* Expose `GET /api/v1/sessions/{id}/frames` returning frame-trail metadata (sequence, density, risk, person count) without raw images. Archive **EXPORT DATA** downloads session + frames + detections as JSON. | S | — | `SessionController.java`, `SessionService.listFrames()`, `features/session-archive/lib/exportSessionJson.ts` | Integration: `SessionControllerTest.listFrames_*`; unit: `exportSessionJson.test.ts`. |
| **FR-17** | *(Extension)* Live Map page: show browser GPS position and zone markers derived from recent session telemetry (24 h poll). | C | §3 Vision | `pages/live-map/`, `features/live-map-markers/`, `features/geolocation/` | Manual + Vitest: `/live-map` GPS legend; user + zone markers. |

### 2.1 UI Control Requirements (EARS)

| ID | Requirement | Pri | PRD Ref | Source / Implemented in | Verification |
|----|-------------|-----|---------|--------------------------|--------------|
| **FR-UI-1** | WHEN the user clicks **Start Monitoring** while idle, the system SHALL request camera permission via `getUserMedia`, attach the stream to the video element, reset alert history, and start a 500 ms analyze-frame polling loop. | M | §5.3 | `DashboardPage.tsx`, `useCrowdDetection.ts`, `ControlBar.tsx` | Manual: Start → live feed + stats update. |
| **FR-UI-2** | WHEN the user clicks **Stop Monitoring** (primary pill) or the **Stop** icon while running, the system SHALL clear the capture interval, stop all `MediaStream` tracks, cancel speech, reset alerts/history, and clear on-screen stats. | M | §5.2 | `DashboardPage.tsx`, `useCrowdDetection.stop()` | Manual: Stop → camera off, panel empty. |
| **FR-UI-3** | Stop controls SHALL use the `danger` button variant per [`DESIGN_RULES.md`](DESIGN_RULES.md) §3.1. | M | §5.2 | `ControlBar.tsx` | Visual: Stop pill + icon use danger styling. |
| **FR-UI-4** | Video overlays (bounding boxes, alert chips) SHALL stay within layout safe zones: header 64 px, sidebar 320 px (≥1024 px), control bar reserve 72 px from bottom. | M | §5.2 | `tokens.ts` `layout.*`, `VideoStage.tsx` | Visual: no overlap with fixed chrome at 1280×720+. |
| **FR-UI-5** | ~~Placeholder controls~~ **Implemented (2026-06-18):** Record (WebM via `MediaRecorder`), Export (session JSON), Generate Report (HTML), header notifications dropdown. Analytics / Live Map / Archive / Settings routes remain active. | C | — | `ControlBar.tsx`, `TopNav.tsx`, `StatsSidebar.tsx`, `features/session-recording/`, `features/session-export/`, `features/report-generation/` | Vitest: `ControlBar.test.tsx`, `DashboardPage.test.tsx`. |
| **FR-UI-6** | The running-state primary control label SHALL read **Stop Monitoring** (not "Pause"); true pause/resume semantics are **Won't** this release. | M | — | `ControlBar.tsx` | Visual: label matches behavior. |
| **FR-UI-7** | WHEN the user clicks **Record** while monitoring, the system SHALL capture the camera stream to WebM and download on stop. | C | — | `features/session-recording/useSessionRecording.ts`, `ControlBar.tsx` | Manual + `ControlBar.test.tsx`. |
| **FR-UI-8** | WHEN the user clicks **Export** on the dashboard with an active or recent session, the system SHALL download session + frames + detections as JSON. | C | — | `features/session-export/exportLiveSession.ts` | `DashboardPage.test.tsx`. |
| **FR-UI-9** | WHEN the user clicks **Generate Report** (dashboard or archive preview), the system SHALL produce a printable HTML report (stats + alerts or frame trail). | C | — | `features/report-generation/buildHtmlReport.ts` | `buildHtmlReport.test.ts`. |
| **FR-UI-10** | Header **Notifications** SHALL show recent WARNING/DANGER alerts from the live monitoring session (text only). | C | — | `AlertHistoryProvider.tsx`, `TopNav.tsx` | Manual on dashboard. |
| **FR-UI-11** | Settings **Add Source** and per-custom-source **Settings** SHALL persist sensor metadata in `localStorage`. | C | — | `shared/lib/customSourcesStorage.ts`, `SensorSourceGrid.tsx` | `SettingsPage.test.tsx`, `customSourcesStorage.test.ts`. |
| **FR-UI-12** | SideNav **Health**, **Assets**, **Help**, and **Logout** SHALL open health/readiness, asset metadata, scenario help, or clear local preferences respectively. | C | — | `SideNav.tsx`, `shared/api/health.ts` | `SideNav.test.tsx`. |

## 3. Non-Functional Requirements

| ID | Category | Requirement | Target | PRD Ref | Verification |
|----|----------|-------------|--------|---------|--------------|
| **NFR-1** | Performance — latency | End-to-end inference latency per frame | **< 500 ms** | §5.3, §8 | `NfrLatencyMockTest` (mock mode); see `docs/reports/evaluation_metrics.md` §4.2. |
| **NFR-2** | Performance — throughput | Sustained frame processing rate (frontend captures every 500 ms) | **≥ 2 FPS** (mean interval ≤ 500 ms over 60 s run) | §5.3 | Measure `useCrowdDetection` loop interval + `analyze-frame` round-trip; pass if ≥ 2 completed frames/s. |
| **NFR-3** | Accuracy | Person-class detection quality on JRDB | **val mAP@0.5 > 0.40; test mAP@0.5 > 0.50** | §5.3, §8 | Achieved **0.4475** (val), **0.6361** (test) — Phase C, `docs/reports/Final_Training_Report.md`. |
| **NFR-3b** | Accuracy (planned) | Per-class mAP@0.5 for 3-class model | person ≥ 0.40; wheelchair ≥ 0.35; luggage ≥ 0.35 | — | Eval split per [`DETECTION_3CLASS_PLAN.md`](DETECTION_3CLASS_PLAN.md) §6. |
| **NFR-4** | Portability | Run on commodity GPU and cloud unchanged | Local RTX 3050 (4 GB) and AWS SageMaker `ml.g4dn.xlarge` (T4) | — | Same commands run in both; documented in README. |
| **NFR-5** | Deployability | One-command containerized deployment | 3-service Docker stack, healthchecks pass | §5.1 | `docker compose up --build` end-to-end. |
| **NFR-6** | Security | No credentials/keys committed; CORS restricted to known origins | Zero secrets in VCS; explicit allowed-origins | — | `application.yml` `app.cors.allowed-origins`; secret scan in CI. |
| **NFR-7** | Maintainability | UI styling via design tokens, not hardcoded values | Token coverage; documented rules | §5.2 | [`DESIGN_RULES.md`](DESIGN_RULES.md), `shared/config/theme/tokens.ts` |
| **NFR-8** | Reliability | Persistence (FR-11) must not block the inference response | Async/non-blocking write; ≤ +0 ms to NFR-1 path | — | Load test: latency unchanged with persistence on (see ERD §6). |
| **NFR-9** | Privacy | No raw frames stored by default; persist only derived metadata (bboxes, states) | Frames not written to DB/disk | — | ERD stores normalized coordinates + labels only, not images. |
| **NFR-10** | Usability | Risk states must be distinguishable beyond color alone (label text on each box) | Text label per detection | §5.2 | `entities/detection/PersonBBox.tsx` renders risk + confidence label. |

## 4. Out of Scope (this release)

From [`docs/PRD.md`](PRD.md) §9 — explicitly **Won't (W)**:

| Item | PRD Ref | Reason |
|------|---------|--------|
| Audio / haptic alerts | §9 | Removed per PRD — proximity alerts are text + color only. |
| Screen-reader / WCAG / ARIA compliance | §9 | Removed — no accessibility audit in scope (note: NFR-10 keeps non-color cue). |
| Route selection / path-clearance markers | §9 | Deferred — static text recommendation only. |
| Visually-impaired audio feedback | §9 | Removed — no audio output per PRD. |
| Wheelchair/luggage detection in the *current shipped model* | §6 | The shipped `best.pt` is person-only; multi-class is FR-13 (research extension). |
| Pause/resume monitoring (camera stays on, loop paused) | — | **Won't** — Stop fully releases camera; see FR-UI-6. |
| Session create UI + `session_id` on analyze-frame | — | **Done** — `useCrowdDetection` auto-creates `WEBCAM` session on Start and passes `session_id` on each analyze call; closes on Stop. |

## 5. Traceability Matrix

| Req | PRD Ref | Primary artifact |
|-----|---------|------------------|
| FR-1, FR-2, FR-3 | §5.1 | `application/inference-service/main.py` |
| FR-3 (logic origin) | §5.1 | `train/src/inference/collision_avoidance.py` |
| FR-4, FR-10 (UI) | §5.2 | `application/frontend/src/widgets/video-stage/`, `entities/detection/PersonBBox.tsx` |
| FR-5 | §5.2 | `application/frontend/src/widgets/stats-sidebar/ui/StatsSidebar.tsx` |
| FR-UI-1 … FR-UI-12 | §5.2, §5.3 | `pages/dashboard/`, `widgets/control-bar/`, `features/crowd-detection/`, placeholder features — see [`DESIGN.md`](DESIGN.md) §9 |
| FR-UI (pages) | §3 Vision | `pages/analytics/`, `pages/live-map/`, `pages/archive/`, `pages/settings/` — see [`DESIGN.md`](DESIGN.md) §9.8 |
| FR-6, FR-8 | §5.1 | `application/backend/crowdnav-api/.../controller/AnalyzeFrameController.java` |
| FR-7, FR-8 | §5.1 | `application/backend/crowdnav-api/.../service/RemoteAnalyzeFrameService.java` |
| FR-9 | §5.1 | `main.py:/health`, Spring Actuator |
| FR-10 | §5.1 | `application/docker-compose.yml` |
| FR-11, FR-12, FR-16, NFR-8, NFR-9 | — | [`BACKEND_ERD.md`](BACKEND_ERD.md), `com.crowdnav.api.persistence.*`, `SessionController.java` |
| FR-12, FR-16 | — | [`API_SPEC.md`](API_SPEC.md) §5 |
| FR-13, NFR-3b | §6 (out of scope) | [`DETECTION_3CLASS_PLAN.md`](DETECTION_3CLASS_PLAN.md) |
| FR-14 | §3 Vision | `AnalyticsController.java`, `features/analytics-data/` |
| FR-15 | §3 Vision | `SettingsController.java`, `features/sensor-settings/`, `V2__app_settings.sql` |
| FR-17 | §3 Vision | `features/live-map-markers/`, `features/geolocation/`, `widgets/live-map-stage/` |
| NFR-1, NFR-2, NFR-3 | §5.3, §8 | `docs/reports/evaluation_metrics.md`, `Final_Training_Report.md` |
| NFR-6 | — | `application/backend/crowdnav-api/src/main/resources/application.yml` |
| NFR-7 | §5.2 | [`DESIGN_RULES.md`](DESIGN_RULES.md), `application/frontend/src/shared/config/theme/tokens.ts` |

## 6. Verification Summary

- **Unit:** FR-2, FR-3 heuristics (Python); density/recommendation mapping tables.
- **Integration:** FR-6–FR-9, FR-12, FR-14–FR-16 (Spring `@SpringBootTest`, run in mock mode per repo convention).
- **System:** FR-4, FR-5, FR-10, FR-13, FR-17 via the Docker demo + webcam.
- **Benchmark:** NFR-1, NFR-2, NFR-3/3b recorded in `docs/reports/`.

> **Change control:** new requirements get the next free ID; never renumber. Mark superseded
> requirements `~~FR-x~~ (superseded by FR-y)` rather than deleting.
