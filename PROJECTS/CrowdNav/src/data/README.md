---
last_updated: 2026-04-22
related_code:
	- src/data/jrdb_to_yolo.py
	- src/data/preprocessing/
	- src/data/split_by_sequence.py
	- scripts/automate_preprocessing.py
related_diagram:
	- PROJECTS/sysml/System_Architecture_Documentation.md
---

# src/data

Data preprocessing and dataset preparation modules for CrowdNav.

## Components
- `jrdb_to_yolo.py`: CLI wrapper for JRDB-style JSON to YOLO labels.
- `preprocessing/`: parser and converter package.
- `split_by_sequence.py`: train/val/test split builder and `data.yaml` generator.

## Single JSON Conversion
```bash
python -m src.data.jrdb_to_yolo <input_json> <output_dir> <img_width> <img_height>
```

## Batch Automation
Runs optional DVC pull, conversion, and validation checks.

```bash
python scripts/automate_preprocessing.py \
	data/raw/jrdb/annotations \
	data/raw/jrdb/images \
	data/processed/auto_labels \
	1920 \
	1080 \
	--recursive
```

Common options:
- `--validation-only`
- `--skip-dvc-pull`
- `--continue-on-dvc-failure`
- `--allow-duplicate-stems`
- `--flat-output`
- `--fail-fast`
- `--dry-run`

Output report: `data/processed/auto_labels/preprocessing_report.json`.

## Split Dataset for Training
```bash
python src/data/split_by_sequence.py \
	--src-labels data/processed/auto_labels \
	--src-images data/raw \
	--output-dir data/processed/splits \
	--seed 42
```

## Review Request Guide
- Include source label/image roots and split ratios.
- Attach summary counts for matched pairs and per-split totals.
- If validation fails, include missing-label and orphan-label counts.
- State whether DVC pull was required or skipped.
