---
last_updated: 2026-04-22
related_code:
  - scripts/train_yolo.py
  - scripts/automate_preprocessing.py
  - src/data/preprocessing/
  - src/data/split_by_sequence.py
  - src/inference/
  - src/mlops/train_pipeline.py
related_diagram:
  - PROJECTS/sysml/System_Architecture_Documentation.md
---

# Technical Specification Document

## 1. Scope
This document defines the implemented technical baseline for CrowdNav as of the current branch state.

## 2. Runtime Architecture
The codebase currently follows four implementation layers:
1. Domain Types: typed records for annotation and bbox data.
2. Preprocessing: JSON parse, validation, YOLO label conversion, split generation.
3. Inference: proximity score evaluation and alert dispatch.
4. MLOps: train/validate/export orchestration and optional tracking hooks.

## 3. Implemented Model/Training Stack
- Detector family: Ultralytics YOLO (`yolov8x.pt` currently referenced in scripts).
- Training wrapper: `TrainPipeline` in `src/mlops/train_pipeline.py`.
- CLI entrypoint: `scripts/train_yolo.py`.
- Export path: model export via `--export` argument (for example `onnx`).

## 4. Data Pipeline
### 4.1 Conversion
- Source: JRDB-style JSON annotations.
- Converter: `src/data/preprocessing/*` and wrapper `src/data/jrdb_to_yolo.py`.
- Output: per-image YOLO `.txt` labels and `classes.txt`.

### 4.2 Validation and Batch Run
- Orchestrator: `scripts/automate_preprocessing.py`.
- Supports DVC pull, recursive conversion, validation-only mode, and JSON report output.

### 4.3 Split and Training YAML
- Split script: `src/data/split_by_sequence.py`.
- Output root: `data/processed/splits/`.
- Expected generated artifact: `data.yaml` consumed by YOLO training.

## 5. Inference Logic
- Core module: `src/inference/collision_avoidance.py`.
- States: `SAFE`, `WARNING`, `DANGER`.
- Optional helper modules: `depth_estimator.py`, `alert_dispatcher.py`.
- Input assumption: normalized bbox geometry from detector output.

## 6. Tooling and Quality Gates
- Python environment managed via `requirements.txt`.
- Lint/type expectations referenced in architecture notes: `ruff` and `mypy --strict`.
- DVC used for large data and model artifact flow.

## 7. Open Technical Gaps
- Frontend/API contract is not yet implemented in code.
- End-to-end runtime pipeline integration (camera -> detector -> UI) is still partial.
- Production deployment hardening is pending.

## Review Request Guide
- Include exact command(s) used and their arguments.
- Include artifact paths produced by the run.
- Include metric summary for any train/validate change.
- Link architecture doc section if interfaces or layer boundaries changed.
