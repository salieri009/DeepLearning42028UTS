"""Auto-labeling helpers for generating YOLO labels from images."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Iterable, Sequence

from .converter import to_yolo, write_yolo_files
from .types import AnnotationRecord, BoundingBox, YoloBox

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


class AutoLabeler:
    """Generate person-only pseudo labels with a YOLOv8 model."""

    def __init__(
        self,
        model_path: str = "yolov8x.pt",
        confidence_threshold: float = 0.6,
        device: str = "auto",
        imgsz: int = 640,
        model: Any | None = None,
    ) -> None:
        if not 0.0 <= confidence_threshold <= 1.0:
            raise ValueError("confidence_threshold must be within [0.0, 1.0]")
        if imgsz <= 0:
            raise ValueError("imgsz must be a positive integer")

        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.device = device
        self.imgsz = imgsz
        if model is not None:
            self._model = model
            return

        try:
            from ultralytics import YOLO
        except ImportError as exc:  # pragma: no cover - dependency issue
            raise RuntimeError(
                "ultralytics is required. Install project requirements first."
            ) from exc

        self._model = YOLO(model_path)

    @staticmethod
    def _sanitize_image_key(image_key: str) -> str:
        return Path(image_key).with_suffix("").as_posix().replace("/", "_")

    @staticmethod
    def discover_image_folders(input_root: Path) -> list[Path]:
        """Return folders that contain image files, in deterministic order."""
        root = input_root.resolve()
        if root.is_file():
            return [root.parent]

        folders: list[Path] = []
        seen: set[Path] = set()

        for image_path in sorted(root.rglob("*")):
            if not image_path.is_file():
                continue
            if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue

            parent = image_path.parent
            if parent not in seen:
                seen.add(parent)
                folders.append(parent)

        return folders

    def _predict_one(self, image_path: Path):
        kwargs: dict[str, object] = {
            "conf": self.confidence_threshold,
            "classes": [0],
            "imgsz": self.imgsz,
            "verbose": False,
        }
        if self.device != "auto":
            kwargs["device"] = self.device

        results = self._model.predict(source=str(image_path), **kwargs)
        if not results:
            raise RuntimeError(f"No prediction result returned for {image_path}")
        return results[0]

    def _extract_records_and_boxes(
        self,
        image_path: Path,
        image_key: str,
    ) -> tuple[list[tuple[AnnotationRecord, int]], list[YoloBox], int, int]:
        result = self._predict_one(image_path)
        image_height, image_width = result.orig_shape[:2]
        records: list[tuple[AnnotationRecord, int]] = []
        boxes: list[YoloBox] = []

        detections = getattr(result, "boxes", None)
        if detections is None:
            return records, boxes, int(image_width), int(image_height)

        for detection in detections:
            confidence = float(detection.conf[0]) if detection.conf is not None else 0.0
            class_id = int(detection.cls[0]) if detection.cls is not None else -1
            if class_id != 0 or confidence < self.confidence_threshold:
                continue

            x_min, y_min, x_max, y_max = (float(value) for value in detection.xyxy[0].tolist())
            record = AnnotationRecord(
                image_key=image_key,
                class_name="person",
                bbox=BoundingBox(x_min=x_min, y_min=y_min, x_max=x_max, y_max=y_max),
            )
            records.append((record, 0))
            boxes.append(to_yolo(record, 0, int(image_width), int(image_height)))

        return records, boxes, int(image_width), int(image_height)

    def label_image(self, image_path: Path, image_key: str | None = None) -> list[YoloBox]:
        """Return YOLO-format boxes for one image."""
        normalized_key = image_key or image_path.stem
        _, boxes, _, _ = self._extract_records_and_boxes(image_path, normalized_key)
        return boxes

    def label_images(
        self,
        image_paths: Sequence[Path],
        image_keys: Sequence[str] | None = None,
    ) -> list[tuple[Path, list[YoloBox]]]:
        """Return YOLO-format boxes for each image path."""
        paths = [Path(path) for path in image_paths]
        keys = list(image_keys) if image_keys is not None else [path.stem for path in paths]
        if len(keys) != len(paths):
            raise ValueError("image_keys must match image_paths length")

        results: list[tuple[Path, list[YoloBox]]] = []
        for image_path, image_key in zip(paths, keys, strict=True):
            results.append((image_path, self.label_image(image_path, image_key=image_key)))
        return results

    def write_image_labels(
        self,
        image_path: Path,
        output_dir: Path,
        image_key: str | None = None,
    ) -> tuple[list[YoloBox], int, int]:
        """Write YOLO labels for one image and return (boxes, written, skipped)."""
        normalized_key = image_key or image_path.stem
        records, boxes, image_width, image_height = self._extract_records_and_boxes(
            image_path=image_path,
            image_key=normalized_key,
        )

        if records:
            written, skipped = write_yolo_files(
                records=records,
                output_dir=output_dir,
                img_width=image_width,
                img_height=image_height,
            )
        else:
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = output_dir / f"{self._sanitize_image_key(normalized_key)}.txt"
            output_path.write_text("", encoding="utf-8")
            written = 0
            skipped = 0

        return boxes, written, skipped

    def write_folder_labels(
        self,
        image_paths: Iterable[Path],
        output_dir: Path,
        image_keys: Sequence[str] | None = None,
    ) -> tuple[int, int, int]:
        """Write labels for many images and return image, box, and skip counts."""
        paths = [Path(path) for path in image_paths]
        keys = list(image_keys) if image_keys is not None else [path.stem for path in paths]
        if len(keys) != len(paths):
            raise ValueError("image_keys must match image_paths length")

        processed_images = 0
        written_boxes = 0
        skipped_boxes = 0

        for image_path, image_key in zip(paths, keys, strict=True):
            _, written, skipped = self.write_image_labels(
                image_path=image_path,
                output_dir=output_dir,
                image_key=image_key,
            )
            processed_images += 1
            written_boxes += written
            skipped_boxes += skipped

        return processed_images, written_boxes, skipped_boxes