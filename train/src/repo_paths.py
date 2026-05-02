"""Single place for repository-root paths (data/, docs/, etc.)."""

from __future__ import annotations

from pathlib import Path


def repo_root() -> Path:
    """Git repo root: contains ``data/``, ``train/``, ``application/``, ``docs/``."""
    return Path(__file__).resolve().parents[2]


def train_root() -> Path:
    """Directory with ``src/``, ``scripts/``, ``notebooks/``."""
    return Path(__file__).resolve().parents[1]


def data_root() -> Path:
    return repo_root() / "data"
