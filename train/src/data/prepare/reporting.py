"""Validation and reporting utilities for the data preparation pipeline.

Exposes helpers that ``scripts/automate_preprocessing.py`` (and future
orchestrators) can call to validate label/image consistency without relying
on subprocess or stdout parsing.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


@dataclass
class ImageInventory:
    """Summary of image files found under a directory."""

    files_count: int
    unique_stems: set[str]
    duplicate_stems: dict[str, list[str]]


@dataclass
class LabelInventory:
    """Summary of YOLO label files found under a directory."""

    files_count: int
    unique_stems: set[str]
    duplicate_stems: dict[str, int]


@dataclass
class ValidationResult:
    """Cross-validated image vs label inventory."""

    image_files_count: int
    image_unique_stems_count: int
    label_files_count: int
    label_unique_stems_count: int
    classes_file_count: int
    classes_file_present: bool
    missing_labels: int
    orphan_labels: int
    duplicate_image_stems: int
    duplicate_label_stems: int


def collect_image_inventory(images_dir: Path, *, recursive: bool = True) -> ImageInventory:
    """Scan *images_dir* for image files and detect stem duplicates."""
    if not images_dir.exists() or not images_dir.is_dir():
        raise FileNotFoundError(f"Images directory not found: {images_dir}")

    iterator = images_dir.rglob("*") if recursive else images_dir.glob("*")
    files_count = 0
    stem_to_paths: dict[str, list[str]] = {}
    for path in iterator:
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            files_count += 1
            stem_to_paths.setdefault(path.stem, []).append(
                path.relative_to(images_dir).as_posix()
            )

    duplicate_stems = {
        stem: sorted(paths)
        for stem, paths in stem_to_paths.items()
        if len(paths) > 1
    }
    return ImageInventory(
        files_count=files_count,
        unique_stems=set(stem_to_paths),
        duplicate_stems=duplicate_stems,
    )


def collect_label_inventory(label_dir: Path) -> LabelInventory:
    """Scan *label_dir* for YOLO label ``.txt`` files."""
    if not label_dir.exists():
        return LabelInventory(files_count=0, unique_stems=set(), duplicate_stems={})

    files_count = 0
    stem_counts: dict[str, int] = {}
    unique_stems: set[str] = set()
    for path in label_dir.rglob("*.txt"):
        if path.is_file() and path.name.lower() != "classes.txt":
            files_count += 1
            unique_stems.add(path.stem)
            stem_counts[path.stem] = stem_counts.get(path.stem, 0) + 1

    duplicate_stems = {s: c for s, c in stem_counts.items() if c > 1}
    return LabelInventory(
        files_count=files_count,
        unique_stems=unique_stems,
        duplicate_stems=duplicate_stems,
    )


def validate(
    label_dir: Path,
    image_inventory: ImageInventory,
) -> tuple[LabelInventory, ValidationResult]:
    """Cross-validate label and image inventories to find mismatches."""
    label_inventory = collect_label_inventory(label_dir)
    classes_file_count = (
        sum(1 for p in label_dir.rglob("classes.txt") if p.is_file())
        if label_dir.exists()
        else 0
    )
    result = ValidationResult(
        image_files_count=image_inventory.files_count,
        image_unique_stems_count=len(image_inventory.unique_stems),
        label_files_count=label_inventory.files_count,
        label_unique_stems_count=len(label_inventory.unique_stems),
        classes_file_count=classes_file_count,
        classes_file_present=classes_file_count > 0,
        missing_labels=len(image_inventory.unique_stems - label_inventory.unique_stems),
        orphan_labels=len(label_inventory.unique_stems - image_inventory.unique_stems),
        duplicate_image_stems=len(image_inventory.duplicate_stems),
        duplicate_label_stems=len(label_inventory.duplicate_stems),
    )
    return label_inventory, result


__all__ = [
    "ImageInventory",
    "LabelInventory",
    "ValidationResult",
    "collect_image_inventory",
    "collect_label_inventory",
    "validate",
]
