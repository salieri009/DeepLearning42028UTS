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
    """
    A YOLO-normalized bounding box.
    Extended Format: <class_id> <x_center> <y_center> <width> <height> <track_id>
    The track_id is optional and appended as the 6th column for tracking analysis.
    """

    class_id: int
    x_center: float
    y_center: float
    width: float
    height: float
    track_id: int | None = None


@dataclass(frozen=True)
class AnnotationRecord:
    """Annotation item parsed from JRDB-like JSON."""

    image_key: str
    class_name: str
    bbox: BoundingBox
    track_id: int | None = None
