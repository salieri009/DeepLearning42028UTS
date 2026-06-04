# CrowdNav Java API

Spring Boot service exposing `POST /api/v1/analyze-frame`, matching
[`docs/TechSpec.md`](../../docs/TechSpec.md) §7. It is called by the **React (Vite)
frontend** ([`application/frontend`](../frontend)) and, in the default `remote` mode,
forwards frames to the Python **[inference-service](../inference-service)** (FastAPI +
Ultralytics YOLO) loading `best.pt`.

## Endpoints

| Content-Type | Body |
|--------------|------|
| `application/json` | `{ "frame_base64": "<base64 JPEG/PNG>" }` |
| `multipart/form-data` | part `image` (file) |

Returns `persons[] / crowd_density / max_proximity_risk / recommendation`. Invalid or
missing frame data returns **400**; inference-service failures surface as **502**.

## Run

```bash
cd crowdnav-api
./gradlew bootRun   # Unix
gradlew.bat bootRun # Windows
```

Default port: `8080`. For the full stack (UI + API + inference) use
[`application/docker-compose.yml`](../docker-compose.yml) — see the repo
[README → Run the Application](../../README.md#run-the-application-live-demo).

## Configuration

See [`crowdnav-api/src/main/resources/application.yml`](crowdnav-api/src/main/resources/application.yml).

- `app.inference.mode` — **`remote` (default):** call the FastAPI inference service via
  Spring `RestClient`. The client is pinned to **HTTP/1.1** so uvicorn does not drop the
  request body on the `h2c` upgrade. **`mock`:** static TechSpec-shaped JSON, used by the
  controller tests (`src/test/resources/application.properties`).
- `app.inference.base-url` — inference base URL (default `http://127.0.0.1:9000`; the
  Docker stack sets `http://inference:9000`).
- `app.cors.allowed-origins` — allowed browser origins.
