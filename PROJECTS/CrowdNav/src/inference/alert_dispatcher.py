"""InferenceLayer alert dispatch skeleton for visual and audio outputs."""

from __future__ import annotations

from .collision_avoidance import AlertState


class AlertDispatcher:
    """Dispatch alert states to concrete output channels."""

    def __init__(self) -> None:
        """Initialize dispatcher channels for edge runtime use."""
        raise NotImplementedError("AlertDispatcher skeleton is not implemented yet.")

    def visual_alert(self, state: AlertState) -> None:
        """Emit a visual alert for the current risk state."""
        raise NotImplementedError(
            "AlertDispatcher.visual_alert is not implemented yet."
        )

    def audio_alert(self, state: AlertState) -> None:
        """Emit an audio alert for the current risk state."""
        raise NotImplementedError("AlertDispatcher.audio_alert is not implemented yet.")

    def dispatch(self, state: AlertState) -> None:
        """Route one alert state to all configured output channels."""
        raise NotImplementedError("AlertDispatcher.dispatch is not implemented yet.")
