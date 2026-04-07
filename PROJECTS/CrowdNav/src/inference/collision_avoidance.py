"""Mock collision-avoidance assistant based on YOLO 2D bounding box scaling.

This module provides a pure-Python prototype of proximity alert logic for edge
hardware. It assumes incoming YOLO-style boxes in the form:

    [x_center, y_center, width, height]

All values are expected to be normalized in the range [0.0, 1.0], but values
outside that range are clamped for defensive behavior during prototyping.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from enum import Enum
from typing import Iterable, Iterator, Sequence

BBox = Sequence[float]


class AlertState(str, Enum):
    """Discrete risk states for collision avoidance."""

    SAFE = "SAFE"
    WARNING = "WARNING"
    DANGER = "DANGER"


@dataclass(frozen=True)
class CollisionThresholds:
    """Threshold configuration for heuristic risk scoring.

    Attributes:
        safe_max: Upper bound for SAFE state.
        warning_max: Upper bound for WARNING state.
            Any score >= warning_max is considered DANGER.
    """

    safe_max: float = 0.25
    warning_max: float = 0.45

    def validate(self) -> None:
        """Validate threshold ordering and value ranges."""
        if not (0.0 <= self.safe_max <= 1.0):
            raise ValueError("safe_max must be within [0.0, 1.0]")
        if not (0.0 <= self.warning_max <= 1.0):
            raise ValueError("warning_max must be within [0.0, 1.0]")
        if self.warning_max < self.safe_max:
            raise ValueError("warning_max must be greater than or equal to safe_max")


class CollisionAvoidance:
    """Heuristic collision-avoidance evaluator based on bbox scaling.

    The class maps a normalized proximity score into one of three states:
    SAFE, WARNING, DANGER. Score can be computed using height, area, or a
    simple hybrid approach. Height-based mode is recommended for this project.
    """

    def __init__(
        self,
        thresholds: CollisionThresholds | None = None,
        metric: str = "height",
    ) -> None:
        """Initialize evaluator.

        Args:
            thresholds: Optional threshold config. Defaults to project baseline.
            metric: One of "height", "area", "hybrid".
        """
        self.thresholds = thresholds or CollisionThresholds()
        self.thresholds.validate()

        allowed_metrics = {"height", "area", "hybrid"}
        if metric not in allowed_metrics:
            raise ValueError(f"metric must be one of {sorted(allowed_metrics)}")
        self.metric = metric

    @staticmethod
    def _clamp01(value: float) -> float:
        return max(0.0, min(1.0, value))

    @classmethod
    def _normalize_bbox(cls, bbox: BBox) -> tuple[float, float, float, float]:
        """Validate and normalize bbox input values.

        Args:
            bbox: Sequence of 4 numeric values in YOLO format.

        Returns:
            Tuple as (x_center, y_center, width, height).

        Raises:
            ValueError: If bbox shape is invalid.
        """
        if len(bbox) != 4:
            raise ValueError(
                "bbox must contain exactly 4 values: "
                "[x_center, y_center, width, height]"
            )

        x_center, y_center, width, height = (float(v) for v in bbox)
        return (
            cls._clamp01(x_center),
            cls._clamp01(y_center),
            cls._clamp01(width),
            cls._clamp01(height),
        )

    def proximity_score(self, bbox: BBox) -> float:
        """Compute a normalized proximity score from a YOLO bbox.

        Args:
            bbox: YOLO-format bbox [x_center, y_center, width, height].

        Returns:
            A score within [0.0, 1.0], where larger means closer.
        """
        _, _, width, height = self._normalize_bbox(bbox)

        if self.metric == "height":
            return height
        if self.metric == "area":
            return self._clamp01(width * height)

        # hybrid: weighted to height for vertical looming behavior in POV camera
        area = self._clamp01(width * height)
        return self._clamp01(0.7 * height + 0.3 * area)

    def evaluate(self, bbox: BBox) -> AlertState:
        """Evaluate one bbox and return a discrete collision state."""
        score = self.proximity_score(bbox)

        if score < self.thresholds.safe_max:
            return AlertState.SAFE
        if score < self.thresholds.warning_max:
            return AlertState.WARNING
        return AlertState.DANGER

    def evaluate_many(self, bboxes: Iterable[BBox]) -> AlertState:
        """Evaluate multiple boxes and return the highest-risk state.

        Useful when several pedestrians are visible in one frame.
        """
        highest = AlertState.SAFE
        for bbox in bboxes:
            current = self.evaluate(bbox)
            if current == AlertState.DANGER:
                return AlertState.DANGER
            if current == AlertState.WARNING:
                highest = AlertState.WARNING
        return highest


class MockYOLOGenerator(Iterator[list[float]]):
    """Generate mock YOLO bboxes for an object approaching the camera.

    The generated sequence increases bbox size frame-by-frame to mimic
    a pedestrian walking toward a forward-facing edge camera.
    """

    def __init__(
        self,
        total_frames: int = 30,
        x_center: float = 0.5,
        y_center: float = 0.55,
        start_width: float = 0.08,
        end_width: float = 0.42,
        start_height: float = 0.12,
        end_height: float = 0.78,
    ) -> None:
        if total_frames <= 0:
            raise ValueError("total_frames must be > 0")

        self.total_frames = total_frames
        self.x_center = x_center
        self.y_center = y_center
        self.start_width = start_width
        self.end_width = end_width
        self.start_height = start_height
        self.end_height = end_height

        self._index = 0

    def __iter__(self) -> "MockYOLOGenerator":
        return self

    def __next__(self) -> list[float]:
        if self._index >= self.total_frames:
            raise StopIteration

        if self.total_frames == 1:
            t = 1.0
        else:
            t = self._index / float(self.total_frames - 1)

        width = self.start_width + t * (self.end_width - self.start_width)
        height = self.start_height + t * (self.end_height - self.start_height)

        self._index += 1
        return [
            CollisionAvoidance._clamp01(self.x_center),
            CollisionAvoidance._clamp01(self.y_center),
            CollisionAvoidance._clamp01(width),
            CollisionAvoidance._clamp01(height),
        ]


def build_parser() -> argparse.ArgumentParser:
    """Build CLI parser for mock collision simulation."""
    parser = argparse.ArgumentParser(
        description="Run mock collision-avoidance simulation with YOLO-like boxes."
    )
    parser.add_argument(
        "--frames", type=int, default=30, help="Number of frames to simulate"
    )
    parser.add_argument(
        "--safe-max", type=float, default=0.25, help="Upper bound for SAFE"
    )
    parser.add_argument(
        "--warning-max",
        type=float,
        default=0.45,
        help="Upper bound for WARNING. Beyond this is DANGER",
    )
    parser.add_argument(
        "--metric",
        type=str,
        default="height",
        choices=["height", "area", "hybrid"],
        help="Heuristic metric for proximity scoring",
    )
    return parser


def main() -> int:
    """Run a real-time-like mock stream and print per-frame alert states."""
    args = build_parser().parse_args()

    thresholds = CollisionThresholds(
        safe_max=args.safe_max, warning_max=args.warning_max
    )
    evaluator = CollisionAvoidance(thresholds=thresholds, metric=args.metric)
    stream = MockYOLOGenerator(total_frames=args.frames)

    print("[CrowdNav] Collision-Avoidance Mock Stream")
    print(
        "Config: "
        f"metric={args.metric}, safe_max={args.safe_max:.2f}, "
        f"warning_max={args.warning_max:.2f}, "
        f"frames={args.frames}"
    )

    for frame_index, bbox in enumerate(stream, start=1):
        state = evaluator.evaluate(bbox)
        score = evaluator.proximity_score(bbox)
        print(
            f"frame={frame_index:03d} bbox={bbox} score={score:.3f} alert={state.value}"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
