---
last_updated: 2026-05-02
related_code:
  - train/src/data/pseudo_label_yolov8.py
  - train/src/data/split_by_sequence.py
  - train/src/training/train_pipeline.py
  - train/scripts/train_yolo.py
  - infra/sagemaker/sagemaker_train.py
related_diagram:
  - docs/architecture/data_pipeline_diagram.md
---

# Technical Specification Document

## 1. Introduction
**Project:** Crowd Detection and Accessibility Navigation for Disabilities While Travelling
**Purpose of Document:** This document outlines the system architecture, model components, data pipeline, and key technical decisions for building and deploying the application.

## 2. System Architecture Overview
The system is divided into three primary components:
1. **Frontend / Application Layer:** A Web or Mobile GUI for end-users to query routes and receive visual/audio feedback.
2. **Backend Server / API:** Handles incoming video streams or static image requests, coordinates inference, and processes the results into actionable navigation data.
3. **Deep Learning Inference Pipeline:** The core engine executing Person Detection and Crowd Density Estimation.

## 3. Deep Learning Pipeline

### 3.1 Object Detection Model
- **Architecture:** YOLOv8 (Ultralytics, PyTorch-based). `yolov8x.pt` is used as the pre-trained base for fine-tuning.
- **Detection Target:** `person` class only. A spatial cluster of multiple detected person bounding boxes within a frame region is classified as a **crowd**.
- **Training Strategy:** Transfer learning — YOLOv8x pre-trained on COCO is fine-tuned on JRDB pedestrian sequences (local GPU, SageMaker Notebook, or **SageMaker Training Job** with S3 data).
- **Training stack:** **Ultralytics YOLO** on **PyTorch**. Core runner: [`train/src/training/train_pipeline.py`](train/src/training/train_pipeline.py) (`TrainPipeline`). Managed SageMaker jobs use [`infra/sagemaker/sagemaker_train.py`](infra/sagemaker/sagemaker_train.py); local runs use [`train/scripts/train_yolo.py`](train/scripts/train_yolo.py) (imports the public [`train/src/training/__init__.py`](train/src/training/__init__.py) surface).
- **Inputs:** RGB frames (640 × 640).
- **Outputs:** Bounding boxes with class (`person`) and confidence scores. Crowd density estimated from bounding box cluster density per region.

> [!NOTE]
> **Typical workflow:**
> - **Label generation:** `ultralytics` (PyTorch) — `pseudo_label_yolov8.py` writes YOLO `.txt` labels from JRDB frames.
> - **Training:** same Ultralytics stack — local / SageMaker Notebook (`train_yolo.py`) or SageMaker Training Job (`sagemaker_train.py`) with data in S3.

### 3.2 Proximity & Alerting Logic
- **Mechanism:** Bounding-Box Scaling Heuristic.
- **Logic:** The system calculates the area of detected bounding boxes relative to the total frame area.
- **Thresholding:**
  - **Level 1 (Warning):** Target box height > 40% of frame height.
  - **Level 2 (Critical):** Target box height > 60% of frame height.
- **Justification:** For a fixed wheelchair POV, the vertical scale of a pedestrian correlates strongly with physical proximity.

## 4. Data Processing & Pipeline

### 4.1 Data Sources
- **Primary Dataset:** JRDB (JackRabbot Dataset) — annotated pedestrian video sequences from a lower vantage point (Stanford campus). Camera views `image_0` and `image_2` used. 20 location/sequence folders selected as training subset.
- **Target Class:** `person` only. No other classes (wheelchair, luggage, etc.) are in scope.

> [!IMPORTANT]
> COCO and Open Images datasets are **not used**. Detection scope is strictly limited to person detection on JRDB data.

### 4.2 Preprocessing Pipeline (Two Stages)

**Stage 1 — Local Pseudo-Labeling (`pseudo_label_yolov8.py`):**
1. Pre-trained `yolov8x.pt` runs inference on JRDB video frames (GPU batch=16, CPU batch=4).
2. Person detections are saved as YOLO `.txt` label files under `data/processed/labels/<sequence>/`.
3. Frames with any detection confidence < 0.8 are flagged in `manual_review_required.csv` for human review.
4. `data.yaml` is auto-generated for SageMaker compatibility.
5. Run metadata (model, thresholds, device) is logged to **ClearML**.

**Stage 2 — Cloud Fine-tuning (AWS SageMaker):**
1. `data/processed/splits/` is uploaded to S3.
2. SageMaker Training Job runs YOLOv8 fine-tuning using `data.yaml`.
3. Output: fine-tuned model `.pt` / `.onnx` for deployment.

> [!NOTE]
> **Inference weights (current plan):** Real-time inference uses the **`best.pt`** checkpoint from training (local or SageMaker). For the **Spring Boot** runtime, export **`best.pt` → ONNX** (Ultralytics, NMS embedded) and load that file in **`crowdnav-api`** via ONNX Runtime Java — **no Python web service** and **no separate SageMaker inference endpoint** for this project phase.

### 4.3 Dataset Split
`train/src/data/split_by_sequence.py` splits data at the sequence level:
- Train: 70%, Val: 20%, Test: 10%
- Output: `data/processed/splits/{train,val,test}/{images,labels}/`

## 5. Software Stack & Dependencies

| Layer | Tool |
|---|---|
| Local Labeling | Python, Ultralytics YOLOv8, PyTorch |
| Experiment Tracking | ClearML (`Task.init`) |
| Cloud Training | AWS SageMaker PyTorch estimator (`infra/sagemaker/sagemaker_train.py`) |
| Data Storage | S3 (training data), local `data/processed/` |
| Computer Vision | OpenCV (frame extraction, preprocessing) |
| Backend API | Spring Boot (`application/backend/crowdnav-api`) — ONNX Runtime inference from exported YOLO weights |
| Frontend (planned) | React Native |

## 6. Real-Time Inference Criteria
- **Hardware Accelerator:** GPU (CUDA compatible) required for latency-sensitive processing.
- **Latency Target:** Processing time per frame under 100ms (10 FPS minimum) for real-time navigation.
- **Model artifact:** Use **`best.pt`** from training, **export to ONNX** for the JVM, and configure **`crowdnav-api`** with that path (see [`docs/runbooks/post_train_spring_onnx.md`](runbooks/post_train_spring_onnx.md)).
- **Optimization (optional future):** GPU-backed AWS inference endpoints; baseline is Spring + ONNX on the app host.

## 7. API Design Outline (Draft)
- `POST /api/v1/analyze-frame`: Uploads a single frame or base64 string and returns bounding box coordinates and crowd density scores.
- **Response Format:** JSON containing `persons: []`, `crowd_density: "HIGH|MEDIUM|LOW"`, `max_proximity_risk: "CRITICAL|WARNING|SAFE"`, and `recommendation: "STOP|CAUTION|PROCEED"`.

## 8. Development & Evaluation Plan
- **Metrics:**
  - Object Detection: Mean Average Precision (mAP) @ IoU=0.5 for `person` class.
  - Crowd Estimation: Accuracy of HIGH/MEDIUM/LOW density classification per region.
- **Evaluation Phase:** Offline evaluation against JRDB validation split, followed by simulated live-stream testing.

## Review Request Guide
- Confirm framework layer (local labeling vs. SageMaker training) affected.
- Include ClearML task link or SageMaker job ID.
- Include `data.yaml` path used.
- State model version (`.pt` filename) and confidence thresholds.
