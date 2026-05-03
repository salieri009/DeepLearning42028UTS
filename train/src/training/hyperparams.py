"""Default hyperparameter presets for notebook and SageMaker launch helpers."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TrainingHyperParams:
    """Aligned with ``train/scripts/train_yolo.py`` and ``sagemaker_train.py``."""

    model: str
    epochs: int
    batch: int
    imgsz: int
    workers: int
    patience: int

    def as_dict(self) -> dict[str, int | str]:
        return {
            "model": self.model,
            "epochs": self.epochs,
            "batch": self.batch,
            "imgsz": self.imgsz,
            "workers": self.workers,
            "patience": self.patience,
        }


def default_training_presets() -> dict[str, TrainingHyperParams]:
    """Presets: SageMaker Notebook (ml.g4dn.xlarge) vs managed training job."""
    return {
        "g4dn_notebook": TrainingHyperParams(
            model="yolov8m.pt",
            epochs=100,
            batch=16,
            imgsz=640,
            workers=4,
            patience=20,
        ),
        "sagemaker_managed_job": TrainingHyperParams(
            model="yolov8l.pt",
            epochs=50,
            batch=32,
            imgsz=640,
            workers=8,
            patience=20,
        ),
    }
