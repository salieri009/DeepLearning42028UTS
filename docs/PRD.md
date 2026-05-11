---
last_updated: 2026-05-11
related_code:
  - train/src/data/pseudo_label_yolov8.py
  - train/scripts/automate_preprocessing.py
  - train/src/data/split_by_sequence.py
  - application/inference-service/main.py
  - application/backend/crowdnav-api/src/main/java/com/crowdnav/api/service/RemoteAnalyzeFrameService.java
related_diagram:
  - docs/architecture/data_pipeline_diagram.md
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
Develop a computer vision-based crowd analysis and navigation system. The system processes video feeds or live camera data to detect pedestrian density and directional flow in real time. When many people are detected clustered together in a region, that region is classified as a **crowd**. By identifying crowd density and proximity risk, the application enhances the safety, mobility, and independence of individuals navigating congested environments.

## 4. Target Audience
- Individuals with physical or mobility disabilities (e.g., wheelchair users).
- Elderly travelers who need to avoid high-density areas.
- General travelers seeking less congested routes.

## 5. Key Features & Requirements

### 5.1 Deep Learning Pipeline
- **Real-time Person Detection:** Detect individuals using YOLOv8m fine-tuned on the JRDB dataset.
- **Crowd Definition:** A spatial cluster of detected `person` bounding boxes that exceed a density threshold within a given region of the frame is classified as a **crowd** (LOW / MEDIUM / HIGH).
- **Proximity Analysis Logic:** A heuristic layer calculates collision risk based on bounding-box vertical scaling, optimized for low-vantage perspectives. Risk states: SAFE / WARNING / DANGER.
- **Model Training & Integration:** YOLOv8m fine-tuned via transfer learning on JRDB pedestrian ground-truth labels using AWS SageMaker. Weights deployed as a FastAPI inference service (`/internal/infer`) called by the Spring Boot backend.

### 5.2 User Interface (GUI — Web App)
- **Visual Feedback:** Color-coded bounding boxes overlaid on live camera feed:
  - SAFE → green border
  - WARNING → yellow border
  - DANGER → red border
- **Text Feedback:** Statistics panel displays crowd density, max proximity risk, and recommendation (PROCEED / CAUTION / STOP) as plain text.

### 5.3 System Performance
- **Real-time Inference:** Frontend captures frames at 2 FPS; inference latency target < 500 ms per frame.
- **Accuracy:** Validated mAP@IoU=0.5 = 0.4475 on JRDB validation split (Phase C checkpoint).

## 6. Datasets
- **Primary Dataset:** JRDB (JackRabbot Dataset) — pedestrian video sequences from a lower vantage point (Stanford campus), targeting the `person` class only.
- **Scope:** Camera views `image_0` and `image_2` from JRDB. 27 location/video sequence folders processed (exceeds original 20-sequence target).

> [!NOTE]
> Detection scope is intentionally limited to the `person` class only. Wheelchair and luggage detection are **out of scope** for this project.

## 7. Development Timeline

| Phase | Status | Notes |
|---|---|---|
| **Phase 1 (Part-B)** Dataset & Preprocessing | ✅ Complete | JRDB ground-truth conversion (27 seqs, 411k boxes), train/val/test splits (80/10/10), data.yaml |
| **Phase 2 (Part-C)** Baseline Training | ✅ Complete | YOLOv8m trained in 3 phases on RTX 3050; mAP@0.5 = 0.4475; SageMaker config ready |
| **Phase 3 (Part-D)** GUI & Integration | ✅ Complete | `feat/full-integration`: FastAPI inference + Spring RestClient + React color-coded UI |
| **Phase 4 (Part-E,F,G)** Evaluation & Report | 🔄 In Progress | See `docs/reports/evaluation_metrics.md` for metrics template; FPS benchmark pending |

## 8. Success Metrics

| Metric | Target | Achieved |
|---|---|---|
| mAP@IoU=0.5 (person class, val split) | > 0.40 | **0.4475** (Phase C) |
| mAP@IoU=0.5 (person class, test split) | > 0.50 | **0.6361** (Phase C) |
| Inference latency per frame | < 500 ms | TBD (see evaluation_metrics.md) |
| Proximity alert correctness (SAFE/WARNING/DANGER) | Qualitative | Heuristic validated on mock stream |
| Crowd density classification (LOW/MEDIUM/HIGH) | Qualitative | Rule-based (n≤2 LOW, n≤5 MEDIUM, else HIGH) |

## 9. Scope Changes (feat/full-integration)

The following items were **removed from scope** based on project constraints:

| Feature | Original PRD | Current Status |
|---|---|---|
| Audio / Haptic alerts | Required | **Removed** — proximity alerts are text-only |
| Screen reader / WCAG compliance | Required | **Removed** — no ARIA labels or accessibility audit |
| Route selection / path-clearance markers | Required | **Deferred** — static text recommendation only (PROCEED/CAUTION/STOP) |
| Visually impaired audio feedback | Target audience | **Removed** — audio output not implemented |

These features may be revisited in a future phase if time permits.

## Review Request Guide
- State which Phase the PR belongs to.
- Link the dataset subset or data path involved.
- Include model version and training parameters used.
- Link the relevant SageMaker job ID or ClearML experiment.
