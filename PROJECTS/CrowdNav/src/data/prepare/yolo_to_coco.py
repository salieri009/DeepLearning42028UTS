"""Convert YOLO split folders into COCO JSON for Keras training.

Input layout (produced by split_by_sequence.py):
  data/processed/splits/
    train/images, train/labels
    val/images,   val/labels
    test/images,  test/labels
    data.yaml

Output layout:
  data/processed/coco/
    train.json
    val.json
    test.json

Notes:
- YOLO labels may be 5 columns (standard) or 6 columns (extended with track_id).
- COCO boxes are absolute pixel `xywh`. track_id is stored as an extension field
  on the annotation object when present.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

import cv2
import yaml

from ..formats.coco import CocoAnnotation, CocoCategory, CocoDataset, CocoImage, write_coco_json
from ..formats.yolo_label import parse_line


IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".bmp", ".webp")


@dataclass(frozen=True)
class ConvertSummary:
    images: int
    annotations: int
    invalid_label_lines: int
    missing_images: int


def _load_class_names(splits_dir: Path) -> list[str]:
    data_yaml = splits_dir / "data.yaml"
    if data_yaml.exists() and data_yaml.is_file():
        content = yaml.safe_load(data_yaml.read_text(encoding="utf-8"))
        names = content.get("names")
        if isinstance(names, list) and all(isinstance(x, str) for x in names) and names:
            return list(names)
    # Fallback: single-class person
    return ["person"]


def _find_image(images_dir: Path, stem: str) -> Path | None:
    for ext in IMAGE_EXTS:
        p = images_dir / f"{stem}{ext}"
        if p.exists():
            return p
    return None


def _image_size(path: Path) -> tuple[int, int] | None:
    img = cv2.imread(str(path))
    if img is None:
        return None
    h, w = img.shape[:2]
    return int(w), int(h)


def convert_split(
    *,
    images_dir: Path,
    labels_dir: Path,
    categories: list[CocoCategory],
    file_name_prefix: str = "",
    max_images: int | None = None,
    log_every: int = 2000,
) -> tuple[CocoDataset, ConvertSummary]:
    """Convert one split's (images, labels) folder into a COCO dataset object."""
    images: list[CocoImage] = []
    annotations: list[CocoAnnotation] = []

    invalid_label_lines = 0
    missing_images = 0

    image_id = 1
    ann_id = 1

    for idx, label_path in enumerate(sorted(labels_dir.glob("*.txt")), start=1):
        if max_images is not None and len(images) >= max_images:
            break
        if log_every > 0 and idx % log_every == 0:
            print(f"  scanned_labels={idx} converted_images={len(images)} annotations={len(annotations)}")
        stem = label_path.stem
        img_path = _find_image(images_dir, stem)
        if img_path is None:
            missing_images += 1
            continue

        size = _image_size(img_path)
        if size is None:
            missing_images += 1
            continue
        width, height = size

        file_name = f"{file_name_prefix}{img_path.name}"
        images.append(
            CocoImage(
                id=image_id,
                file_name=file_name,
                width=width,
                height=height,
            )
        )

        lines = label_path.read_text(encoding="utf-8").splitlines()
        for raw in lines:
            if not raw.strip():
                continue
            parsed = parse_line(raw)
            if parsed is None:
                invalid_label_lines += 1
                continue

            # YOLO normalized xywh -> COCO absolute xywh (top-left x,y)
            x_c = float(parsed.x_center) * width
            y_c = float(parsed.y_center) * height
            w = float(parsed.width) * width
            h = float(parsed.height) * height
            x = x_c - (w / 2.0)
            y = y_c - (h / 2.0)

            area = max(0.0, w) * max(0.0, h)
            track_id = int(parsed.track_id) if parsed.track_id is not None else None

            annotations.append(
                CocoAnnotation(
                    id=ann_id,
                    image_id=image_id,
                    category_id=int(parsed.class_id),
                    bbox=(float(x), float(y), float(w), float(h)),
                    area=float(area),
                    iscrowd=0,
                    segmentation=None,
                    track_id=track_id,
                )
            )
            ann_id += 1

        image_id += 1

    return (
        CocoDataset(images=images, annotations=annotations, categories=categories),
        ConvertSummary(
            images=len(images),
            annotations=len(annotations),
            invalid_label_lines=invalid_label_lines,
            missing_images=missing_images,
        ),
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert YOLO split folders to COCO JSON.")
    parser.add_argument(
        "--splits-dir",
        type=Path,
        default=Path("data/processed/splits"),
        help="Root directory containing train/val/test folders and data.yaml",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("data/processed/coco"),
        help="Output directory for COCO JSON files",
    )
    parser.add_argument(
        "--write-categories",
        action="store_true",
        help="Write categories.json alongside split JSON files",
    )
    parser.add_argument(
        "--max-images-per-split",
        type=int,
        default=0,
        help="Limit conversion to N images per split (0 means no limit). Useful for smoke tests.",
    )
    parser.add_argument(
        "--log-every",
        type=int,
        default=2000,
        help="Print progress every N label files scanned (0 disables).",
    )
    args = parser.parse_args()

    splits_dir: Path = args.splits_dir
    out_dir: Path = args.out_dir

    class_names = _load_class_names(splits_dir)
    categories = [CocoCategory(id=i, name=name) for i, name in enumerate(class_names)]

    summaries: dict[str, ConvertSummary] = {}
    for split in ("train", "val", "test"):
        images_dir = splits_dir / split / "images"
        labels_dir = splits_dir / split / "labels"
        if not images_dir.is_dir() or not labels_dir.is_dir():
            continue

        print(f"[{split}] converting from {images_dir} + {labels_dir}")
        dataset, summary = convert_split(
            images_dir=images_dir,
            labels_dir=labels_dir,
            categories=categories,
            file_name_prefix=f"{split}/images/",
            max_images=args.max_images_per_split if args.max_images_per_split > 0 else None,
            log_every=int(args.log_every),
        )
        write_coco_json(out_dir / f"{split}.json", dataset)
        summaries[split] = summary

    if args.write_categories:
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "categories.json").write_text(
            json.dumps([c.__dict__ for c in categories], indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    if not summaries:
        raise SystemExit(f"No splits found under: {splits_dir}")

    for split, s in summaries.items():
        print(
            f"[{split}] images={s.images} annotations={s.annotations} "
            f"invalid_label_lines={s.invalid_label_lines} missing_images={s.missing_images}"
        )


if __name__ == "__main__":
    main()

