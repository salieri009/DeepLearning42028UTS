"""
FastAPI inference service for CrowdNav.
Loads best.pt (YOLOv8) and runs person detection + collision-avoidance heuristics.

Run:
    uvicorn main:app --reload --port 9000

Environment variables:
    MODEL_PATH   Path to best.pt (default: ./best.pt)
    CONF_THRESH  YOLO confidence threshold 0-1 (default: 0.35)
"""

from __future__ import annotations

import base64
import os
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="CrowdNav Inference", version="1.0.0")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
MODEL_PATH = os.environ.get("MODEL_PATH", "./best.pt")
CONF_THRESH = float(os.environ.get("CONF_THRESH", "0.35"))

# ---------------------------------------------------------------------------
# Lazy model loader
# ---------------------------------------------------------------------------
_model = None


def _load_model():
    global _model
    if _model is not None:
        return _model
    model_path = Path(MODEL_PATH)
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model file not found: {model_path.resolve()}. "
            "Set MODEL_PATH env var to the correct path."
        )
    from ultralytics import YOLO  # imported lazily to allow fast startup
    _model = YOLO(str(model_path))
    return _model


# ---------------------------------------------------------------------------
# Collision-avoidance heuristics
# (mirrors train/src/inference/collision_avoidance.py — height-based metric)
# ---------------------------------------------------------------------------
_SAFE_MAX = 0.25
_WARN_MAX = 0.45


def _alert_state(norm_height: float) -> str:
    h = max(0.0, min(1.0, norm_height))
    if h < _SAFE_MAX:
        return "SAFE"
    if h < _WARN_MAX:
        return "WARNING"
    return "DANGER"


def _worst_state(states: list[str]) -> str:
    if "DANGER" in states:
        return "DANGER"
    if "WARNING" in states:
        return "WARNING"
    return "SAFE"


def _crowd_density(n: int, worst: str, density_limit: int = 64) -> str:
    if n == 0:
        return "LOW"
    if n >= density_limit or worst == "DANGER":
        return "HIGH"
    medium_threshold = max(3, density_limit // 2)
    if n >= medium_threshold or worst == "WARNING":
        return "MEDIUM"
    return "LOW"


def _recommendation(worst: str) -> str:
    return {"SAFE": "PROCEED", "WARNING": "CAUTION", "DANGER": "STOP"}.get(worst, "PROCEED")


# ---------------------------------------------------------------------------
# Request / Response
# ---------------------------------------------------------------------------
class InferRequest(BaseModel):
    frame_base64: str | None = None
    conf_thresh: float | None = None
    density_limit: int | None = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health() -> dict[str, str]:
    if not Path(MODEL_PATH).exists():
        raise HTTPException(status_code=503, detail="Model file not found")
    return {"status": "ok", "model": "ready"}


@app.post("/internal/infer")
def infer(payload: InferRequest) -> dict[str, Any]:
    if not payload.frame_base64:
        raise HTTPException(status_code=400, detail="frame_base64 is required")

    # 1. Decode base64 → numpy BGR image
    try:
        raw = base64.b64decode(payload.frame_base64)
        arr = np.frombuffer(raw, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("cv2.imdecode returned None")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image: {exc}") from exc

    # 2. YOLO inference (class 0 = person)
    conf_thresh = payload.conf_thresh if payload.conf_thresh is not None else CONF_THRESH
    density_limit = payload.density_limit if payload.density_limit is not None else 64
    try:
        model = _load_model()
        results = model.predict(img, conf=conf_thresh, classes=[0], verbose=False)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Inference error: {exc}") from exc

    frame_h, frame_w = img.shape[:2]
    persons: list[dict[str, Any]] = []
    alert_states: list[str] = []

    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = (float(v) for v in box.xyxy[0].tolist())
            conf = float(box.conf[0])

            x_center = ((x1 + x2) / 2) / frame_w
            y_center = ((y1 + y2) / 2) / frame_h
            width = (x2 - x1) / frame_w
            height = (y2 - y1) / frame_h

            state = _alert_state(height)
            alert_states.append(state)

            persons.append(
                {
                    "class": "person",
                    "confidence": round(conf, 4),
                    "bbox": {
                        "x_center": round(x_center, 4),
                        "y_center": round(y_center, 4),
                        "width": round(width, 4),
                        "height": round(height, 4),
                    },
                    "proximity_risk": state,
                }
            )

    worst = _worst_state(alert_states)

    return {
        "persons": persons,
        "crowd_density": _crowd_density(len(persons), worst, density_limit),
        "max_proximity_risk": worst,
        "recommendation": _recommendation(worst),
    }
