# Post-training: `best.pt` → ONNX → Spring

Checklist after a training run (local or SageMaker).

1. **Offline metrics (optional)**  
   From repo root or `train/`:
   ```bash
   python scripts/eval_yolo.py --weights path/to/best.pt --data-yaml path/to/data.yaml
   ```

2. **Export ONNX for `crowdnav-api`**  
   Default export embeds NMS (required by the Java decoder):
   ```bash
   python scripts/eval_yolo.py --weights path/to/best.pt --data-yaml path/to/data.yaml --export-onnx
   ```
   Note the output `.onnx` path (often next to `best.pt`). Do not commit large binaries.

3. **Run Spring with ONNX**  
   Set `app.inference.mode=onnx` and point `app.inference.onnx-model-path` at the file (or set env `CROWDNAV_ONNX_PATH`). Example:
   ```bash
   export CROWDNAV_ONNX_PATH=/abs/path/crowdnav.onnx
   # application.yml: app.inference.mode: onnx
   ./gradlew bootRun
   ```

4. **Smoke API**  
   `POST /api/v1/analyze-frame` with `multipart/form-data` part `image` or JSON `frame_base64`. ONNX mode requires non-empty image bytes; mock mode still ignores payload.

See [`application/backend/README.md`](../../application/backend/README.md) and [`docs/TechSpec.md`](../TechSpec.md) §7 for the response schema.
