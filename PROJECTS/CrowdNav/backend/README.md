# CrowdNav Java API (mock)

Spring Boot service exposing `POST /api/v1/analyze-frame` with a **mock** response matching [`PROJECTS/TechSpec.md`](../../TechSpec.md) §7. React Native should call this host only; Python inference will be wired later via [`../inference-service`](../inference-service).

## Endpoints (mock ignores payload)

| Content-Type | Body |
|--------------|------|
| `application/json` | Optional `{ "frame_base64": "..." }` |
| `multipart/form-data` | Optional part `image` (file) |

## Run

```bash
cd crowdnav-api
./gradlew bootRun   # Unix
gradlew.bat bootRun # Windows
```

Default port: `8080`.

## Configuration

See [`crowdnav-api/src/main/resources/application.yml`](crowdnav-api/src/main/resources/application.yml).

- `app.inference.mode: mock` — default static JSON (current).
- `app.inference.base-url` — placeholder for future `mode: remote` + `WebClient` to Python (`inference-service`, default `http://127.0.0.1:9000`).
