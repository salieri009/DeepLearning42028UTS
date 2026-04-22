---
last_updated: 2026-04-22
related_code:
  - src/data/pseudo_label_yolov8.py
  - scripts/automate_preprocessing.py
  - src/data/split_by_sequence.py
related_diagram:
  - PROJECTS/docs/data_pipeline_diagram.md
---

# Product Requirements Document (PRD)

## 1. Project Overview
**Project Name:** Crowd Detection and Accessibility Navigation for Disabilities While Travelling
**Subject:** 42028 Deep Learning (UTS 2026 Semester 1)

**Team Members:**
- Jungowok (25167747)
- Phoi Gia Vuong (25736012)
- Chihyun (14707133)

## 2. Problem Statement
Navigating crowded transport hubs (airports, train stations) and public spaces can be overwhelming, challenging, and sometimes unsafe for individuals with disabilities. Existing navigation apps lack real-time crowd density awareness and rarely detect temporary accessibility obstacles that impede mobility.

## 3. Product Vision
Develop a computer vision-based crowd analysis and navigation system. The system processes video feeds or live camera data to detect pedestrian density and directional flow in real time. When many people are detected clustered together in a region, that region is classified as a **crowd**. By identifying crowd density and mapping accessible routes, the application enhances the safety, mobility, and independence of individuals navigating congested environments.

## 4. Target Audience
- Individuals with physical or mobility disabilities (e.g., wheelchair users).
- Visually impaired individuals requiring audio feedback on obstacles and crowdedness.
- Elderly travelers who need to avoid high-density areas.
- General travelers seeking less congested routes.

## 5. Key Features & Requirements

### 5.1 Deep Learning Pipeline
- **Real-time Person Detection:** Detect individuals using YOLOv8 fine-tuned on the JRDB dataset.
- **Crowd Definition:** A spatial cluster of detected `person` bounding boxes that exceed a density threshold within a given region of the frame is classified as a **crowd**.
- **Proximity Analysis Logic:** Develop a heuristic layer that calculates collision risk based on bounding-box vertical scaling, optimized for low-vantage perspectives.
- **Model Training & Integration:** YOLOv8 model will be fine-tuned via transfer learning on JRDB pedestrian data using AWS SageMaker, then deployed as a backend for real-time inference.

### 5.2 User Interface (GUI - Web/Mobile App)
- **Accessible Design:** High contrast, large fonts, simple layouts, and compatibility with screen readers.
- **Visual Feedback:** Color-coded bounding boxes or HUD indicators signifying proximity risk (Low/Warning/Critical).
- **Route Selection:** Simple path-clearance markers indicating the safest immediate route through identified crowd areas.
- **Audio/Haptic Alerts:** Proximity alerts for highly congested areas or immediate obstacles.

### 5.3 System Performance
- **Real-time Inference:** Process frames with sufficiently low latency for live-stream application.
- **Accuracy:** High confidence in detecting persons, minimizing false negatives for crowd detection.

## 6. Datasets
- **Primary Dataset:** JRDB (JackRabbot Dataset) — pedestrian video sequences from a lower vantage point (Stanford campus), targeting the `person` class only.
- **Scope:** Camera views `image_0` and `image_2` from JRDB. A subset of 20 location/video sequence folders is selected for initial training.

> [!NOTE]
> Detection scope is intentionally limited to the `person` class only. Wheelchair and luggage detection are **out of scope** for this project.

## 7. Development Timeline
- **Phase 1 (Part-B):** Dataset acquisition, data preprocessing pipeline setup (YOLOv8 pseudo-labeling on JRDB), and definition of initial model architecture.
- **Phase 2 (Part-C):** Baseline model fine-tuning on AWS SageMaker, hyperparameter tuning, generation of initial results/metrics, and calibration of proximity heuristics.
- **Phase 3 (Part-D):** GUI design, usability considerations for the accessibility interface, and integration with the deep learning model inference pipeline.
- **Phase 4 (Part-E, F, G):** Final evaluation, comprehensive project report drafting, and preparation for oral defense demonstrations.

## 8. Success Metrics
- **Technical Metrics:**
  - Stable Frames Per Second (FPS) target during inference on mobile-grade hardware.
  - Proximity Alert Accuracy (True Positive Rate for critical hazards).
  - High Object Detection Precision and Recall metrics for the `person` class (mAP @ IoU=0.5).
  - Crowd density estimation accuracy (correct identification of dense vs. sparse regions).
- **User Experience:**
  - System successfully identifies an alternate accessible route when the primary path is heavily crowded.
  - Accessible UI meets key usability standards and supports assistive technologies.

## Review Request Guide
- State which Phase the PR belongs to.
- Link the dataset subset or data path involved.
- Include model version and training parameters used.
- Link the relevant SageMaker job ID or ClearML experiment.
