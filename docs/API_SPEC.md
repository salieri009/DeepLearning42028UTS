---
last_updated: 2026-06-17
status: draft
related:
  - application/backend/crowdnav-api/src/main/java/com/crowdnav/api/controller/AnalyzeFrameController.java
  - application/backend/crowdnav-api/src/main/java/com/crowdnav/api/controller/SessionController.java
  - application/backend/crowdnav-api/src/main/java/com/crowdnav/api/service/PersistingAnalyzeFrameService.java
  - application/inference-service/main.py
  - docs/DETECTION_3CLASS_PLAN.md
  - docs/BACKEND_ERD.md
---

# API Specification

Formal contract for the **public** API (Spring Boot, port 8080) and the **internal** inference API
(FastAPI, port 9000). Schemas are described OpenAPI-style; payloads are JSON with **snake_case** keys.

## 1. Conventions

| Aspect | Value |
|--------|-------|
| Public base URL | `http://localhost:8080/api/v1` (frontend uses relative `/v1` via Vite/nginx proxy) |
| Internal base URL | `http://inference:9000` (Docker) / `http://127.0.0.1:9000` (local) |
| Content types | `application/json` (primary), `multipart/form-data` (frame upload) |
| Casing | Response/request bodies: `snake_case`. Java DTOs map via `@JsonProperty`. |
| Transport | Backend→inference pinned to **HTTP/1.1** (uvicorn lacks h2c; HTTP/2 drops the body). |
| CORS | `app.cors.allowed-origins` — `http://localhost:5173,3000,8081` (dev), `http://localhost` (Docker). |
| Auth | None (local demo). Do not expose port 9000 publicly. |

## 2. Shared Schemas

### `BBox` (normalized, YOLO-style, all 0.0–1.0)
```json
{ "x_center": 0.5123, "y_center": 0.6004, "width": 0.1820, "height": 0.4400 }
```
| Field | Type | Notes |
|-------|------|-------|
| x_center, y_center | number | Box center, fraction of frame width/height. |
| width, height | number | Box size, fraction of frame. `height` drives proximity (FR-3). |

### `Detection` (`persons[]` element)
```json
{ "class": "person", "confidence": 0.92, "bbox": { ... }, "proximity_risk": "WARNING" }
```
| Field | Type | Enum / Notes |
|-------|------|--------------|
| class | string | `person` today; `person\|wheelchair\|luggage` after 3-class rollout (see §7). |
| confidence | number | 0.0–1.0, rounded to 4 dp. |
| bbox | BBox | See above. |
| proximity_risk | string | `SAFE \| WARNING \| DANGER`. |

> Note: the JSON array key is `persons` for backward compatibility even once non-person classes are
> returned. See §7 for the planned `detections` alias.

### `AnalyzeFrameResponse`
```json
{
  "persons": [ { "class": "person", "confidence": 0.92,
    "bbox": {"x_center":0.51,"y_center":0.60,"width":0.18,"height":0.44},
    "proximity_risk": "WARNING" } ],
  "crowd_density": "MEDIUM",
  "max_proximity_risk": "WARNING",
  "recommendation": "CAUTION"
}
```
| Field | Type | Enum |
|-------|------|------|
| persons | Detection[] | May be empty. |
| crowd_density | string | `LOW \| MEDIUM \| HIGH` (FR-2). |
| max_proximity_risk | string | `SAFE \| WARNING \| DANGER` (worst across detections). |
| recommendation | string | `PROCEED \| CAUTION \| STOP`. |

Backend DTOs: `AnalyzeFrameResponse.java`, `PersonDetection.java`, `BBox.java`.

## 3. Public API — `POST /api/v1/analyze-frame`

Analyze a single video frame and return detections + guidance.
Source: `AnalyzeFrameController.java` (two overloads by content type).

### 3.1 JSON variant — `Content-Type: application/json`
**Request**
```json
{
  "frame_base64": "<base64-encoded JPEG or PNG, no data: prefix>",
  "session_id": 42
}
```
| Field | Type | Required | Rule |
|-------|------|----------|------|
| frame_base64 | string | yes | Non-blank, valid base64. Else 400. |
| session_id | integer | no | When present, frame metadata is persisted asynchronously (FR-11). Unknown id → 404. Omitted → stateless (no DB write). |

**Example**
```bash
curl -X POST http://localhost:8080/api/v1/analyze-frame \
  -H 'Content-Type: application/json' \
  -d '{"frame_base64":"/9j/4AAQSkZJRg...","session_id":42}'
```

### 3.2 Multipart variant — `Content-Type: multipart/form-data`
| Part / param | Type | Required | Notes |
|--------------|------|----------|-------|
| image | file | no* | JPEG/PNG. Backend base64-encodes and forwards. |
| session_id | query param | no | Same semantics as JSON body field (§3.1). |

\* If `image` is absent/empty: mock mode returns a fixed response; remote mode forwards an empty frame
→ inference returns 400.

```bash
curl -X POST "http://localhost:8080/api/v1/analyze-frame?session_id=42" -F image=@frame.jpg
```

**Responses (both variants):** `200` → `AnalyzeFrameResponse`. Errors: see §6.

## 4. Health

