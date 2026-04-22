---
last_updated: 2026-04-22
related_code:
  - src/data/pseudo_label_yolov8.py
  - src/data/split_by_sequence.py
  - deploy/train_skeleton.py
related_diagram:
  - PROJECTS/docs/data_pipeline_diagram.md
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
- **Training Strategy:** Transfer learning — YOLOv8x pre-trained on COCO is fine-tuned on JRDB pedestrian sequences via **AWS SageMaker**.
- **Training Framework on SageMaker:** Keras / TensorFlow wrapper around the YOLO training pipeline for SageMaker compatibility.
- **Inputs:** RGB frames (640 × 640).
- **Outputs:** Bounding boxes with class (`person`) and confidence scores. Crowd density estimated from bounding box cluster density per region.

> [!NOTE]
> **Two-stage framework:**
> - **Local labeling stage:** `ultralytics` (PyTorch) — runs `pseudo_label_yolov8.py` locally to generate `.txt` label files from JRDB frames.
> - **Cloud training stage:** AWS SageMaker (Keras/TF wrapper) — receives `.txt` labels + images via S3 and runs fine-tuning.

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

### 4.3 Dataset Split
`src/data/split_by_sequence.py` splits data at the sequence level:
- Train: 70%, Val: 20%, Test: 10%
- Output: `data/processed/splits/{train,val,test}/{images,labels}/`

## 5. Software Stack & Dependencies

| Layer | Tool |
|---|---|
| Local Labeling | Python, Ultralytics YOLOv8, PyTorch |
| Experiment Tracking | ClearML (`Task.init`) |
| Cloud Training | AWS SageMaker (Keras/TF wrapper) |
| Data Storage | S3 (training data), local `data/processed/` |
| Computer Vision | OpenCV (frame extraction, preprocessing) |
| Backend API (planned) | FastAPI or Flask |
| Frontend (planned) | React Native |

## 6. Real-Time Inference Criteria
- **Hardware Accelerator:** GPU (CUDA compatible) required for latency-sensitive processing.
- **Latency Target:** Processing time per frame under 100ms (10 FPS minimum) for real-time navigation.
- **Optimization:** Deploy fine-tuned model to GPU-backed AWS endpoints (SageMaker inference endpoint). ONNX export available as a CPU fallback path.

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
