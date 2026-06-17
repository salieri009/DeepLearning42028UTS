"""COCO JSON schema utilities for Keras/SageMaker training.

This module provides a minimal COCO dataset representation with:
- dataclasses for strongly-typed construction
- read/write helpers for COCO JSON files
- lightweight validation to catch common issues early

Notes:
- Bounding boxes are stored as absolute pixel coordinates in COCO's `xywh` format.
- `track_id` is an optional, non-standard extension stored per annotation.
"""

from __future__ import annotations

import json
from dataclasses import asdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class CocoInfo:
    description: str | None = None
    version: str | None = None
    year: int | None = None
    contributor: str | None = None
    date_created: str | None = None


@dataclass(frozen=True)
class CocoLicense:
    id: int
    name: str | None = None
    url: str | None = None


@dataclass(frozen=True)
class CocoImage:
    id: int
    file_name: str
    width: int
    height: int
    license: int | None = None


@dataclass(frozen=True)
class CocoCategory:
    id: int
    name: str
    supercategory: str | None = None


@dataclass(frozen=True)
class CocoAnnotation:
    id: int
    image_id: int
    category_id: int
    bbox: tuple[float, float, float, float]  # [x, y, w, h] absolute pixels
    area: float
    iscrowd: int = 0
    segmentation: list[Any] | None = None
    track_id: int | None = None  # extension


@dataclass(frozen=True)
class CocoDataset:
    images: list[CocoImage]
    annotations: list[CocoAnnotation]
    categories: list[CocoCategory]
    info: CocoInfo | None = None
    licenses: list[CocoLicense] | None = None


def _strip_none(d: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in d.items() if v is not None}


def to_coco_dict(dataset: CocoDataset) -> dict[str, Any]:
    """Convert a ``CocoDataset`` into a JSON-serializable dict."""
    payload: dict[str, Any] = {
        "images": [_strip_none(asdict(img)) for img in dataset.images],
        "annotations": [_strip_none(asdict(ann)) for ann in dataset.annotations],
        "categories": [_strip_none(asdict(cat)) for cat in dataset.categories],
    }
    if dataset.info is not None:
        payload["info"] = _strip_none(asdict(dataset.info))
    if dataset.licenses is not None:
        payload["licenses"] = [_strip_none(asdict(lic)) for lic in dataset.licenses]
    return payload


def write_coco_json(path: str | Path, dataset: CocoDataset) -> Path:
    """Write COCO JSON to disk and return the resolved path."""
    out_path = Path(path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = to_coco_dict(dataset)
    out_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return out_path.resolve()


def load_coco_json(path: str | Path) -> CocoDataset:
    """Load COCO JSON from disk into dataclasses."""
    data = json.loads(Path(path).read_text(encoding="utf-8"))

    info = CocoInfo(**data["info"]) if isinstance(data.get("info"), dict) else None
    licenses = (
        [CocoLicense(**lic) for lic in data["licenses"]]
        if isinstance(data.get("licenses"), list)
        else None
    )
    images = [CocoImage(**img) for img in data.get("images", [])]
    categories = [CocoCategory(**cat) for cat in data.get("categories", [])]

    annotations: list[CocoAnnotation] = []
    for ann in data.get("annotations", []):
        if not isinstance(ann, dict):
            continue
        track_id = ann.get("track_id", None)
        bbox_raw = ann["bbox"]
        bbox = (
            float(bbox_raw[0]),
            float(bbox_raw[1]),
            float(bbox_raw[2]),
            float(bbox_raw[3]),
        )
        annotations.append(
            CocoAnnotation(
                id=int(ann["id"]),
                image_id=int(ann["image_id"]),
                category_id=int(ann["category_id"]),
                bbox=bbox,
                area=float(ann.get("area", 0.0)),
                iscrowd=int(ann.get("iscrowd", 0)),
                segmentation=ann.get("segmentation"),
                track_id=int(track_id) if track_id is not None else None,
            )
        )

    return CocoDataset(
        images=images,
        annotations=annotations,
        categories=categories,
        info=info,
        licenses=licenses,
    )


def validate_coco_dataset(dataset: CocoDataset) -> list[str]:
    """Return a list of validation errors (empty when valid)."""
    errors: list[str] = []

    image_ids = [img.id for img in dataset.images]
    if len(set(image_ids)) != len(image_ids):
        errors.append("Duplicate image ids detected.")

    cat_ids = [cat.id for cat in dataset.categories]
    if len(set(cat_ids)) != len(cat_ids):
        errors.append("Duplicate category ids detected.")

    image_id_set = set(image_ids)
    cat_id_set = set(cat_ids)

    ann_ids = [ann.id for ann in dataset.annotations]
    if len(set(ann_ids)) != len(ann_ids):
        errors.append("Duplicate annotation ids detected.")

    for ann in dataset.annotations:
        if ann.image_id not in image_id_set:
            errors.append(
                f"Annotation {ann.id} references missing image_id={ann.image_id}."
            )
        if ann.category_id not in cat_id_set:
            errors.append(
                f"Annotation {ann.id} references missing category_id={ann.category_id}."
            )
        if len(ann.bbox) != 4:
            errors.append(f"Annotation {ann.id} bbox must have 4 values (xywh).")
            continue
        x, y, w, h = ann.bbox
        if w <= 0 or h <= 0:
            errors.append(f"Annotation {ann.id} bbox w/h must be > 0, got {ann.bbox}.")
        if x < 0 or y < 0:
            errors.append(f"Annotation {ann.id} bbox x/y must be >= 0, got {ann.bbox}.")
        if ann.area < 0:
            errors.append(f"Annotation {ann.id} area must be >= 0, got {ann.area}.")

    return errors