| Endpoint | Service | 200 | Non-200 |
|----------|---------|-----|---------|
| `GET /actuator/health` | Spring (actuator dependency present) | `{"status":"UP"}` | — |
| `GET /actuator/health/readiness` | Spring readiness (DB + inference in `remote` mode) | `{"status":"UP"}` when deps healthy | `503` when inference unreachable |
| `GET /health` (`:9000`) | FastAPI inference | `{"status":"ok","model":"ready"}` | `503` if `best.pt` missing. |

## 5. Session History API (persistence — FR-11/FR-12)

**Implemented** in `SessionController.java` + `PersistingAnalyzeFrameService` (opt-in via `session_id`).
All under `/api/v1`. See [`BACKEND_ERD.md`](BACKEND_ERD.md) for the data model.

### `POST /sessions` — open an analysis session
Request: `{ "client_label": "demo-laptop", "source_type": "WEBCAM" }`
Response `201`: `{ "id": 42, "started_at": "2026-06-17T03:21:00Z", "client_label": "demo-laptop", "source_type": "WEBCAM" }`

`source_type` enum: `WEBCAM | UPLOAD | MOCK`.

### `GET /sessions` — list sessions
Query: `?limit=20&offset=0`. Response `200`: `{ "items": [Session...], "total": 137 }`.

### `GET /sessions/{id}` — session summary
Response `200`: Session + aggregates `{ "frame_count": 310, "avg_latency_ms": 280, "worst_risk": "DANGER" }`.

### `GET /sessions/{id}/detections` — detections for a session
Query: `?risk=DANGER&class=wheelchair&limit=100`. Response `200`: `{ "items": [DetectionItem...] }`.

`risk` filter: `SAFE | WARNING | DANGER`. `class` filter: `person | wheelchair | luggage`. Invalid values → **400**.

Each `DetectionItem` includes `frame_id`, `sequence_no`, `captured_at`, bbox fields, `class`, `confidence`, `proximity_risk`.

### `PATCH /sessions/{id}` — close an analysis session
Optional body: `{ "ended_at": "2026-06-17T04:00:00Z" }` — omit `ended_at` to use server time.
Response `200`: `SessionResponse` with `ended_at` set. Already closed → **409**. Unknown id → **404**.

> **Opt-in persistence:** `analyze-frame` accepts optional `session_id` (JSON body or multipart query param).
> When omitted, analysis is stateless (no DB access). When present, the session must exist; frame + detection
> rows are written **asynchronously** after the inference response is returned (NFR-8).

## 6. Error Model

Spring returns `ResponseStatusException` → standard error body
`{ "timestamp", "status", "error", "message", "path" }`.

| HTTP | When | Source |
|------|------|--------|
| 400 | `frame_base64` missing/blank | `AnalyzeFrameController` |
| 400 | `frame_base64` not valid base64 | `AnalyzeFrameController` (`Base64.getDecoder().decode`) |
| 400 | Multipart image unreadable | `AnalyzeFrameController` |
| 400 | Inference rejected request (4xx upstream) | `RemoteAnalyzeFrameService.onStatus` |
| 400 | Inference: undecodable image | `main.py` (`cv2.imdecode` None) |
| 400 | Invalid `source_type` on `POST /sessions` | `SessionService` |
| 400 | Missing/blank `source_type` on `POST /sessions` | Bean validation (`@NotBlank`) |
| 400 | Invalid `risk` or `class` filter on `GET .../detections` | `SessionService` |
| 404 | `session_id` not found on `analyze-frame` | `AnalyzeFrameController` → `SessionService.requireSessionExists` |
| 404 | `GET /sessions/{id}` or `/detections` — session not found | `SessionService` |
| 409 | `PATCH /sessions/{id}` — session already closed | `SessionService.closeSession` |
| 502 | Inference returned 5xx / empty body | `RemoteAnalyzeFrameService` (`BAD_GATEWAY`) |
| 503 | Model file not loaded / inference error | `main.py` (`HTTPException 503`) |

## 7. Internal API — `POST /internal/infer` (FastAPI :9000)

Called only by the Spring backend. Source: `application/inference-service/main.py`.

**Request:** `{ "frame_base64": "<base64 image>" }` (required; 400 if empty).
**Response `200`:** identical shape to `AnalyzeFrameResponse` (§2.3). The backend deserializes it
directly into `AnalyzeFrameResponse.class`.

**3-class change (see [`DETECTION_3CLASS_PLAN.md`](DETECTION_3CLASS_PLAN.md)):**
- `model.predict(..., classes=[0])` → `classes=[0,1,2]`.
- `class` field returns `person | wheelchair | luggage` (mapped from YOLO class id).
- Proximity heuristic applies to `person` + `wheelchair`; `luggage` reports `proximity_risk` too but is
  excluded from crowd-density counting (treated as a static obstacle). Document the exact rule alongside
  the implementation.
- Optional response alias `detections` (same array) may be added; keep `persons` until the frontend
  migrates.

## 8. Versioning & Changelog

- Path-versioned (`/api/v1`). Breaking changes → `/api/v2`; additive fields are non-breaking.
- **Changelog**
  - `v1.0` — `analyze-frame` (JSON + multipart), health.
  - `v1.1` — session persistence endpoints (§5), opt-in `session_id` on `analyze-frame`.
  - `v1.1.1` — `PATCH /sessions/{id}` close, inference readiness health, filter validation, pagination offset fix.
  - `v1.2` *(planned)* — 3-class detection, `detections` alias (§7).
