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
    """Presets for local notebook and SageMaker (ml.g4dn.xlarge) training jobs.

    Naming convention:
      local_*          — local GPU (single GPU, low VRAM)
      g4dn_*           — SageMaker Notebook ml.g4dn.xlarge (16 GB VRAM, T4)
      sagemaker_*      — SageMaker managed training job (higher-end instance)

    Model size progression: n (nano) → s (small) → m (medium) → l (large)
    """
    return {
        # ── Local presets ────────────────────────────────────────────────────
        "local": TrainingHyperParams(
            model="yolov8m.pt",
            epochs=150,
            batch=8,
            imgsz=640,
            workers=2,
            patience=30,
            save_period=10,
        ),
        "local_s": TrainingHyperParams(
            # yolov8s: baseline 대비 2× 빠른 학습, 낮은 VRAM
            # augmentation tuning 첫 실험에 권장
            model="yolov8s.pt",
            epochs=200,
            batch=16,
            imgsz=640,
            workers=2,
            patience=40,
            save_period=10,
        ),
        # ── SageMaker Notebook (ml.g4dn.xlarge, T4 16 GB) ───────────────────
        "g4dn_notebook": TrainingHyperParams(
            model="yolov8m.pt",
            epochs=150,
            batch=16,
            imgsz=640,
            workers=4,
            patience=30,
            save_period=10,
        ),
        "g4dn_m": TrainingHyperParams(
            # yolov8m + imgsz 832: JRDB 원본 752 px에 가까운 해상도
            # T4 16 GB 기준 batch=12 권장 (OOM 방지)
            model="yolov8m.pt",
            epochs=200,
            batch=12,
            imgsz=832,
            workers=4,
            patience=40,
            save_period=10,
        ),
        # ── SageMaker managed job ────────────────────────────────────────────
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
