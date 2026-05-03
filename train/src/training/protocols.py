"""Structural types for training boundaries (tests, type checkers)."""

from __future__ import annotations

from typing import Any, Protocol


class SupportsYoloTraining(Protocol):
    """Minimal surface scripts rely on from ``TrainPipeline``."""

    def train(self) -> Any: ...
