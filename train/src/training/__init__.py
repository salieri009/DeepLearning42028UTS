"""Training package: YOLO pipeline, device helpers, SageMaker CLI argv, presets."""

from __future__ import annotations

from src.training.cycle_logging import (
    CycleMetrics,
    append_cycle_metrics_csv,
    write_cycle_metrics_json,
)
from src.training.hyperparams import TrainingHyperParams, default_training_presets
from src.training.protocols import SupportsYoloTraining
from src.training.sagemaker_cli import build_sagemaker_launch_command
from src.training.subprocess_runner import run_train_yolo_subprocess
from src.training.train_pipeline import TrainArtifacts, TrainPipeline, default_model_path
from src.training.training_device import describe_runtime, resolve_training_device

__all__ = [
    "CycleMetrics",
    "SupportsYoloTraining",
    "TrainArtifacts",
    "TrainPipeline",
    "TrainingHyperParams",
    "append_cycle_metrics_csv",
    "build_sagemaker_launch_command",
    "default_model_path",
    "default_training_presets",
    "describe_runtime",
    "resolve_training_device",
    "run_train_yolo_subprocess",
    "write_cycle_metrics_json",
]
