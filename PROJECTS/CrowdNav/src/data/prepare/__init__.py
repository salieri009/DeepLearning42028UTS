"""CrowdNav data preparation pipeline — single entry-point module.

This package is the **official** location for all data-preparation steps:

* ``jrdb_to_yolo``  — convert JRDB ground-truth JSON annotations to YOLO labels
* ``pseudo_label``  — run YOLOv8 inference on raw frames to generate pseudo-labels
* ``split``         — split labelled data into train / val / test at sequence level
* ``reporting``     — validate label/image pairs and produce a JSON summary report

Each sub-module exposes a ``run(...)`` function for programmatic use, and the
legacy entry-points (``src/data/pseudo_label_yolov8.py``, etc.) delegate here
so that existing CLI commands keep working.
"""

from . import jrdb_to_yolo, pseudo_label, reporting, split

__all__ = [
    "jrdb_to_yolo",
    "pseudo_label",
    "split",
    "reporting",
]
