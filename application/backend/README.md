# CrowdNav Java API

Spring Boot service exposing `POST /api/v1/analyze-frame` per [`docs/TechSpec.md`](../../docs/TechSpec.md) §7.

## Modes

| Mode | Behaviour |
|------|-----------|
| `mock` (default) | Static TechSpec-shaped JSON; ignores image payload. |
| `onnx` | Loads YOLO ONNX (Ultralytics export with **NMS embedded**). Requires image bytes. |

**Artifacts:** Train with `train/scripts/train_yolo.py`, export ONNX with `train/scripts/eval_yolo.py --export-onnx` (see [`docs/runbooks/post_train_spring_onnx.md`](../../docs/runbooks/post_train_spring_onnx.md)).

## Endpoints

| Content-Type | Body |
|--------------|------|
| `application/json` | Optional `{ "frame_base64": "..." }` |
| `multipart/form-data` | Optional part `image` (file) |

ONNX mode: image body is **required** (multipart file or base64).

## Run

```bash
cd crowdnav-api
./gradlew bootRun   # Unix
gradlew.bat bootRun # Windows
```

Default port: `8080`.

## Configuration

See [`crowdnav-api/src/main/resources/application.yml`](crowdnav-api/src/main/resources/application.yml).

- `app.inference.mode` — `mock` or `onnx`.
- `app.inference.onnx-model-path` — filesystem path to `.onnx` (or env `CROWDNAV_ONNX_PATH`).
- `app.inference.imgsz` — input size (default 640; match training/export).
- `app.inference.conf-threshold` — detection confidence floor (default 0.25).
