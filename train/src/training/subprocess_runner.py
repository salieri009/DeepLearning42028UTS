"""Run ``train/scripts/train_yolo.py`` as a subprocess (notebooks, automation)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from typing import Sequence

from src.repo_paths import repo_root
from src.training.hyperparams import TrainingHyperParams


def run_train_yolo_subprocess(
    *,
    hyperparams: TrainingHyperParams,
    data_yaml: Path | None = None,
    run_name: str = "crowdnav_training",
    extra_args: Sequence[str] | None = None,
) -> int:
    """Run training with ``cwd`` = ``train/``. Returns process exit code."""
    root = repo_root()
    train_dir = root / "train"
    script = train_dir / "scripts" / "train_yolo.py"
    if not script.is_file():
        raise FileNotFoundError(script)
    yaml_path = data_yaml or (root / "data" / "processed" / "splits" / "data.yaml")
    cmd: list[str] = [
        sys.executable,
        str(script),
        "--model-cfg",
        hyperparams.model,
        "--epochs",
        str(hyperparams.epochs),
        "--batch",
        str(hyperparams.batch),
        "--imgsz",
        str(hyperparams.imgsz),
        "--workers",
        str(hyperparams.workers),
        "--patience",
        str(hyperparams.patience),
        "--name",
        run_name,
        "--data-yaml",
        str(yaml_path),
    ]
    if extra_args:
        cmd.extend(extra_args)
    proc = subprocess.run(cmd, cwd=str(train_dir), check=False)
    return int(proc.returncode)
