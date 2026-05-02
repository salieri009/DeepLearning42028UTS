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


def splits_root() -> Path:
    """YOLO train/val/test tree root (``data/processed/splits``)."""
    return data_root() / "processed" / "splits"


def default_data_yaml() -> Path:
    return splits_root() / "data.yaml"


def load_repo_dotenv() -> bool:
    """Load ``.env`` from repo root if ``python-dotenv`` is available."""
    try:
        from dotenv import load_dotenv
    except ImportError:
        return False
    env_path = repo_root() / ".env"
    if env_path.is_file():
        load_dotenv(env_path)
        return True
    return False


def check_splits_layout(*, root: Path | None = None) -> tuple[bool, list[str]]:
    """Verify ``data/processed/splits`` layout (see ``docs/DATA.md``)."""
    base_root = root if root is not None else repo_root()
    base = base_root / "data" / "processed" / "splits"
    issues: list[str] = []
    if not base.is_dir():
        issues.append(f"Missing directory: {base}")
        return False, issues
    for split in ("train", "val", "test"):
        images = base / split / "images"
        labels = base / split / "labels"
        if not images.is_dir():
            issues.append(f"Missing: {images}")
        if not labels.is_dir():
            issues.append(f"Missing: {labels}")
    yaml_path = base / "data.yaml"
    if not yaml_path.is_file():
        issues.append(f"Missing: {yaml_path}")
    return len(issues) == 0, issues
