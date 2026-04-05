# Technical Specification Document

## 1. Introduction
**Project:** Crowd Detection and Accessibility Navigation for Disabilities While Travelling
**Purpose of Document:** This document serves as the Technical Specification (Tech Spec) outlining the system architecture, model components, data pipeline, and key technical decisions necessary to build and deploy the application.

## 2. System Architecture Overview
The system is divided into three primary components:
1. **Frontend / Application Layer:** A Web or Mobile GUI for end-users to query routes and receive visual/audio feedback.
2. **Backend Server / API:** Handles incoming video streams or static image requests, coordinates inference, and processes the results into actionable navigation data.
3. **Deep Learning Inference Pipeline:** The core engine executing Object Detection and Crowd Density Estimation models.

## 3. Deep Learning Pipeline
The pipeline utilizes a single-stage object detector optimized for real-time inference on edge devices, coupled with a depth-heuristic logic layer.

### 3.1 Object Detection & Proximity Model
*   **Architecture:** Keras / TensorFlow-based CNN (e.g., MobileNet or EfficientDet variants for low latency).
*   **Purpose:** To detect individuals, wheelchairs, and navigational obstacles (e.g., luggage) from a low-vantage POV.
*   **Training Strategy:** Transfer learning using a pre-trained base model. Fine-tuning on curated pedestrian and mobility aid images from JRDB.
*   **Inputs:** RGB frames ($640 \times 640$).
*   **Outputs:** Bounding boxes, class labels, and proximity risk estimations.

### 3.2 Proximity & Alerting Logic
*   **Mechanism:** Bounding-Box Scaling Heuristic.
*   **Logic:** Instead of complex depth mapping, the system calculates the area of detected bounding boxes relative to the total frame area.
*   **Thresholding:**
    *   **Level 1 (Warning):** Target box height > 40% of frame height.
    *   **Level 2 (Critical):** Target box height > 60% of frame height.
*   **Justification:** For a fixed wheelchair POV, the vertical scale of a pedestrian correlates strongly with physical proximity.

## 4. Data Processing & Pipeline
### 4.1 Data Sources
*   **Primary Dataset:** JRDB (JackRabbot Dataset) — provides annotated pedestrian sequences from a lower vantage point, suitable for crowd detection and proximity estimation from a wheelchair perspective.
*   **Supplementary Data:** COCO Dataset (`person`, `backpack`, `suitcase`, `bench`, `chair` classes) and Open Images (`Wheelchair` class) for additional obstacle and mobility aid coverage.
*   **Custom POV Data:** Targeted collection of video from wheelchair height to calibrate proximity thresholds.

### 4.2 Preprocessing Pipeline
1.  **Resizing and Normalization:** Standardize input frames to model-specific dimensions (e.g., $640 \times 640$ for YOLO).
2.  **Data Augmentation:** Apply random cropping, horizontal flipping, brightness/contrast adjustments, and mosaic augmentation to improve model robustness across various lighting and camera angles.
3.  **Proximity Calibration:** Use custom POV data to calibrate bounding-box size thresholds against known physical distances.

## 5. Software Stack & Dependencies
*   **Deep Learning Framework:** Keras / TensorFlow.
*   **Computer Vision Libraries:** OpenCV (frame extraction, preprocessing).
*   **Backend & Cloud Infrastructure:** AWS (for model training, hosting, and inference endpoints). FastAPI or Flask can wrap the API.
*   **Frontend Technologies:** React Native.

## 6. Real-Time Inference Criteria
*   **Hardware Accelerator:** GPU (CUDA compatible) required for latency-sensitive processing.
*   **Latency Target:** Processing time per frame under 100ms (10 FPS) to maintain "real-time" responsiveness for navigation.
*   **Optimization:** Deploy Keras models to GPU-backed AWS endpoints (e.g., SageMaker GPU inference endpoints or ECS/EC2 with NVIDIA GPUs). If an ONNX/TFLite CPU deployment is used, it should be treated as a smaller-model fallback path with different latency expectations rather than the primary real-time serving path.

## 7. API Design Outline (Draft)
*   `POST /api/v1/analyze-frame`: Uploads a single frame or base64 string and returns bounding box coordinates and proximity risk scores.
*   **Response Format:** JSON containing `obstacles: []`, `max_proximity_risk: "CRITICAL|WARNING|SAFE"`, and `recommendation: "STOP|CAUTION|PROCEED"`.

## 8. Development & Evaluation Plan
*   **Metrics:** 
    *   Object Detection: Mean Average Precision (mAP) @ IoU=0.5.
    *   Crowd Estimation: Mean Absolute Error (MAE) and Mean Squared Error (MSE).
*   **Evaluation Phase:** Conduct offline evaluation against validation sets followed by simulated live-stream testing.
