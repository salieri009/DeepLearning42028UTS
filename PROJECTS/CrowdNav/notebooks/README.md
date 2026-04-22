---
last_updated: 2026-04-22
related_code:
	- notebooks/01_sagemaker_clearml_launcher.ipynb
	- src/
related_diagram:
	- PROJECTS/sysml/System_Architecture_Documentation.md
---

# /notebooks

Jupyter workspace for experiments and cloud-launch trials.

## Current Notebook
- `01_sagemaker_clearml_launcher.ipynb`: launcher and integration exploration notebook.

## Usage Policy
- Keep exploratory analysis in notebooks.
- Move reusable logic to `src/` and keep notebook cells thin.
- Record required package/runtime assumptions at top of each notebook.

## Review Request Guide
- Include notebook path and key executed cells changed.
- Include required environment/kernel details.
- Include outputs that support the decision (plots, metrics, logs).
- If logic moved to Python modules, list destination file paths.
