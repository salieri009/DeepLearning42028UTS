# Assignment-3 Part-A — Project Proposal

## 1. Project Title
Crowd Detection and Accessibility Navigation for Disabilities While Travelling

## 2. Team Members
- Jungowok (25167747)
- Phoi Gia Vuong (25736012)
- Chihyun (14707133)

## 3. Project Abstract / Summary
Navigating through crowded transport hubs (e.g., airports, train stations) and public spaces can be highly challenging and overwhelming for individuals with disabilities. This project aims to develop a computer vision-based crowd detection and analysis system that provides real-time insights into crowd density, directional flow, and potential accessibility obstacles. By processing video feeds or live camera data, the system will identify optimal, accessible routes and alert users to highly congested areas, thereby enhancing their safety, mobility, and independence while travelling.

## 4. Dataset
We plan to utilize existing crowd counting and detection datasets, such as:
- **ShanghaiTech Dataset** or **UCF-QNRF** for crowd density estimation.
- **COCO (Common Objects in Context)** for general obstacle detection (e.g., luggage, vehicles).
We will also explore capturing a custom dataset or using subsets of surveillance datasets from travel environments to specifically focus on accessibility pinch-points.

## 5. Proposed Method / Model
We will design and implement a Convolutional Neural Network (CNN) pipeline that combines:
- **Object Detection:** Using state-of-the-art models like **YOLO (v8 or v10)** via transfer learning to detect people, wheelchairs, and specific obstacles in real-time.
- **Crowd Density Estimation:** Employing models like **CSRNet** to estimate crowd density maps in areas where individual object detection struggles due to heavy occlusion.
The models will be trained and fine-tuned on our selected datasets to ensure high accuracy and real-time inference speed suitable for a live-stream application.

## 6. Expected Outcomes
- A trained DL model capable of accurate, real-time crowd density mapping and obstacle detection.
- A functional GUI (Mobile App or Web App) designed with accessibility in mind, which operationalizes the DL solution.
- The system will allow users to query specific routes and receive visual/audio feedback regarding crowd levels and accessibility.
- A comprehensive comparison of at least two algorithms (e.g., comparing YOLO-based detection vs. density estimation techniques) to determine the optimum performance for this specific use case.

## 7. Timeline / Plan
- **Part B (Implementation Plan):** Dataset finalization, data preprocessing pipeline setup, and initial model architecture definition.
- **Part C (Initial Results):** Base model training, hyperparameter tuning, and generation of initial experimental results and performance metrics.
- **Part D (GUI Design):** Designing and developing the accessible interface (e.g., Mobile App) and integrating it with the model inference pipeline.
- **Part E, F, G (Final Review & Defense):** Final model evaluation, complete project report drafting, and preparation of the demonstration and presentation for the oral defense.
