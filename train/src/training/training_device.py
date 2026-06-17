"""Pick YOLO training device for SageMaker xlarge, local CUDA, or CPU.

Priority when *cli_device* is None:
1. ``CROWDNAV_DEVICE`` env (e.g. ``0``, ``cpu``, ``cuda:0``)
2. First CUDA device if ``torch.cuda.is_available()``
3. ``"cpu"``
"""

from __future__ import annotations

import os
from typing import Any


def resolve_training_device(cli_device: str | None) -> Any:
    """Return device for Ultralytics ``model.train(device=...)``.

    - If the user passed ``--device``, that value is used as-is.
    - Otherwise, honor ``CROWDNAV_DEVICE``, then CUDA, then CPU.
    """
    if cli_device is not None and str(cli_device).strip() != "":
        return cli_device
    override = os.environ.get("CROWDNAV_DEVICE")
    if override is not None and str(override).strip() != "":
        return _coerce(override)
    try:
        import torch

        if torch.cuda.is_available():
            return 0
    except ImportError:
        pass
    return "cpu"


def _coerce(text: str) -> Any:
    t = text.strip()
    if t == "cpu":
        return "cpu"
    if t.isdigit():
        return int(t)
    return t


def describe_runtime() -> str:
    """Short label for logging (SageMaker vs local)."""
    if (
        os.environ.get("SM_NUM_GPUS") is not None
        or os.environ.get("SAGEMAKER_TRAINING") == "1"
    ):
        return "sagemaker_training"
    if os.environ.get("AWS_PATH") is not None or os.environ.get(
        "SAGEMAKER_TRAINING_ARN"
    ):
        return "sagemaker_notebook_or_studio"
    return "local_or_other"
