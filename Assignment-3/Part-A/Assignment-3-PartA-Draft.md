# Assignment-3 Part-A — Project Proposal

## 1. Project Title
Crowd Detection and Accessibility Navigation for Disabilities While Travelling

## 2. Team Members
- Jungwook Van (25167747) — **Team Lead**
- Phoi Gia Vuong (25736012)
- Chihyun (14707133)

## 3. Project Abstract / Summary
Navigating densely populated transport hubs presents significant barriers to safe and independent travel for individuals with mobility disabilities. In dynamic environments, unpredictable pedestrian movements and transient physical obstacles often compromise user safety. To address these challenges, this project introduces a computer vision-based navigational assistance system driven by a single-stage Object Detection Convolutional Neural Network (YOLO). Designed specifically for a lower-vantage, first-person perspective, such as that of a wheelchair user, the system processes real-time video inputs to proactively identify pedestrians and localized logistical obstacles. Utilizing transfer learning on datasets like COCO and Open Images, the model is fine-tuned to recognize critical elements within crowded transport environments. Crucially, rather than relying on computationally heavy multi-model architectures for density mapping, our system employs an efficient bounding-box scaling and heuristic depth-thresholding approach to estimate the proximity of approaching hazards. By analyzing object scale and position within the frame, the system triggers real-time visual or auditory warnings, effectively acting as a localized collision-avoidance assistant. This streamlined, single-model CNN approach aims to significantly mitigate navigation difficulties in high-traffic areas, fostering greater independence and safety without requiring constant cloud connectivity or heavy edge-computing resources.

## 4. Dataset   Details
For object detection and proximity calibration from a wheelchair perspective, we plan to utilize the following datasets:
- **COCO (Common Objects in Context):** Used via transfer learning for general obstacle detection, specifically filtering classes like `person`, `backpack`, and `suitcase` that often obstruct accessible paths.
- **Open Images:** Specifically utilized for the `Wheelchair` class data to ensure the model recognizes mobility aid users, improving peer-to-peer safety in transit hubs.
- **Custom POV Dataset:** A targeted collection of first-person video recorded at wheelchair height (simulated or real-world) to calibrate and validate the bounding-box proximity heuristics.

## 5. Additional Support Required
To successfully achieve the project outcomes, the team may require:
- **Computational Resources:** Access to UTS high-performance computing (HPC) clusters or cloud GPU resources to facilitate the training of computationally intensive deep learning models like YOLO within the project timeframe.
- **Ethics Clearance Guidance:** Advice on UTS ethics approval procedures if the team determines that capturing supplemental custom video footage within university spaces is necessary for localized validation testing.

## 6. Proposed Method / Model
We will design and implement a single-model deep learning pipeline focused on real-time awareness:
- **Single-Stage Detection:** Using **YOLO (v8 or v10)** via transfer learning to detect people, mobility aids, and specific luggage obstacles in real-time.
- **Proximity Logic:** Implementing a bounding-box scaling heuristic that estimates distance based on the vertical size and frame-area percentage of detected objects, allowing for low-latency obstacle avoidance without a dedicated depth sensor.
The model will be trained on filtered datasets and validated against a custom POC dataset to ensure the high-inference speeds necessary for real-world wheelchair navigation.

## 7. Expected Outcomes
- A trained YOLO model optimized for a first-person wheelchair POV.
- A functional proximity alerting system that triggers warnings based on bounding-box size thresholds.
- A functional GUI (Mobile or Web App) designed with accessibility in mind, providing visual and haptic/audio risk alerts.
- A comprehensive evaluation of the proximity heuristic accuracy across different pedestrian distances and lighting conditions.

## 8. Timeline / Plan
- **Part B (Implementation Plan):** Dataset finalization, data preprocessing pipeline setup, and initial model architecture definition.
- **Part C (Initial Results):** Base model training, hyperparameter tuning, and generation of initial experimental results and performance metrics.
- **Part D (GUI Design):** Designing and developing the accessible interface (e.g., Mobile App) and integrating it with the model inference pipeline.
- **Part E, F, G (Final Review & Defense):** Final model evaluation, complete project report drafting, and preparation of the demonstration and presentation for the oral defense.
