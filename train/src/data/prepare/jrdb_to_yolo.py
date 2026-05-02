"""Convert JRDB ground-truth JSON annotations into YOLO .txt label files.

This is a thin re-export of the existing ``preprocessing`` package so that
``src.data.prepare.jrdb_to_yolo.run(...)`` works as the official API while
the underlying logic stays in ``src.data.preprocessing``.
"""

from __future__ import annotations

from pathlib import Path

from ..preprocessing.cli import ConversionSummary, convert


def run(
    input_json: Path,
    output_dir: Path,
    img_width: int,
    img_height: int,
    *,
    summary_json: Path | None = None,
    quiet: bool = False,
) -> ConversionSummary:
    """Run JRDB JSON -> YOLO conversion.

    Parameters
    ----------
    input_json : Path
        Path to the JRDB annotation JSON file.
    output_dir : Path
        Directory where ``.txt`` label files will be written.
    img_width, img_height : int
        Image dimensions used for coordinate normalisation.
    summary_json : Path, optional
        If given, write a machine-readable JSON summary to this path.
    quiet : bool
        Suppress human-readable stdout output.

    Returns
    -------
    ConversionSummary
        Structured result with parsed/written/skipped counts.
    """
    return convert(
        input_json=input_json,
        output_dir=output_dir,
        img_width=img_width,
        img_height=img_height,
        summary_json=summary_json,
        quiet=quiet,
    )


__all__ = ["ConversionSummary", "run"]
