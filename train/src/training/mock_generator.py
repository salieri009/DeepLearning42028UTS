"""MLOpsLayer compatibility wrapper for mock YOLO stream generation utilities."""

from __future__ import annotations

from typing import Any, cast


class MockYOLOGenerator:
    """Lazy compatibility wrapper for the inference-layer generator.

    This avoids a module-level MLOps -> Inference import while preserving
    the public constructor API exposed from this module.
    """

    def __new__(cls, *args: object, **kwargs: object) -> Any:
        from ..inference.collision_avoidance import (
            MockYOLOGenerator as _InferenceMockYOLOGenerator,
        )

        return cast(
            Any,
            _InferenceMockYOLOGenerator(*args, **kwargs),  # type: ignore[arg-type]
        )
