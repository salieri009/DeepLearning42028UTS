---
last_updated: 2026-04-22
related_code:
  - src/data/preprocessing/cli.py
  - src/data/preprocessing/io_utils.py
  - src/data/preprocessing/converter.py
  - src/data/preprocessing/types.py
  - scripts/automate_preprocessing.py
related_diagram:
  - PROJECTS/sysml/System_Architecture_Documentation.md
---

# JRDB to YOLO Preprocessing Module

## Package Layout
```text
src/data/preprocessing/
  types.py
  io_utils.py
  converter.py
  cli.py
```

## CLI Entry
```bash
python -m src.data.jrdb_to_yolo <input_json> <output_dir> <img_width> <img_height>
```

## Behavior
- Parses JRDB-like JSON variants into typed records.
- Converts xyxy boxes into YOLO normalized format.
- Writes one label file per image stem plus `classes.txt`.
- Skips malformed records and degenerate boxes with counters.

## Batch Orchestration
`scripts/automate_preprocessing.py` can execute conversion over multiple JSON files and validate output consistency.

Validation modes:
- conversion + validation
- validation-only (for image+label checks without JSON conversion)

Generated report:
- `preprocessing_report.json` in output root.

## Review Request Guide
- Include one sample input JSON key format that was validated.
- Include aggregate skip counters (invalid and degenerate).
- Include classes mapping output (`classes.txt`) from your run.
- Include whether validation-only mode was used.
