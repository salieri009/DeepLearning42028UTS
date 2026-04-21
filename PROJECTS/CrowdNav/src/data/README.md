# `src/data`

Data-related scripts and preprocessing utilities for CrowdNav.

## Components

- `jrdb_to_yolo.py`: command wrapper for JRDB JSON to YOLO labels
- `preprocessing/`: modular preprocessing package

## Run

```bash
python -m src.data.jrdb_to_yolo <input_json> <output_dir> <img_width> <img_height>
```

## Batch Automation

Use the orchestration script to run `dvc pull`, convert multiple JSON files, and validate labels.

```bash
python scripts/automate_preprocessing.py \
	data/raw/jrdb/annotations \
	data/raw/jrdb/images \
	data/processed/auto_labels \
	1920 \
	1080 \
	--recursive
```

Useful options:

- `--skip-dvc-pull`: skip DVC sync
- `--continue-on-dvc-failure`: continue even when `dvc pull` fails
- `--allow-duplicate-stems`: allow repeated image or label stems across folders
- `--validation-only`: skip conversion and only compare raw images against existing labels
- `--flat-output`: write all labels into one directory
- `--fail-fast`: stop on first failed file
- `--dry-run`: print planned actions only

The script also writes `preprocessing_report.json` into the output root.
