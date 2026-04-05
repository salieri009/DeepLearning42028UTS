"""Typed structures used by JRDB preprocessing."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class BoundingBox:
    """A 2D bounding box in absolute pixel coordinates."""

    x_min: float
    y_min: float
    x_max: float
    y_max: float


@dataclass(frozen=True)
class YoloBox:
    """A YOLO-normalized bounding box."""

    class_id: int
    x_center: float
    y_center: float
    width: float
    height: float


@dataclass(frozen=True)
class AnnotationRecord:
    """Annotation item parsed from JRDB-like JSON."""

    image_key: str
    class_name: str
    bbox: BoundingBox
