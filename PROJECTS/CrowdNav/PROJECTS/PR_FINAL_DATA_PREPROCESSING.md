# Pull Request: Comprehensive Data Preprocessing & Documentation Overhaul

## 🏗️ Work Summary
This PR consolidates the work for **Phase 1 (Part-B)**, focusing on data cleansing, automated pseudo-labeling for the JRDB dataset, and aligning project documentation with the current technical architecture (YOLOv8 + AWS SageMaker).

## 🚀 Key Changes

### 1. Data Preprocessing Pipeline
- **New Script:** `src/data/pseudo_label_yolov8.py`
    - Implements automated labeling using a pre-trained `yolov8x.pt` model.
    - Features dynamic batch sizing based on hardware (GPU/CPU).
    - Integrates with **ClearML** for experiment tracking.
    - Auto-generates `data.yaml` for SageMaker compatibility.
    - Flags low-confidence frames (< 0.8) for manual review.
- **Data Cleanup:** 
    - Removed unused camera views (`image_4`, `image_6`, `image_8`, `image_stitched`).
    - Cleaned up root-level images to reduce workspace noise.

### 2. Documentation Alignment
- **PRD (`PROJECTS/PRD.md`)**:
    - Narrowed scope to **JRDB dataset** and **Person class** only.
    - Defined "Crowd" as a spatial cluster of detected persons.
    - Removed out-of-scope references (COCO, Wheelchairs, Luggage).
- **Tech Spec (`PROJECTS/TechSpec.md`)**:
    - Updated stack to **PyTorch/Ultralytics** for local labeling and **AWS SageMaker (Keras/TF)** for training.
    - Documented the two-stage pipeline (Local Pseudo-labeling → Cloud Fine-tuning).
- **Architecture Diagrams**:
    - Created `PROJECTS/docs/data_pipeline_diagram.md` with a detailed Mermaid flowchart for AWS and ClearML teams.
    - Added a Sequence Diagram to `src/data/preprocessing/README.md` explaining JSON-to-YOLO conversion logic.
- **Developer Experience**:
    - Standardized `README.md` files across `src/data/` and `src/data/preprocessing/`.
    - Updated `scripts/automate_preprocessing.py` with comprehensive docstrings and actual project paths.

### 3. Engineering Rigor
- **`.gitignore`**: Added broad exclusions for large binary model weights (`.pt`, `.onnx`, etc.) to prevent repository bloating.
- **`requirements.txt`**: Added `typing_extensions>=4.6.0` to resolve environment compatibility issues.

## 🧪 Validation Results
- **Syntax/Help Check**: Verified `pseudo_label_yolov8.py` runs with `-h` after dependency fix.
- **Local Dry-run**: Verified script pathing and folder creation logic.
- **Commit History**: Cleaned up the branch to follow developer guidelines.

## ⏭️ Next Steps
1. Execute `python src/data/pseudo_label_yolov8.py --debug` to generate full labels.
2. Hand over `data/processed/` and `data.yaml` to the AWS SageMaker team for fine-tuning.
3. Review `manual_review_required.csv` for any critical detection gaps.

---
**Review Request:** Please verify the `data.yaml` generation logic matches the SageMaker input requirements.
