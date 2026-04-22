---
last_updated: 2026-04-22
related_code:
  - src/data/
  - src/inference/
  - src/mlops/
  - scripts/train_yolo.py
  - scripts/automate_preprocessing.py
related_diagram:
  - PROJECTS/sysml/System_Architecture_Documentation.md
---

# Product Requirements Document (PRD)

## 1. Project Overview
Project Name: Crowd Detection and Accessibility Navigation for Disabilities While Travelling  
Subject: 42028 Deep Learning (UTS 2026 Semester 1)

## 2. Problem Statement
Users with mobility and accessibility needs face risk in crowded transport spaces. Existing navigation apps usually do not model short-range crowd hazard risk from the user's local perspective.

## 3. Product Vision
Build a computer-vision assistant that detects nearby crowd/obstacle risks and outputs immediate guidance signals (visual/audio) for safer local movement decisions.

## 4. Target Users
- Wheelchair and mobility-aid users.
- Visually impaired users needing warning cues.
- Elderly travelers and users preferring lower-crowd pathways.

## 5. Product Requirements
### 5.1 Model and Data
- Use YOLO-based object detection as the core detector.
- Support training from generated YOLO labels and `data.yaml` split artifacts.
- Keep preprocessing reproducible with command-line scripts.

### 5.2 Inference Behavior
- Compute risk states from bounding box geometry and configured thresholds.
- Return deterministic states (`SAFE`, `WARNING`, `DANGER`) per frame.
- Keep logic lightweight for near-real-time execution.

### 5.3 Accessibility Output
- Provide clear alert states suitable for future UI integration.
- Support color + audio signal mapping at the interface layer.

## 6. Success Criteria
- Preprocessing pipeline runs reproducibly and emits validated labels.
- Training pipeline can complete train/validate/export workflow.
- Inference module classifies risk states consistently for test inputs.

## 7. Out of Scope (Current Baseline)
- Production-grade frontend app.
- Full route-planning/navigation graph engine.
- Cloud production deployment with SLO-backed operations.

## Review Request Guide
- State which requirement section changed and why.
- Link code path(s) that satisfy the requirement.
- Include one validation command and its expected result.
- Record any requirement that is still open and moved to backlog.
