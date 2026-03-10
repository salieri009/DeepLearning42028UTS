# `/data`

This directory contains all data for the CrowdNav deep learning project.

## Structure
- `/raw`: Immutable, original datasets (ShanghaiTech, UCF-QNRF, etc.). This directory **MUST NOT** be synced to Git. (Covered by `.gitignore`)
- `/processed`: Cleaned, augmented, resized data ready for model training.

*Note: Raw large datasets should be downloaded manually or via scripts in `src/data` and placed into the `raw/` folder.*
