"""YOLO label line formatting, parsing, and validation.

Supports both standard 5-column and extended 6-column (with track_id) formats.
This module is the single source of truth for YOLO label line structure in CrowdNav.

Standard format:  <class_id> <x_center> <y_center> <width> <height>
Extended format:  <class_id> <x_center> <y_center> <width> <height> <track_id>
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class LabelLine:
    """One parsed YOLO label line (5 or 6 columns)."""

    class_id: int
    x_center: float
    y_center: float
    width: float
    height: float
    track_id: int | None = None

    @property
    def is_extended(self) -> bool:
        return self.track_id is not None


def format_line(
    class_id: int,
    x_center: float,
    y_center: float,
    width: float,
    height: float,
    track_id: int | None = None,
    *,
    include_track_id: bool = True,
) -> str:
    """Format a single YOLO label line.

    When ``include_track_id`` is True and ``track_id`` is not None, the
    track_id is appended as the 6th column for downstream tracking tasks.
    """
    line = f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}"
    if include_track_id and track_id is not None:
        line += f" {track_id}"
    return line


def format_from_label(label: LabelLine, *, include_track_id: bool = True) -> str:
    """Format a ``LabelLine`` dataclass back into a YOLO text line."""
    return format_line(
        class_id=label.class_id,
        x_center=label.x_center,
        y_center=label.y_center,
        width=label.width,
        height=label.height,
        track_id=label.track_id,
        include_track_id=include_track_id,
    )


def parse_line(line: str) -> LabelLine | None:
    """Parse a YOLO label line string into a ``LabelLine``.

    Returns None when the line cannot be parsed (fewer than 5 tokens or
    non-numeric values).
    """
    parts = line.strip().split()
    if len(parts) < 5:
        return None
    try:
        class_id = int(parts[0])
        x_center = float(parts[1])
        y_center = float(parts[2])
        width = float(parts[3])
        height = float(parts[4])
        track_id = int(parts[5]) if len(parts) >= 6 else None
    except (ValueError, IndexError):
        return None
    return LabelLine(
        class_id=class_id,
        x_center=x_center,
        y_center=y_center,
        width=width,
        height=height,
        track_id=track_id,
    )


def validate_line(label: LabelLine) -> list[str]:
    """Return validation error messages for a ``LabelLine`` (empty list if valid)."""
    errors: list[str] = []
    if label.class_id < 0:
        errors.append(f"class_id must be >= 0, got {label.class_id}")
    for name, value in [
        ("x_center", label.x_center),
        ("y_center", label.y_center),
        ("width", label.width),
        ("height", label.height),
    ]:
        if not 0.0 <= value <= 1.0:
            errors.append(f"{name} must be in [0.0, 1.0], got {value}")
    return errors
