# CrowdNav Java API

Spring Boot service exposing the public REST API documented in
[`docs/API_SPEC.md`](../../docs/API_SPEC.md). It is called by the **React (Vite)
frontend** ([`application/frontend`](../frontend)) and, in the default `remote` mode,
forwards frames to the Python **[inference-service](../inference-service)** (FastAPI +
Ultralytics YOLO) loading `best.pt`.

Session history (FR-11/FR-12) is stored in **PostgreSQL** when clients pass an optional
`session_id` on `analyze-frame` requests.

## Endpoints

### Frame analysis

| Content-Type | Body / params |
|--------------|---------------|
| `application/json` | `{ "frame_base64": "<base64 JPEG/PNG>", "session_id": 42 }` — `session_id` optional |
| `multipart/form-data` | part `image` (file); optional query `session_id` |

Returns `persons[] / crowd_density / max_proximity_risk / recommendation`. Invalid or
missing frame data returns **400**; unknown `session_id` returns **404**; inference-service
failures surface as **502**.

### Session history (v1.1)

| Method | Path |
|--------|------|
| `POST` | `/api/v1/sessions` |
| `GET` | `/api/v1/sessions?limit=&offset=` |
| `GET` | `/api/v1/sessions/{id}` |
| `PATCH` | `/api/v1/sessions/{id}` — close session (`ended_at`) |
| `GET` | `/api/v1/sessions/{id}/detections?risk=&class=&limit=` |

Health: `GET /actuator/health` (liveness), `GET /actuator/health/readiness` (DB + inference in `remote` mode).

See [`docs/API_SPEC.md`](../../docs/API_SPEC.md) §5 for request/response shapes.

## Run

```bash
cd crowdnav-api
./gradlew bootRun   # Unix
gradlew.bat bootRun # Windows
```

Default port: `8080`. Requires PostgreSQL unless persistence is disabled (see Configuration).

For the full stack (UI + API + inference + DB) use
[`application/docker-compose.yml`](../docker-compose.yml) — see the repo
[README → Run the Application](../../README.md#run-the-application-live-demo).

### Local PostgreSQL (without full Docker stack)

```bash
# Start only the database container
cd application && docker compose up db -d

# Or point at an existing instance
export DB_URL=jdbc:postgresql://localhost:5432/crowdnav
export DB_USER=crowdnav
export DB_PASSWORD=crowdnav
```

## Configuration

See [`crowdnav-api/src/main/resources/application.yml`](crowdnav-api/src/main/resources/application.yml).

- `app.inference.mode` — **`remote` (default):** call the FastAPI inference service via
  Spring `RestClient`. The client is pinned to **HTTP/1.1** so uvicorn does not drop the
  request body on the `h2c` upgrade. **`mock`:** static TechSpec-shaped JSON, used by the
  controller tests (`src/test/resources/application.properties`).
- `app.inference.base-url` — inference base URL (default `http://127.0.0.1:9000`; the
  Docker stack sets `http://inference:9000`).
- `app.cors.allowed-origins` — allowed browser origins.
- `app.persistence.enabled` — when `true` (default), wraps inference with
  `PersistingAnalyzeFrameService` (async DB writes when `session_id` is present). Set
  `false` for inference-only dev without a database.
- `DB_URL`, `DB_USER`, `DB_PASSWORD` — PostgreSQL connection (defaults in `application.yml`).

## Data model

PostgreSQL schema managed by Flyway (`src/main/resources/db/migration/V1__init.sql`).
See [`docs/BACKEND_ERD.md`](../../docs/BACKEND_ERD.md).
