# `/src`

This is the main directory for deep learning source code of the CrowdNav project.

## Subdirectories
- `/src/data`: Scripts for data loading pipelines, dataset extraction, validation, or generating subsets from raw datasets.
- `/src/models`: Core definitions of Neural Network architectures (e.g., YOLO classes, CSRNet classes) and the training loop scripts.
- `/src/utils`: Custom metrics implementations (MAE, MSE, mAP calculation), logging functions, and other helper scripts.

*Rule of thumb: Code here should be modular, PEP8 compliant, and designed to run from the command line, rather than interactively like in `/notebooks`.*
