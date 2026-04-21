# JRDB -> YOLO Preprocessing Module

## Recommended Structure

```text
src/
  data/
    __init__.py
    jrdb_to_yolo.py            # wrapper entry: python -m src.data.jrdb_to_yolo
    preprocessing/
      __init__.py
      types.py                 # dataclasses for bbox and records
      io_utils.py              # JSON loading and JRDB-style parsing helpers
      converter.py             # bbox normalization and YOLO txt writing
      cli.py                   # argparse CLI orchestration
      README.md                # this document
```

## Quick Run

```bash
python -m src.data.jrdb_to_yolo \
  ./data/raw/jrdb_annotations.json \
  ./data/processed/labels \
  1920 \
  1080
```

## CLI Arguments

- `input_json`: JRDB-style annotation JSON file path
- `output_dir`: destination directory for YOLO `.txt` files
- `img_width`: original image width in pixels
- `img_height`: original image height in pixels

## Outputs

- One label file per image key: `<image_stem>.txt`
- `classes.txt` containing class-name-to-id order

## Error Handling

- Missing input file: fails with clear error message
- Unsupported/malformed annotations: item skipped and counted
- Missing bbox keys: item skipped and counted
- Degenerate boxes (zero or negative size): skipped and counted

## Batch + DVC Automation

The project includes `scripts/automate_preprocessing.py` for end-to-end orchestration.

It does the following:

- runs `dvc pull` before conversion (unless skipped)
- processes multiple JSON files in one run
- validates generated labels against image files
- reports malformed/invalid skips and degenerate bbox skips in aggregate

Example:

```bash
python scripts/automate_preprocessing.py \
  data/raw/jrdb/annotations \
  data/raw/jrdb/images \
  data/processed/auto_labels \
  1920 \
  1080 \
  --recursive
```
