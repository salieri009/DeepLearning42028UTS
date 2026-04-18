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

## Auto-labeling

Use YOLOv8x to generate person-only pseudo labels from local raw image folders.

### Batch run

```bash
python run_auto_labeling.py \
  --input-dir data/raw \
  --output-dir data/processed/auto_labels \
  --max-folders 20 \
  --confidence 0.6
```

### Local smoke test

This uses a fake YOLO model so you can validate the file flow on existing JPGs without downloading weights.
Outputs go to `--output-dir` when provided; if omitted the script writes to a temporary directory.

```bash
python -m src.data.preprocessing.auto_labeler_smoke \
  --input-dir data/raw \
  --max-folders 1
```

To persist outputs, pass an explicit output directory:

```bash
python -m src.data.preprocessing.auto_labeler_smoke \
  --input-dir data/raw \
  --output-dir data/processed/auto_labels_smoke \
  --max-folders 1
```

### Expected input layout

The runner accepts either of these shapes:

```text
data/raw/*.jpg
```

or

```text
data/raw/<sequence>/image_0/*.jpg
data/raw/<sequence>/image_2/*.jpg
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
