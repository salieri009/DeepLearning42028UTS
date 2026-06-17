"""Build argv for ``infra/sagemaker/sagemaker_launch.py`` (optional managed jobs)."""

from __future__ import annotations

import sys
from pathlib import Path

from src.training.hyperparams import TrainingHyperParams, default_training_presets

_DATASET_PREFIX = {
    "person": "data",
    "3class": "data_3class",
}


def build_sagemaker_launch_command(
    *,
    repo_root: Path,
    role_arn: str,
    bucket: str,
    data_prefix: str | None = None,
    dataset_variant: str = "person",
    instance_type: str = "ml.g4dn.xlarge",
    hyperparams: TrainingHyperParams | None = None,
    use_spot: bool = False,
    job_name: str | None = None,
) -> list[str]:
    """Assemble ``python infra/sagemaker/sagemaker_launch.py ...`` (run on laptop)."""
    hp = hyperparams or default_training_presets()["sagemaker_managed_job"]
    script = repo_root / "infra" / "sagemaker" / "sagemaker_launch.py"
    if not script.is_file():
        raise FileNotFoundError(script)

    prefix = data_prefix or _DATASET_PREFIX.get(dataset_variant, "data")

    cmd: list[str] = [
        sys.executable,
        str(script),
        "--role",
        role_arn,
        "--bucket",
        bucket,
        "--data-prefix",
        prefix,
        "--dataset-variant",
        dataset_variant,
        "--instance-type",
        instance_type,
        "--epochs",
        str(hp.epochs),
        "--batch",
        str(hp.batch),
        "--imgsz",
        str(hp.imgsz),
        "--model",
        hp.model,
        "--workers",
        str(hp.workers),
        "--patience",
        str(hp.patience),
        "--save-period",
        str(hp.save_period),
    ]
    if use_spot:
        cmd.append("--use-spot")
    if job_name:
        cmd.extend(["--job-name", job_name])
    return cmd
