# `/models`

This directory is used to store trained model weights and checkpoints (`.pt`, `.onnx`).

## Guidelines
- Avoid committing large weight files directly to the repository unless necessary for inference.
- Use tools like DVC (Data Version Control) or standard cloud storage for large model artifacts if they exceed GitHub limits.
- Save intermediate training checkpoints here during longer runs.
