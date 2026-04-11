## Summary
- Add a pure-Python JRDB 2D bounding-box to YOLO label conversion pipeline.
- Introduce a modular preprocessing package under `src/data/preprocessing`.
- Add CLI entrypoint for reproducible conversion runs.

## Why
- Prepare data conversion workflow before full JRDB data delivery.
- Keep dependencies minimal for future edge deployment compatibility.
- Make module review and integration straightforward for team members.

## What Changed
- Added parser helpers for JRDB-like JSON variants.
- Added robust bbox conversion into normalized YOLO format.
- Added one-file-per-image label export plus `classes.txt` generation.
- Added docs and wrapper command (`python -m src.data.jrdb_to_yolo`).

## Validation
- Executed CLI against a small sample JSON fixture.
- Verified generated `.txt` labels and `classes.txt` output.

## Notes
- Uses only Python standard libraries (`pathlib`, `json`, `argparse`) in pipeline code.
- Invalid/malformed annotation items are skipped and counted instead of crashing.
