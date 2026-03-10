# Assignment-3 Part-A — Project Proposal

## 1. Project Title
Crowd Detection and Accessibility Navigation for Disabilities While Travelling

## 2. Team Members
- Jungowok (25167747)
- Phoi Gia Vuong (25736012)
- Chihyun (14707133)

## 3. Project Abstract / Summary
Navigating densely populated public spaces and transport hubs presents significant barriers to safe and independent travel for individuals with disabilities. In dynamic environments, unpredictable crowd behaviours and transient physical obstacles often compromise accessibility and user safety. To address these challenges, this project introduces a crowd detection and analysis system driven by Convolutional Neural Networks (CNNs). The proposed computer vision framework is engineered to process real-time environmental data, delivering actionable insights into spatial dynamics. Specifically, the system accurately quantifies crowd density, maps directional pedestrian flow, and identifies temporary or permanent accessibility obstacles. By synthesising these real-time metrics, the algorithmic framework dynamically calculates optimal accessible routes tailored to the specific mobility requirements of the user. Furthermore, it incorporates an early warning mechanism to proactively alert users to highly congested zones and potential hazards. Preliminary evaluations suggest that this CNN-based approach significantly mitigates navigation difficulties in high-traffic areas. Ultimately, the deployment of this intelligent spatial analysis system promises to enhance the safety, mobility, and overall independence of individuals with disabilities, fostering more inclusive urban infrastructure and accessible public transport networks.

## 4. Dataset Details
For the core functionality of crowd counting, density mapping, and obstacle detection, we plan to utilize the following datasets:
- **ShanghaiTech Dataset (Part A & B):** Crucial for training CNNs on varying levels of crowd density. Part A provides highly congested scenes, while Part B offers sparser distributions typical of transport hub corridors.
- **UCF-QNRF:** A massive crowd counting dataset containing extremely dense and challenging scenes, necessary for achieving high accuracy in robust density map generation.
- **COCO (Common Objects in Context):** Used via transfer learning for general obstacle detection, specifically filtering classes like `person`, `backpack`, `suitcase`, `chair`, and vehicles that often obstruct accessible paths.

## 5. Additional Support Required
To successfully achieve the project outcomes, the team may require:
- **Computational Resources:** Access to UTS high-performance computing (HPC) clusters or cloud GPU resources to facilitate the training of computationally intensive deep learning models like YOLO and CSRNet within the project timeframe.
- **Ethics Clearance Guidance:** Advice on UTS ethics approval procedures if the team determines that capturing supplemental custom video footage within university spaces is necessary for localized validation testing.

## 6. Proposed Method / Model
We will design and implement a Convolutional Neural Network (CNN) pipeline that combines:
- **Object Detection:** Using state-of-the-art models like **YOLO (v8 or v10)** via transfer learning to detect people, wheelchairs, and specific obstacles in real-time.
- **Crowd Density Estimation:** Employing models like **CSRNet** to estimate crowd density maps in areas where individual object detection struggles due to heavy occlusion.
The models will be trained and fine-tuned on our selected datasets to ensure high accuracy and real-time inference speed suitable for a live-stream application.

## 7. Expected Outcomes
- A trained DL model capable of accurate, real-time crowd density mapping and obstacle detection.
- A functional GUI (Mobile App or Web App) designed with accessibility in mind, which operationalizes the DL solution.
- The system will allow users to query specific routes and receive visual/audio feedback regarding crowd levels and accessibility.
- A comprehensive comparison of at least two algorithms (e.g., comparing YOLO-based detection vs. density estimation techniques) to determine the optimum performance for this specific use case.

## 8. Timeline / Plan
- **Part B (Implementation Plan):** Dataset finalization, data preprocessing pipeline setup, and initial model architecture definition.
- **Part C (Initial Results):** Base model training, hyperparameter tuning, and generation of initial experimental results and performance metrics.
- **Part D (GUI Design):** Designing and developing the accessible interface (e.g., Mobile App) and integrating it with the model inference pipeline.
- **Part E, F, G (Final Review & Defense):** Final model evaluation, complete project report drafting, and preparation of the demonstration and presentation for the oral defense.
