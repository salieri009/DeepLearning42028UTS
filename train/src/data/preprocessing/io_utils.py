"""IO utilities for JRDB-style annotation JSON files."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable

from .types import AnnotationRecord, BoundingBox


def load_json(path: Path) -> Any:
    """Load a JSON file and return its decoded content."""
    if not path.exists():
        raise FileNotFoundError(f"Input JSON does not exist: {path}")
    if not path.is_file():
        raise FileNotFoundError(f"Input path is not a file: {path}")

    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def iter_raw_items(data: Any) -> Iterable[dict[str, Any]]:
    """Yield dict items from common JRDB-like container structures.

    Handles top-level lists, or dicts with ``annotations`` / ``labels`` /
    ``items`` / ``frames`` keys.
    """
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                yield item
        return

    if not isinstance(data, dict):
        return

    for key in ("annotations", "labels", "items", "frames"):
        container = data.get(key)
        if isinstance(container, list):
            for item in container:
                if isinstance(item, dict):
                    yield item
            return


def parse_bbox(raw: dict[str, Any]) -> BoundingBox | None:
    """Parse a bounding box from heterogeneous key conventions.

    Tries nested bbox dict (``bbox`` / ``box`` / ``2d_bbox`` / ``rect``),
    flat ``x/y/w/h`` or ``x1/y1/x2/y2`` keys, and COCO-style keypoint arrays.
    """
    bbox = (
        raw.get("bbox")
        or raw.get("box")
        or raw.get("bounding_box")
        or raw.get("2d_bbox")
        or raw.get("rect")
    )

    try:
        if isinstance(bbox, dict):
            x = bbox.get("x", bbox.get("left", bbox.get("x1")))
            y = bbox.get("y", bbox.get("top", bbox.get("y1")))
            w = bbox.get("w", bbox.get("width"))
            h = bbox.get("h", bbox.get("height"))
            x2 = bbox.get("x2")
            y2 = bbox.get("y2")

            if None not in (x, y, w, h):
                assert (
                    x is not None and y is not None and w is not None and h is not None
                )
                return BoundingBox(
                    float(x), float(y), float(x) + float(w), float(y) + float(h)
                )
            if None not in (x, y, x2, y2):
                assert (
                    x is not None
                    and y is not None
                    and x2 is not None
                    and y2 is not None
                )
                return BoundingBox(float(x), float(y), float(x2), float(y2))

        if all(k in raw for k in ("x", "y", "w", "h")):
            x, y, w, h = raw["x"], raw["y"], raw["w"], raw["h"]
            return BoundingBox(
                float(x), float(y), float(x) + float(w), float(y) + float(h)
            )

        if all(k in raw for k in ("x1", "y1", "x2", "y2")):
            return BoundingBox(
                float(raw["x1"]), float(raw["y1"]), float(raw["x2"]), float(raw["y2"])
            )

        if "keypoints" in raw and isinstance(raw["keypoints"], list):
            kps = raw["keypoints"]
            xs = [
                kps[i]
                for i in range(0, len(kps), 3)
                if i + 2 < len(kps) and kps[i + 2] > 0
            ]
            ys = [
                kps[i + 1]
                for i in range(0, len(kps), 3)
                if i + 2 < len(kps) and kps[i + 2] > 0
            ]
            if xs and ys:
                return BoundingBox(
                    float(min(xs)), float(min(ys)), float(max(xs)), float(max(ys))
                )
    except (TypeError, ValueError, IndexError):
        return None

    return None


def parse_record(raw: dict[str, Any], fallback_index: int) -> AnnotationRecord | None:
    """Parse one raw annotation dictionary into an ``AnnotationRecord``.

    Returns None when the raw item lacks a recognisable bounding box.
    """
    bbox = parse_bbox(raw)
    if bbox is None:
        return None

    image_key = (
        raw.get("image")
        or raw.get("image_name")
        or raw.get("file_name")
        or raw.get("frame")
        or raw.get("frame_id")
        or raw.get("image_id")
    )
    if image_key is None:
        image_key = f"frame_{fallback_index:06d}"

    class_name = str(
        raw.get("label")
        or raw.get("category")
        or raw.get("class_name")
        or raw.get("class")
        or "person"
    )

    track_id_raw = raw.get("track_id") or raw.get("id") or raw.get("pedestrian_id")
    track_id: int | None = None
    if track_id_raw is not None:
        try:
            track_id = int(track_id_raw)
        except (ValueError, TypeError):
            pass

    return AnnotationRecord(
        image_key=str(image_key),
        class_name=class_name,
        bbox=bbox,
        track_id=track_id,
    )
