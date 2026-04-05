# `src/data`

Data-related scripts and preprocessing utilities for CrowdNav.

## Components

- `jrdb_to_yolo.py`: command wrapper for JRDB JSON to YOLO labels
- `preprocessing/`: modular preprocessing package

## Run

```bash
python -m src.data.jrdb_to_yolo <input_json> <output_dir> <img_width> <img_height>
```
