# CrowdNav: Crowd Detection and Accessibility Navigation

This repository contains the deep learning processing pipelines, models, and application structure for the CrowdNav project.

## Directory Structure
- `data/`: Contains raw (`data/raw/`) and processed (`data/processed/`) datasets. **Important**: Never commit raw dataset files to Git.
- `models/`: Trained model weights and checkpoints (`.pt`, `.onnx`).
- `notebooks/`: Jupyter notebooks used for EDA or experimental scripts.
- `src/`: Core, modularized Python source code for data loading (`src/data`), model definitions (`src/models`), and utilities (`src/utils`).
- `frontend/`: Placeholder for future GUI development.

## Team Conventions

### Branch Naming Convention
To keep the project organized among the team, we use a **functional, code-based** naming convention for our branches.

**Format**: `<type>/<functional-code>-<short-description>`

**Types**:
- `feat`: Developing a new feature or model component.
- `fix`: Fixing a bug in the code.
- `docs`: Documentation updates.
- `exp`: Experimental scripts or Jupyter notebook explorations.
- `chore`: Maintenance tasks (e.g., updating requirements.txt).

**Functional Codes**:
We group work into the following functional categories:
* `F10x`: Data Pipeline & Preprocessing (e.g., F101 for Dataloaders)
* `F20x`: YOLO Object Detection (e.g., F201 for YOLO Training)
* `F30x`: CSRNet Density Estimation (e.g., F301 for CSRNet Architecture)
* `F40x`: API / Backend structure
* `F50x`: Frontend / App structure

**Examples**:
- `feat/F201-yolo-detection`: Branch for setting up the main YOLO pipeline.
- `exp/F301-csrnet-eda`: Branch for Jupyter notebook experiments on CSRNet datasets.

### Workflow
1. Always base new feature branches off `develop`, not `main`.
```bash
git checkout develop
git checkout -b feat/F101-data-pipeline
```
2. When creating a pull request or merging, target the `develop` branch.
3. The `main` branch is strictly reserved for production-ready, final submission code.
