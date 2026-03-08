# Product Requirements Document (PRD)

## 1. Project Overview
**Project Name:** Crowd Detection and Accessibility Navigation for Disabilities While Travelling
**Subject:** 42028 Deep Learning (UTS 2026 Semester 1)

**Team Members:**
- Jungowok (25167747)
- Phoi Gia Vuong (25736012)
- *(TBD - 3rd member)*

## 2. Problem Statement
Navigating crowded transport hubs (airports, train stations) and public spaces can be overwhelming, challenging, and sometimes unsafe for individuals with disabilities. Existing navigation apps lack real-time crowd density awareness and rarely detect temporary accessibility obstacles (e.g., luggage, unattended carts) that impede mobility.

## 3. Product Vision
Develop a computer vision-based crowd analysis and navigation system. The system processes video feeds or live camera data to provide real-time insights into crowd density, directional flow, and potential accessibility obstacles. By mapping optimal, accessible routes, the application enhances the safety, mobility, and independence of individuals navigating congested environments.

## 4. Target Audience
- Individuals with physical or mobility disabilities (e.g., wheelchair users).
- Visually impaired individuals requiring audio feedback on obstacles and crowdedness.
- Elderly travelers who need to avoid high-density areas.
- General travelers seeking less congested routes.

## 5. Key Features & Requirements

### 5.1 Deep Learning Pipeline
- **Real-time Object Detection:** Detect individuals, wheelchairs, and specific logistical obstacles (e.g., luggage, vehicles) using state-of-the-art models (YOLO v8/v10).
- **Crowd Density Estimation:** In heavily occluded areas where object detection struggles, the system will use density estimation models (e.g., CSRNet) to generate accurate crowd heatmaps.
- **Model Training & Integration:** Models will be fine-tuned via transfer learning on selected datasets and act as a backend for real-time inference.

### 5.2 User Interface (GUI - Web/Mobile App)
- **Accessible Design:** High contrast, large fonts, simple layouts, and compatibility with screen readers.
- **Visual Feedback:** Heatmap overlay indicating crowd density levels (low, medium, high).
- **Route Querying:** Users can input their destination and receive an accessible route avoiding high crowd density and identified obstacles.
- **Audio/Haptic Alerts:** Proximity alerts for highly congested areas or immediate obstacles.

### 5.3 System Performance
- **Real-time Inference:** Process frames with sufficiently low latency for live-stream application.
- **Accuracy:** High confidence in detecting obstacles that impede mobility with robust crowd estimation, minimizing false negatives for obstacles.

## 6. Datasets
- **Crowd Density Estimation:** ShanghaiTech Dataset or UCF-QNRF.
- **Object/Obstacle Detection:** COCO (Common Objects in Context), specifically targeting classes relevant to accessibility obstacles.
- **Custom Additions:** Potential custom datasets or subsets of travel/surveillance datasets focusing on accessibility pinch-points.

## 7. Development Timeline
- **Phase 1 (Part-B):** Dataset acquisition, exploratory data analysis, data preprocessing pipeline setup, and definition of initial model architecture.
- **Phase 2 (Part-C):** Baseline model training, hyperparameter tuning, generation of initial results/metrics, and comparison of algorithms (e.g., YOLO detection vs. density mapping).
- **Phase 3 (Part-D):** GUI design, usability considerations for the accessibility interface, and integration with the deep learning model inference pipeline.
- **Phase 4 (Part-E, F, G):** Final evaluation, comprehensive project report drafting, and preparation for oral defense demonstrations.

## 8. Success Metrics
- **Technical Metrics:**
  - Stable Frames Per Second (FPS) target during inference.
  - Low Crowd Counting Mean Absolute Error (MAE).
  - High Object Detection Precision and Recall metrics for selected classes.
- **User Experience:**
  - System successfully identifies an alternate accessible route when the primary path is heavily crowded or blocked.
  - Accessible UI meets key usability standards and supports assistive technologies securely.
