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
    save_period: int = 10

    def as_dict(self) -> dict[str, int | str]:
        return {
            "model": self.model,
            "epochs": self.epochs,
            "batch": self.batch,
            "imgsz": self.imgsz,
            "workers": self.workers,
            "patience": self.patience,
            "save_period": self.save_period,
        }


def default_training_presets() -> dict[str, TrainingHyperParams]:
    """Presets: local notebook, SageMaker Notebook (ml.g4dn.xlarge), managed training job."""
    return {
        "local": TrainingHyperParams(
            model="yolov8m.pt",
            epochs=150,
            batch=8,
            imgsz=640,
            workers=2,
            patience=30,
            save_period=10,
        ),
        "g4dn_notebook": TrainingHyperParams(
            model="yolov8m.pt",
            epochs=150,
            batch=16,
            imgsz=640,
            workers=4,
            patience=30,
            save_period=10,
        ),
        "sagemaker_managed_job": TrainingHyperParams(
            model="yolov8l.pt",
            epochs=150,
            batch=32,
            imgsz=640,
            workers=8,
            patience=30,
            save_period=10,
        ),
    }
