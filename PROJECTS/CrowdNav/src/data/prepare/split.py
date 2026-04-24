"""Sequence-level train / val / test splitting entry-point.

Provides ``run()`` as the official programmatic API.  Core logic lives in
``src.data.split_by_sequence`` and is invoked here to avoid duplication.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Sequence


def run(
    *,
    src_labels: Path,
    src_images: Path,
    output_dir: Path = Path("data/processed/splits"),
    stem_prefix: str = "",
    seed: int = 42,
    train_ratio: float = 0.7,
    val_ratio: float = 0.2,
    extra_argv: Sequence[str] = (),
) -> None:
    """Run the dataset split programmatically.

    Constructs the CLI arguments and delegates to the existing ``main()``
    in ``split_by_sequence`` so that all copy/validation logic is reused.
    """
    argv: list[str] = [
        "--src-labels", str(src_labels),
        "--src-images", str(src_images),
        "--output-dir", str(output_dir),
        "--seed", str(seed),
        "--train-ratio", str(train_ratio),
        "--val-ratio", str(val_ratio),
    ]
    if stem_prefix:
        argv += ["--stem-prefix", stem_prefix]
    argv.extend(extra_argv)

    from ..split_by_sequence import build_parser, main as _legacy_main

    old_argv = sys.argv
    try:
        sys.argv = ["split"] + argv
        _legacy_main()
    except SystemExit:
        pass
    finally:
        sys.argv = old_argv


__all__ = ["run"]
