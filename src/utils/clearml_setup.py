from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping, Optional


@dataclass(frozen=True)
class ClearMLTaskInfo:
    project_name: str
    task_name: str
    task_id: Optional[str]


def init_clearml_task(
    *,
    project_name: str,
    task_name: str,
    tags: Optional[list[str]] = None,
    params: Optional[Mapping[str, Any]] = None,
) -> ClearMLTaskInfo:
    """
    Initialize a ClearML Task (online) if configured, otherwise fallback to offline mode.

    This function keeps training code clean: call it once at startup.
    """
    try:
        from clearml import Task  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "clearml is not installed. Run: pip install -r requirements.txt"
        ) from e

    task = Task.init(project_name=project_name, task_name=task_name, tags=tags or None)

    if params:
        task.connect(dict(params))

    return ClearMLTaskInfo(
        project_name=project_name,
        task_name=task_name,
        task_id=getattr(task, "id", None),
    )

