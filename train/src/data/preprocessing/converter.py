"""Conversion logic from JRDB-style annotation records to YOLO label files."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

from ..formats.yolo_label import format_line
from .types import AnnotationRecord, YoloBox


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(value, max_value))


def to_yolo(
    record: AnnotationRecord, class_id: int, img_width: int, img_height: int
) -> YoloBox:
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
        track_id=record.track_id,
    )


def _sanitize_image_key(image_key: str) -> str:
    path = Path(image_key)
    sanitized = path.with_suffix("").as_posix().replace("/", "_")
    return sanitized if sanitized else image_key


def write_yolo_files(
    records: Iterable[tuple[AnnotationRecord, int]],
    output_dir: Path,
    img_width: int,
    img_height: int,
    *,
    include_track_id: bool = True,
) -> tuple[int, int]:
    """Write per-image YOLO label files; return ``(written_boxes, skipped_boxes)``.

    Uses the shared ``format_line`` utility so that label format (5 vs 6
    columns) is controlled from a single place.
    """
    if output_dir.exists() and not output_dir.is_dir():
        raise NotADirectoryError(
            f"Output path exists and is not a directory: {output_dir}"
        )
    try:
        output_dir.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        raise OSError(
            f"Unable to create output directory '{output_dir}': {exc}"
        ) from exc

    written = 0
    skipped = 0
    buckets: dict[str, list[str]] = {}

    for record, class_id in records:
        yolo_box = to_yolo(record, class_id, img_width=img_width, img_height=img_height)
        if yolo_box.width <= 0.0 or yolo_box.height <= 0.0:
            skipped += 1
            continue

        image_key = _sanitize_image_key(record.image_key)
        line = format_line(
            class_id=yolo_box.class_id,
            x_center=yolo_box.x_center,
            y_center=yolo_box.y_center,
            width=yolo_box.width,
            height=yolo_box.height,
            track_id=yolo_box.track_id,
            include_track_id=include_track_id,
        )
        buckets.setdefault(image_key, []).append(line)

    for image_key, lines in buckets.items():
        out_path = output_dir / f"{image_key}.txt"
        out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        written += len(lines)

    return written, skipped
