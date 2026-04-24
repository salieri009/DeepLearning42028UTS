---
last_updated: 2026-04-22
related_code:
	- src/data/
	- src/inference/
	- src/mlops/
	- src/utils/
related_diagram:
	- PROJECTS/sysml/System_Architecture_Documentation.md
---

# /src

Main Python source tree for CrowdNav runtime, preprocessing, and training.

## Subdirectories
- `src/data`: JSON parsing, YOLO conversion, split generation.
- `src/inference`: proximity scoring, alert states, dispatcher logic.
- `src/mlops`: training and export pipeline wrappers.
- `src/utils`: shared utilities (for example ClearML setup).
- `src/models`: reserved module area for model-specific code.

## Conventions
- Keep modules import-safe and CLI-friendly.
- Prefer typed functions and dataclasses for shared structures.
- Keep notebook-only experimentation out of `src/`.

## Review Request Guide
- Describe which `src/` module changed and why.
- Include exact run commands used for validation.
- Attach expected output paths (for example weights, reports, or labels).
- Note diagram impact if block/interface behavior changed.
