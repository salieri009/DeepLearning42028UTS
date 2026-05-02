"""
Skeleton FastAPI app for future Python inference (YOLO + heuristics).
Not used in mock-only flow — Java API returns static JSON today.

Run: uvicorn main:app --reload --port 9000
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI

app = FastAPI(title="CrowdNav Inference (stub)", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/internal/infer")
def infer_stub(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    """Placeholder until Ultralytics + crowd heuristics are mounted here."""
    return {
        "persons": [],
        "crowd_density": "LOW",
        "max_proximity_risk": "SAFE",
        "recommendation": "PROCEED",
        "note": "stub — replace with real inference",
    }
