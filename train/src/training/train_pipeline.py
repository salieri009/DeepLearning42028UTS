"""YOLO fine-tuning pipeline for the prepared CrowdNav dataset."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ultralytics import YOLO


@dataclass(frozen=True)
class TrainArtifacts:
    """Paths and objects produced by a training run."""

    run_dir: Path
    best_weights: Path | None
    last_weights: Path | None
    raw_result: Any


class TrainPipeline:
    """Run YOLO training, validation, and export for the prepared dataset."""

    def __init__(
        self,
        model_cfg: str,
        data_yaml: str,
        epochs: int,
        imgsz: int,
        *,
        batch: int = 16,
        device: str | int | None = None,
        project: str | None = None,
        name: str = "crowdnav_yolo",
        patience: int = 30,
        exist_ok: bool = True,
        workers: int = 4,
        save_period: int = 10,
        lr0: float = 0.01,
        lrf: float = 0.01,
        extra_kwargs: dict | None = None,
    ) -> None:
        from src.repo_paths import repo_root

        self.model_cfg = model_cfg
        self.data_yaml = data_yaml
        self.epochs = epochs
        self.imgsz = imgsz
        self.batch = batch
        self.device = device
        self.project = project if project is not None else str(repo_root() / "runs" / "train")
        self.name = name
        self.patience = patience
        self.exist_ok = exist_ok
        self.workers = workers
        self.save_period = save_period
        self.lr0 = lr0
        self.lrf = lrf
        self.extra_kwargs: dict = extra_kwargs or {}
        self._model: YOLO | None = None
        self._trained_model: YOLO | None = None
        self._last_artifacts: TrainArtifacts | None = None

    def _resolve_model(self) -> YOLO:
        from ultralytics import YOLO

        model_path = Path(self.model_cfg)
        if model_path.exists():
            return YOLO(str(model_path))
        return YOLO(self.model_cfg)

    def _require_trained_model(self) -> YOLO:
        if self._trained_model is None:
            raise RuntimeError("Training has not been run yet.")
        return self._trained_model

    def train(self) -> TrainArtifacts:
        """Train the YOLO model and keep track of the produced weights."""
        from ultralytics import YOLO

        data_yaml_path = Path(self.data_yaml)
        if not data_yaml_path.exists() or not data_yaml_path.is_file():
            raise FileNotFoundError(f"data.yaml not found: {data_yaml_path}")

        self._model = self._resolve_model()
        results = self._model.train(
            data=str(data_yaml_path),
            epochs=self.epochs,
            imgsz=self.imgsz,
            batch=self.batch,
            device=self.device,
            project=self.project,
            name=self.name,
            patience=self.patience,
            exist_ok=self.exist_ok,
            workers=self.workers,
            save_period=self.save_period,
            lr0=self.lr0,
            lrf=self.lrf,
            **self.extra_kwargs,
        )

        save_dir = Path(getattr(results, "save_dir", Path(self.project) / self.name))
        weights_dir = save_dir / "weights"
        best_weights = weights_dir / "best.pt"
        last_weights = weights_dir / "last.pt"

        if best_weights.exists():
            self._trained_model = YOLO(str(best_weights))
        elif last_weights.exists():
            self._trained_model = YOLO(str(last_weights))
        else:
            self._trained_model = self._model

        self._last_artifacts = TrainArtifacts(
            run_dir=save_dir,
            best_weights=best_weights if best_weights.exists() else None,
            last_weights=last_weights if last_weights.exists() else None,
            raw_result=results,
        )
        return self._last_artifacts

    def validate(self) -> dict[str, float]:
        """Validate the trained model on the validation split and return metrics."""
        model = self._require_trained_model()
        results = model.val(data=str(self.data_yaml), imgsz=self.imgsz)

        metrics: dict[str, float] = {}
        results_dict = getattr(results, "results_dict", None)
        if isinstance(results_dict, dict):
            for key, value in results_dict.items():
                if isinstance(value, (int, float)):
                    metrics[str(key)] = float(value)
            return metrics

        for key in ("map50", "map", "precision", "recall", "fitness"):
            value = getattr(results, key, None)
            if isinstance(value, (int, float)):
                metrics[key] = float(value)
        return metrics

    def export(self, fmt: str) -> str:
        """Export the trained model to a deployment-friendly format."""
        model = self._require_trained_model()
        exported = model.export(format=fmt, imgsz=self.imgsz)
        return str(exported)


def default_model_path() -> str:
    """Pick a local default model if one is present in the repo root."""
    from src.repo_paths import repo_root

    local_weight = repo_root() / "yolov8m.pt"
    if local_weight.exists():
        return str(local_weight)
    return "yolov8m.pt"
