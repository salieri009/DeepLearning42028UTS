"""Command wrapper for JRDB JSON to YOLO label conversion."""

from __future__ import annotations

from .preprocessing.cli import main

if __name__ == "__main__":
    raise SystemExit(main())
