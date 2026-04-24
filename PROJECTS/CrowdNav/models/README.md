---
last_updated: 2026-04-22
related_code:
	- scripts/train_yolo.py
	- src/mlops/train_pipeline.py
related_diagram:
	- PROJECTS/sysml/System_Architecture_Documentation.md
---

# /models

Storage location for trained model artifacts (for example `.pt`, `.onnx`, `.ncnn`).

## Guidelines
- Keep large artifacts in DVC-managed storage where possible.
- Keep naming tied to run context (model, date, dataset version).
- Do not overwrite baseline weights without version note.

## Review Request Guide
- Include source training run (command and config).
- Include exact exported format and file name.
- Include validation metric summary for the artifact.
- State whether artifact is tracked via DVC.
