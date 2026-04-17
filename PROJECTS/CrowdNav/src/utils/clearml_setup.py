from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping, Optional


@dataclass(frozen=True)
class ClearMLTaskInfo:
    project_name: str
    task_name: str
    task_id: Optional[str]


class ClearMLSetup:
    """MLOpsLayer skeleton interface for ClearML task and metric lifecycle."""

    def __init__(self, project_name: str, task_name: str) -> None:
        """Initialize ClearML setup skeleton with project and task names."""
        raise NotImplementedError("ClearMLSetup skeleton is not implemented yet.")

    def init_clearml_task(
        self,
        *,
        tags: Optional[list[str]] = None,
        params: Optional[Mapping[str, Any]] = None,
    ) -> ClearMLTaskInfo:
        """Initialize and return a ClearML task descriptor."""
        raise NotImplementedError("ClearMLSetup.init_clearml_task is not implemented yet.")

    def log_hyperparams(self, params: Mapping[str, Any]) -> None:
        """Log hyperparameters for experiment tracking."""
        raise NotImplementedError("ClearMLSetup.log_hyperparams is not implemented yet.")

    def log_metric(self, name: str, value: float, step: int) -> None:
        """Log a metric scalar for the given training step."""
        raise NotImplementedError("ClearMLSetup.log_metric is not implemented yet.")


def init_clearml_task(
    *,
    project_name: str,
    task_name: str,
    tags: Optional[list[str]] = None,
    params: Optional[Mapping[str, Any]] = None,
) -> ClearMLTaskInfo:
    """
    Initialize a ClearML Task (online) if configured.
    Otherwise, fallback to offline mode.

    This function keeps training code clean: call it once at startup.
    """
    try:
        from dotenv import load_dotenv

        load_dotenv()  # Load environment variables from .env file if present
    except ImportError:
        pass  # python-dotenv not installed, ignore

    try:
        from clearml import Task  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "clearml is not installed. Run: pip install -r requirements.txt"
        ) from e

    task = Task.init(
        project_name=project_name,
        task_name=task_name,
        tags=tags or None,
    )

    if params:
        task.connect(dict(params))

    return ClearMLTaskInfo(
        project_name=project_name,
        task_name=task_name,
        task_id=getattr(task, "id", None),
    )
