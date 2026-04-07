# `/src/inference`

Inference-time business logic for edge-safe navigation behavior.

## Included Module
- `collision_avoidance.py`: Mock collision-avoidance prototype using YOLO-style
  2D bounding box scaling heuristics.

## Core Components
- `CollisionAvoidance`: Returns `SAFE`, `WARNING`, `DANGER` from bbox inputs.
- `MockYOLOGenerator`: Simulates a pedestrian approaching the camera by growing
  bounding box size frame-by-frame.

## Input Format
Bounding boxes use YOLO-style normalized format:

```text
[x_center, y_center, width, height]
```

## Run Mock Stream

```bash
python -m src.inference.collision_avoidance --frames 20
```

## Threshold Defaults
- SAFE: score < 0.25
- WARNING: 0.25 <= score < 0.45
- DANGER: score >= 0.45

You can override these with:
- `--safe-max`
- `--warning-max`
- `--metric` (`height`, `area`, `hybrid`)
