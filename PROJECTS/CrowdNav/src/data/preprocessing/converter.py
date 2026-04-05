"""Core conversion logic from JRDB-style records to YOLO text files."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

from .types import AnnotationRecord, YoloBox


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(value, max_value))


def to_yolo(record: AnnotationRecord, class_id: int, img_width: int, img_height: int) -> YoloBox:
    """Convert one absolute bounding box record into YOLO normalized coordinates."""
    x_min = _clamp(record.bbox.x_min, 0.0, float(img_width))
    y_min = _clamp(record.bbox.y_min, 0.0, float(img_height))
    x_max = _clamp(record.bbox.x_max, 0.0, float(img_width))
    y_max = _clamp(record.bbox.y_max, 0.0, float(img_height))

    width_px = max(0.0, x_max - x_min)
    height_px = max(0.0, y_max - y_min)

    x_center = (x_min + width_px / 2.0) / float(img_width)
    y_center = (y_min + height_px / 2.0) / float(img_height)
    width = width_px / float(img_width)
    height = height_px / float(img_height)

    return YoloBox(
        class_id=class_id,
        x_center=_clamp(x_center, 0.0, 1.0),
        y_center=_clamp(y_center, 0.0, 1.0),
        width=_clamp(width, 0.0, 1.0),
        height=_clamp(height, 0.0, 1.0),
    )


def _sanitize_image_key(image_key: str) -> str:
    stem = Path(image_key).stem
    if stem:
        return stem
    return image_key.replace("/", "_").replace("\\", "_")


def write_yolo_files(
    records: Iterable[tuple[AnnotationRecord, int]],
    output_dir: Path,
    img_width: int,
    img_height: int,
) -> tuple[int, int]:
    """Write one YOLO ``.txt`` per image key and return (written_boxes, skipped_boxes)."""
    output_dir.mkdir(parents=True, exist_ok=True)

    buckets: dict[str, list[YoloBox]] = {}
    skipped = 0

    for record, class_id in records:
        yolo_box = to_yolo(record, class_id, img_width=img_width, img_height=img_height)
        if yolo_box.width <= 0.0 or yolo_box.height <= 0.0:
            skipped += 1
            continue

        image_key = _sanitize_image_key(record.image_key)
        buckets.setdefault(image_key, []).append(yolo_box)

    written = 0
    for image_key, yolo_boxes in buckets.items():
        out_path = output_dir / f"{image_key}.txt"
        lines = [
            f"{box.class_id} {box.x_center:.6f} {box.y_center:.6f} {box.width:.6f} {box.height:.6f}"
            for box in yolo_boxes
        ]
        out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        written += len(lines)

    return written, skipped
