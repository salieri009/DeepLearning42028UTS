"""Convert JRDB train labels (labels_2d/*.json) to YOLO format.

Each JRDB JSON file is per-camera: ``{seq_name}_image{N}.json``
This script separates image_0 and image_2 outputs (since they are different
camera views with different bounding boxes).

JRDB JSON format:
  {
    "labels": {
      "000000.jpg": [
        {
          "box": [x_pixel, y_pixel, w_pixel, h_pixel],
          "label_id": "pedestrian:<track_id>",
          "attributes": {"no_eval": bool, "occlusion": str, ...}
        }
      ]
    }
  }

YOLO output (normalized):
  class_id x_center y_center width height [track_id]

Usage:
  python scripts/jrdb_train_to_yolo.py \\
    --src-dir "C:/Users/korda/Downloads/jrdb_train_labels/labels/labels_2d" \\
    --out-dir data/processed/labels_gt \\
    --cameras image0 image2 \\
    --img-w 752 --img-h 480 \\
    --exclude-no-eval --include-track-id
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def parse_track_id(label_id: str) -> int | None:
    """Extract track_id from 'pedestrian:N' format."""
    if not label_id or ":" not in label_id:
        return None
    try:
        return int(label_id.split(":", 1)[1])
    except ValueError:
        return None


def convert_one_json(
    json_path: Path,
    out_seq_dir: Path,
    img_w: int,
    img_h: int,
    *,
    exclude_no_eval: bool,
    include_track_id: bool,
) -> tuple[int, int, int, int]:
    """Convert one JRDB JSON to YOLO .txt files in out_seq_dir.

    Returns (frames_written, boxes_written, skipped_no_eval, skipped_invalid).
    """
    out_seq_dir.mkdir(parents=True, exist_ok=True)
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    frames_written = 0
    boxes_written = 0
    skipped_no_eval = 0
    skipped_invalid = 0

    for frame_name, boxes in data.get("labels", {}).items():
        stem = Path(frame_name).stem
        txt_path = out_seq_dir / f"{stem}.txt"

        lines: list[str] = []
        for box_obj in boxes:
            attrs = box_obj.get("attributes", {})
            if exclude_no_eval and attrs.get("no_eval"):
                skipped_no_eval += 1
                continue

            bbox = box_obj.get("box")
            if not bbox or len(bbox) != 4:
                skipped_invalid += 1
                continue

            x, y, w, h = bbox
            if w <= 0 or h <= 0:
                skipped_invalid += 1
                continue

            cx = (x + w / 2) / img_w
            cy = (y + h / 2) / img_h
            nw = w / img_w
            nh = h / img_h

            # Clip to [0, 1]
            cx = max(0.0, min(1.0, cx))
            cy = max(0.0, min(1.0, cy))
            nw = max(0.0, min(1.0, nw))
            nh = max(0.0, min(1.0, nh))
            if nw <= 0 or nh <= 0:
                skipped_invalid += 1
                continue

            line = f"0 {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}"
            if include_track_id:
                tid = parse_track_id(box_obj.get("label_id", ""))
                if tid is not None:
                    line += f" {tid}"
            lines.append(line)

        if lines:
            txt_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
            frames_written += 1
            boxes_written += len(lines)

    return frames_written, boxes_written, skipped_no_eval, skipped_invalid


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src-dir", type=Path, required=True, help="JRDB labels_2d dir")
    parser.add_argument("--out-dir", type=Path, required=True, help="Output YOLO labels root")
    parser.add_argument(
        "--cameras",
        type=str,
        nargs="+",
        default=["image0", "image2"],
        help="Cameras to convert (default: image0 image2)",
    )
    parser.add_argument("--img-w", type=int, default=752, help="Image width in pixels")
    parser.add_argument("--img-h", type=int, default=480, help="Image height in pixels")
    parser.add_argument(
        "--exclude-no-eval",
        action="store_true",
        help="Skip boxes with attributes.no_eval=true",
    )
    parser.add_argument(
        "--include-track-id",
        action="store_true",
        help="Add 6th column track_id (extends YOLO format)",
    )
    args = parser.parse_args()

    if not args.src_dir.is_dir():
        print(f"ERROR: src-dir not found: {args.src_dir}")
        return 1

    print(f"src-dir: {args.src_dir}")
    print(f"out-dir: {args.out_dir}")
    print(f"cameras: {args.cameras}")
    print(f"image size: {args.img_w} x {args.img_h}")
    print(f"exclude_no_eval: {args.exclude_no_eval}")
    print(f"include_track_id: {args.include_track_id}")

    total_frames = 0
    total_boxes = 0
    total_no_eval = 0
    total_invalid = 0

    for cam in args.cameras:
        # Map cam name to output dir suffix: "image0" -> "image_0"
        if cam.startswith("image") and cam[5:].isdigit():
            cam_dir_name = f"image_{cam[5:]}"
        else:
            cam_dir_name = cam

        cam_out_root = args.out_dir / cam_dir_name
        jsons = sorted(args.src_dir.glob(f"*_{cam}.json"))
        if not jsons:
            print(f"\nWARNING: no JSON files match pattern *_{cam}.json in {args.src_dir}")
            continue

        print(f"\n=== Camera {cam} ({len(jsons)} sequences) ===")
        cam_frames = 0
        cam_boxes = 0
        for jp in jsons:
            seq_name = jp.stem[: -len(f"_{cam}")]
            seq_out = cam_out_root / seq_name
            f, b, ne, inv = convert_one_json(
                jp,
                seq_out,
                args.img_w,
                args.img_h,
                exclude_no_eval=args.exclude_no_eval,
                include_track_id=args.include_track_id,
            )
            cam_frames += f
            cam_boxes += b
            total_no_eval += ne
            total_invalid += inv
            print(f"  {seq_name:55} frames={f:5} boxes={b:6}")

        print(f"  --- {cam}: frames={cam_frames}, boxes={cam_boxes}")
        total_frames += cam_frames
        total_boxes += cam_boxes

    print("\n=== Summary ===")
    print(f"Total label files written: {total_frames}")
    print(f"Total boxes: {total_boxes}")
    print(f"Skipped no_eval boxes: {total_no_eval}")
    print(f"Skipped invalid/degenerate boxes: {total_invalid}")
    print(f"Output root: {args.out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
