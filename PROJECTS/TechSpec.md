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
The pipeline adopts a hybrid approach to handle both precise obstacle identification and general crowdedness in heavily occluded scenes.

### 3.1 Object Detection Model
*   **Architecture:** YOLOv8 or YOLOv10
*   **Purpose:** To detect individuals, wheelchairs, and specific logistical obstacles (e.g., unattended luggage, service carts).
*   **Training Strategy:** Transfer learning using a pre-trained base model. The final layers will be fine-tuned to recognize the custom target classes.
*   **Inputs:** RGB frames ($H \times W \times 3$).
*   **Outputs:** Bounding boxes, class labels, and confidence scores.

### 3.2 Crowd Density Estimation Model
*   **Architecture:** CSRNet (Congested Scene Recognition Network) or similar CNN-based density estimator.
*   **Purpose:** To generate a continuous density map mapping the distribution of people in scenes where traditional bounding box detection fails due to severe overlap and occlusion.
*   **Training Strategy:** Training on high-density datasets (e.g., ShanghaiTech or UCF-QNRF) to regress a density map where the integral over an area yields the estimated count.
*   **Inputs:** RGB frames.
*   **Outputs:** Heatmap of crowd distribution.

## 4. Data Processing & Pipeline
### 4.1 Data Sources
*   **Crowd Data:** ShanghaiTech Dataset (Part A for highly congested, Part B for sparse), UCF-QNRF.
*   **Obstacle Data:** COCO Dataset (filtering classes like `person`, `backpack`, `suitcase`, `bench`, `chair`).
*   **Custom Data:** Supplemental frames collected or extracted from public CCTV feeds (if needed) for transfer learning evaluation.

### 4.2 Preprocessing Pipeline
1.  **Resizing and Normalization:** Standardize input frames to model-specific dimensions (e.g., $640 \times 640$ for YOLO).
2.  **Data Augmentation:** Apply random cropping, horizontal flipping, brightness/contrast adjustments, and mosaic augmentation to improve model robustness across various lighting and camera angles.
3.  **Density Map Generation (for CSRNet):** Apply Gaussian kernels to point-level annotations to generate ground-truth continuous density maps.

## 5. Software Stack & Dependencies
*   **Deep Learning Framework:** PyTorch (preferred for CSRNet and YOLOv8/v10 implementation).
*   **Computer Vision Libraries:** OpenCV (frame extraction, preprocessing).
*   **Backend Server:** FastAPI or Flask (Python) to expose the model via REST/WebSocket APIs for real-time inference.
*   **Frontend Technologies:** React Native (if Mobile) or React.js (if Web app) to build the accessible interface.

## 6. Real-Time Inference Criteria
*   **Hardware Accelerator:** GPU (CUDA compatible) required for latency-sensitive processing.
*   **Latency Target:** Processing time per frame under 100ms (10 FPS) to maintain "real-time" responsiveness for navigation.
*   **Optimization:** Convert PyTorch models to TensorRT or ONNX for accelerated inference on deployment endpoints.

## 7. API Design Outline (Draft)
*   `POST /api/v1/analyze-frame`: Uploads a single frame or base64 string and returns bounding box coordinates and an aggregated density score.
*   `GET /api/v1/route-status?path={path_id}`: Polls the current crowdedness metric of predefined hub zones.
*   **Response Format:** JSON containing `obstacles: []`, `crowd_density_level: "HIGH|MEDIUM|LOW"`, and `recommendation: "RE-ROUTE|SAFE"`.

## 8. Development & Evaluation Plan
*   **Metrics:** 
    *   Object Detection: Mean Average Precision (mAP) @ IoU=0.5.
    *   Crowd Estimation: Mean Absolute Error (MAE) and Mean Squared Error (MSE).
*   **Evaluation Phase:** Conduct offline evaluation against validation sets followed by simulated live-stream testing.
