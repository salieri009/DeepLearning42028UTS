---
last_updated: 2026-04-22
related_code:
  - src/inference/collision_avoidance.py
  - src/inference/depth_estimator.py
  - src/inference/alert_dispatcher.py
related_diagram:
  - PROJECTS/sysml/System_Architecture_Documentation.md
---

# src/inference

Inference-time risk scoring and alerting logic.

## Scope
- Bounding-box driven proximity scoring.
- Risk state classification (`SAFE`, `WARNING`, `DANGER`).
- Alert rendering and dispatch hooks.

## Module Notes
- `collision_avoidance.py`: thresholds, score metric, batch evaluation.
- `depth_estimator.py`: optional distance proxy from bbox geometry.
- `alert_dispatcher.py`: visual/audio alert routing by state.

## Design Constraints
- Keep runtime deterministic and low-latency.
- Do not pull training-only dependencies into inference modules.

## Review Request Guide
- Include threshold values and metric mode used in test runs.
- Include at least one example bbox and expected alert state.
- Flag any interface change that impacts frontend/runtime integration.
- Note if depth proxy logic changed expected alert behavior.
