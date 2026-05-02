# CrowdNav Java API (mock)

Spring Boot service exposing `POST /api/v1/analyze-frame` with a **mock** response matching [`PROJECTS/TechSpec.md`](../../TechSpec.md) §7. React Native should call this host only; Python inference will be wired later via a separate service.

## Run

```bash
cd crowdnav-api
./gradlew bootRun   # Unix
gradlew.bat bootRun # Windows
```

Default port: `8080`.

## Configuration

See [`crowdnav-api/src/main/resources/application.yml`](crowdnav-api/src/main/resources/application.yml). Set `app.inference.mode: mock` (default) until a remote inference client is added.
