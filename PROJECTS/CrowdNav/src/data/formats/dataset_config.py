"""Shared writers for YOLO dataset configuration files (data.yaml, classes.txt).

These utilities are the single source of truth for dataset config generation
across pseudo-labeling, splitting, and JSON conversion pipelines.
"""

from __future__ import annotations

from pathlib import Path
from typing import Mapping, Sequence

import yaml


def write_data_yaml(
    output_dir: Path,
    class_names: Sequence[str],
    *,
    train_images: str = "train/images",
    val_images: str = "val/images",
    test_images: str = "test/images",
) -> Path:
    """Write a YOLO-compatible ``data.yaml`` to *output_dir*.

    The ``path`` field is set to ``.`` (current directory) so the YAML is
    portable across Windows, Linux, and cloud paths; train/val/test are
    relative to *output_dir* / this file’s location.
    """
    yaml_path = output_dir / "data.yaml"
    content = {
        "path": ".",
        "train": train_images,
        "val": val_images,
        "test": test_images,
        "nc": len(class_names),
        "names": list(class_names),
    }
    yaml_path.parent.mkdir(parents=True, exist_ok=True)
    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(content, f, sort_keys=False)
    return yaml_path


def write_data_yaml_from_class_map(
    output_dir: Path,
    class_map: Mapping[str, int],
    **kwargs: str,
) -> Path:
    """Convenience wrapper that accepts a ``{name: id}`` mapping."""
    sorted_names = [name for name, _ in sorted(class_map.items(), key=lambda p: p[1])]
    return write_data_yaml(output_dir, sorted_names, **kwargs)


def write_classes_txt(
    output_dir: Path,
    class_names: Sequence[str],
) -> Path:
    """Write a ``classes.txt`` file (one class name per line, ordered by ID)."""
    classes_path = output_dir / "classes.txt"
    classes_path.parent.mkdir(parents=True, exist_ok=True)
    text = "\n".join(class_names) + ("\n" if class_names else "")
    classes_path.write_text(text, encoding="utf-8")
    return classes_path


def write_classes_txt_from_label_map(
    output_dir: Path,
    label_to_id: Mapping[str, int],
) -> Path:
    """Convenience wrapper that accepts a ``{label: id}`` mapping."""
    sorted_names = [
        label for label, _ in sorted(label_to_id.items(), key=lambda p: p[1])
    ]
    return write_classes_txt(output_dir, sorted_names)
