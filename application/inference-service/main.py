"""FastAPI inference service — CrowdNav person detection via YOLOv8.

Endpoints:
    GET  /health          → liveness probe
    POST /internal/infer  → run YOLO on a base64-encoded JPEG/PNG frame

Run locally:
    MODEL_PATH=/path/to/best.pt uvicorn main:app --port 9000
"""

from __future__ import annotations

import base64
import logging
import os
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from collision_avoidance import AlertState, CollisionAvoidance

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("crowdnav.inference")

MODEL_PATH = os.getenv("MODEL_PATH", "/opt/model/best.pt")

app = FastAPI(title="CrowdNav Inference", version="1.0.0")

_model: Any = None
_evaluator = CollisionAvoidance()  # height metric, default thresholds


@app.on_event("startup")
def load_model() -> None:
    global _model
    try:
        from ultralytics import YOLO  # type: ignore[import]

        logger.info("Loading YOLO model from %s", MODEL_PATH)
        _model = YOLO(MODEL_PATH)
        logger.info("Model loaded successfully")
    except Exception as exc:
        logger.error("Failed to load model: %s", exc)
        _model = None


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class InferRequest(BaseModel):
    frame_base64: str = Field(..., description="Base64-encoded JPEG or PNG frame")


class BBoxOut(BaseModel):
    x_center: float
    y_center: float
    width: float
    height: float


class PersonOut(BaseModel):
    class_: str = Field(..., alias="class")
    confidence: float
    bbox: BBoxOut
    risk_level: str

    model_config = {"populate_by_name": True}


class InferResponse(BaseModel):
    persons: list[PersonOut]
    crowd_density: str
    max_proximity_risk: str
    recommendation: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _decode_frame(frame_base64: str) -> np.ndarray:
    """Decode a base64 string to a BGR numpy array."""
    try:
        img_bytes = base64.b64decode(frame_base64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64 data: {exc}") from exc

    arr = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image from frame_base64")
    return img


def _crowd_density(n: int) -> str:
    if n <= 2:
        return "LOW"
    if n <= 5:
        return "MEDIUM"
    return "HIGH"


def _recommendation(risk: AlertState) -> str:
    if risk == AlertState.DANGER:
        return "STOP"
    if risk == AlertState.WARNING:
        return "CAUTION"
    return "PROCEED"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/internal/infer", response_model=InferResponse)
def infer(req: InferRequest) -> InferResponse:
    if _model is None:
        raise HTTPException(status_code=503, detail="Model not ready — check MODEL_PATH")

    try:
        img = _decode_frame(req.frame_base64)

        results = _model(img, verbose=False)
        boxes = results[0].boxes

        persons: list[PersonOut] = []
        bboxes_for_crowd: list[list[float]] = []

        if boxes is not None and len(boxes) > 0:
            xyxyn = boxes.xyxyn.cpu().numpy()   # shape (N, 4): x1n y1n x2n y2n
            confs = boxes.conf.cpu().numpy()
            classes = boxes.cls.cpu().numpy()

            for i in range(len(xyxyn)):
                cls_id = int(classes[i])
                if cls_id != 0:  # person class only
                    continue

                x1n, y1n, x2n, y2n = xyxyn[i]
                x_center = float((x1n + x2n) / 2)
                y_center = float((y1n + y2n) / 2)
                width = float(x2n - x1n)
                height = float(y2n - y1n)
                bbox_vals = [x_center, y_center, width, height]

                alert = _evaluator.evaluate(bbox_vals)
                bboxes_for_crowd.append(bbox_vals)

                persons.append(
                    PersonOut(
                        class_="person",
                        confidence=float(confs[i]),
                        bbox=BBoxOut(
                            x_center=x_center,
                            y_center=y_center,
                            width=width,
                            height=height,
                        ),
                        risk_level=alert.value,
                    )
                )

        max_risk = _evaluator.evaluate_many(bboxes_for_crowd)
        density = _crowd_density(len(persons))
        recommendation = _recommendation(max_risk)

        return InferResponse(
            persons=persons,
            crowd_density=density,
            max_proximity_risk=max_risk.value,
            recommendation=recommendation,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Inference error: %s", exc)
        raise HTTPException(status_code=500, detail="Inference error") from exc
