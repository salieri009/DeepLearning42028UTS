"""InferenceLayer depth estimation skeleton based on bbox geometry."""

from __future__ import annotations

from dataclasses import dataclass

from ..data.preprocessing.types import BoundingBox


@dataclass(frozen=True)
class DepthEstimator:
    """Estimate normalized depth proxies from bounding box measurements."""

    focal_length: float
    known_height: float

    def __init__(self, focal_length: float, known_height: float) -> None:
        """Initialize estimator parameters for project-specific depth heuristics."""
        object.__setattr__(self, "focal_length", focal_length)
        object.__setattr__(self, "known_height", known_height)

    def estimate(self, bbox: BoundingBox) -> float:
        """Estimate raw depth from one bounding box input."""
        raise NotImplementedError("DepthEstimator.estimate is not implemented yet.")

    def normalize(self, depth: float) -> float:
        """Normalize raw depth into [0.0, 1.0] range for downstream scoring."""
        raise NotImplementedError("DepthEstimator.normalize is not implemented yet.")
