"""YOLOv8 pseudo-labeling pipeline for JRDB video frames.

Runs a pre-trained YOLOv8 model on raw frames and generates YOLO ``.txt``
label files.  Low-confidence detections are flagged for manual review.
"""

import argparse
import csv
import json
import time
from pathlib import Path

import torch
from clearml import Task
from ultralytics import YOLO

from .formats.dataset_config import write_data_yaml_from_class_map
from .formats.yolo_label import format_line

CLASS_MAP = {"person": 0}


def build_parser() -> argparse.ArgumentParser:
    """Build CLI argument parser for the pseudo-labeling pipeline."""
    parser = argparse.ArgumentParser(description="Pseudo-label JRDB subset using YOLOv8.")
    parser.add_argument("--model", type=str, default="yolov8m.pt", help="YOLO model path or name")
    parser.add_argument("--src-dir", type=Path, default=Path("data/raw/images"), help="Source images directory")
    parser.add_argument("--out-dir", type=Path, default=Path("data/processed/labels"), help="Output labels directory")
    parser.add_argument("--debug", action="store_true", help="Enable visual sanity check previews")
    parser.add_argument("--debug-dir", type=Path, default=Path("data/processed/debug_previews"), help="Debug previews directory")
    parser.add_argument("--conf-thresh", type=float, default=0.4, help="Confidence threshold for detection")
    parser.add_argument("--manual-thresh", type=float, default=0.6, help="Confidence threshold below which manual review is flagged")
    parser.add_argument("--imgsz", type=int, default=640, help="Inference image size (longer side); larger -> better recall but slower")
    parser.add_argument("--iou", type=float, default=0.7, help="NMS IoU threshold; lower -> fewer overlapping boxes (good for crowds)")
    parser.add_argument("--augment", action="store_true", help="Enable Test-Time Augmentation (TTA) for higher recall at extra cost")
    parser.add_argument(
        "--device",
        type=str,
        default="cuda",
        choices=["cuda", "cpu", "auto"],
        help="Inference device. Default is 'cuda' to use GPU.",
    )
    parser.add_argument(
        "--no-clearml",
        action="store_true",
        help="Disable ClearML task logging",
    )
    parser.add_argument(
        "--checkpoint-path",
        type=Path,
        default=None,
        help="JSON checkpoint file path (default: <out-dir>/pseudo_label_checkpoint.json)",
    )
    parser.add_argument(
        "--checkpoint-interval",
        type=int,
        default=500,
        help="Write checkpoint every N processed images",
    )
    parser.add_argument(
        "--max-images",
        type=int,
        default=0,
        help="Optional cap for processed images (useful for ETA benchmarking)",
    )
    parser.add_argument(
        "--overwrite-existing",
        action="store_true",
        help="Reprocess images even when output txt already exists",
    )
    return parser

def write_yaml(output_dir: Path, class_map: dict) -> Path:
    """Write ``data.yaml`` via shared utility (kept as thin wrapper for compat)."""
    return write_data_yaml_from_class_map(output_dir, class_map)


def write_checkpoint(
    checkpoint_path: Path,
    *,
    total_candidates: int,
    images_processed: int,
    labels_written: int,
    boxes_written: int,
    manual_review_count: int,
    elapsed_seconds: float,
    last_image: str,
) -> None:
    """Persist progress to a JSON checkpoint file for resumable runs."""
    remaining_images = max(0, total_candidates - images_processed)
    images_per_second = images_processed / elapsed_seconds if elapsed_seconds > 0 else 0.0
    eta_seconds = (remaining_images / images_per_second) if images_per_second > 0 else None

    checkpoint_payload = {
        "total_candidates": total_candidates,
        "images_processed": images_processed,
        "labels_written": labels_written,
        "boxes_written": boxes_written,
        "manual_review_count": manual_review_count,
        "elapsed_seconds": elapsed_seconds,
        "images_per_second": images_per_second,
        "eta_seconds": eta_seconds,
        "last_image": last_image,
        "updated_unix": time.time(),
    }
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    checkpoint_path.write_text(json.dumps(checkpoint_payload, indent=2), encoding="utf-8")

def main() -> None:
    """Run the full pseudo-labeling pipeline from CLI arguments."""
    args = build_parser().parse_args()
    
    # Initialize ClearML if available/configured.
    if args.no_clearml:
        print("ClearML disabled (--no-clearml).")
    else:
        try:
            task = Task.init(project_name="CrowdNav", task_name="pseudo_labeling_v1")
            task.connect(vars(args))
        except Exception as exc:
            print(f"ClearML init skipped: {exc}")
    
    # Setup Device & Batch Size
    device = args.device
    if device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"
    
    base_batch = 16 if "cuda" in str(device) or (isinstance(device, int)) else 4
    # Halve batch when TTA is on (augment doubles+ memory) or when imgsz > 640.
    if args.augment:
        base_batch = max(1, base_batch // 4)
    elif args.imgsz > 640:
        base_batch = max(1, base_batch // 2)
    batch_size = base_batch
    print(f"Using device: {device} | Batch Size: {batch_size} | imgsz: {args.imgsz} | iou: {args.iou} | augment: {args.augment}")
    
    model = YOLO(args.model)
    
    src_dir = args.src_dir
    out_dir = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = args.checkpoint_path or (out_dir / "pseudo_label_checkpoint.json")
    checkpoint_interval = max(1, args.checkpoint_interval)
    
    if args.debug:
        args.debug_dir.mkdir(parents=True, exist_ok=True)
        
    manual_review_csv = out_dir / "manual_review_required.csv"
    manual_review_list = []
    
    # COCO "person" class is 0. If model is COCO-pretrained, we filter by 0.
    target_classes = [0] 
    
    valid_exts = {".jpg", ".jpeg", ".png", ".bmp"}
    
    sequences = [d for d in src_dir.iterdir() if d.is_dir() and d.name in {"image_0", "image_2"}]

    all_candidates = []
    skipped_existing = 0
    for seq_group in sequences:
        for sequence in seq_group.iterdir():
            if not sequence.is_dir():
                continue
            seq_out_dir = out_dir / sequence.name
            image_paths = sorted([img for img in sequence.iterdir() if img.suffix.lower() in valid_exts])
            for img_path in image_paths:
                label_path = seq_out_dir / f"{img_path.stem}.txt"
                if (not args.overwrite_existing) and label_path.exists():
                    skipped_existing += 1
                    continue
                all_candidates.append((img_path, seq_out_dir, sequence.name))

    total_candidates = len(all_candidates)
    print(f"Discovered {total_candidates} candidate images.")
    if skipped_existing > 0:
        print(f"Resume mode: skipped {skipped_existing} images with existing labels.")
    if args.max_images and args.max_images > 0:
        total_run_target = min(args.max_images, total_candidates)
        print(f"Run capped to {total_run_target} images (--max-images).")
    else:
        total_run_target = total_candidates
    
    total_images_processed = 0
    total_boxes_written = 0
    total_labels_written = 0
    run_started = time.time()
    
    last_sequence = None
    for i in range(0, total_run_target, batch_size):
        batch_candidates = all_candidates[i:i + batch_size]
        batch_paths = [c[0] for c in batch_candidates]
        for _, seq_out_dir, sequence_name in batch_candidates:
            seq_out_dir.mkdir(parents=True, exist_ok=True)
            if args.debug:
                seq_debug_dir = args.debug_dir / sequence_name
                seq_debug_dir.mkdir(parents=True, exist_ok=True)
            if sequence_name != last_sequence:
                print(f"Processing sequence: {sequence_name}")
                last_sequence = sequence_name

        # Use model.track() to maintain IDs across frames in a sequence.
        # Note: persit=True ensures the tracker state is maintained between batches.
        results = model.track(
            source=batch_paths,
            device=device,
            conf=args.conf_thresh,
            iou=args.iou,
            imgsz=args.imgsz,
            augment=args.augment,
            classes=target_classes,
            persist=True,
            verbose=False,
            save=False,
        )

        for r_idx, r in enumerate(results):
            img_path, seq_out_dir, sequence_name = batch_candidates[r_idx]
            label_path = seq_out_dir / f"{img_path.stem}.txt"

            needs_review = False
            boxes = r.boxes

            lines = []
            lowest_conf = None
            for box in boxes:
                conf = box.conf[0].item()
                x, y, w, h = box.xywhn[0].tolist()

                if lowest_conf is None or conf < lowest_conf:
                    lowest_conf = conf
                if conf < args.manual_thresh:
                    needs_review = True

                mapped_id = CLASS_MAP.get("person", 0)
                track_id = int(box.id[0].item()) if box.id is not None else None
                line = format_line(
                    class_id=mapped_id,
                    x_center=x,
                    y_center=y,
                    width=w,
                    height=h,
                    track_id=track_id,
                )
                lines.append(line)

            if lines:
                label_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
                total_labels_written += 1
                total_boxes_written += len(lines)

            if needs_review:
                manual_review_list.append([str(img_path), lowest_conf if lowest_conf is not None else 0.0])

            if args.debug and i == 0 and r_idx < 5:
                debug_path = args.debug_dir / sequence_name / f"preview_{img_path.name}"
                r.save(filename=str(debug_path))

        total_images_processed += len(batch_paths)
        elapsed = time.time() - run_started
        images_per_sec = total_images_processed / elapsed if elapsed > 0 else 0.0
        eta_seconds = (
            (total_run_target - total_images_processed) / images_per_sec
            if images_per_sec > 0
            else None
        )

        if total_images_processed % checkpoint_interval == 0 or total_images_processed == total_run_target:
            write_checkpoint(
                checkpoint_path,
                total_candidates=total_run_target,
                images_processed=total_images_processed,
                labels_written=total_labels_written,
                boxes_written=total_boxes_written,
                manual_review_count=len(manual_review_list),
                elapsed_seconds=elapsed,
                last_image=str(batch_paths[-1]) if batch_paths else "",
            )

        if eta_seconds is None:
            eta_msg = "calculating"
        else:
            eta_msg = f"{eta_seconds / 60.0:.1f} min"
        print(
            f"Progress: {total_images_processed}/{total_run_target} | "
            f"{images_per_sec:.2f} img/s | ETA {eta_msg}"
        )
                
    # Write manual review CSV
    if manual_review_list:
        with open(manual_review_csv, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["image_path", "lowest_confidence"])
            writer.writerows(manual_review_list)
        print(f"Flagged {len(manual_review_list)} images for manual review.")
        
    # Generate data.yaml
    yaml_path = write_yaml(out_dir, CLASS_MAP)
    print(f"Generated YAML at: {yaml_path}")
    print(f"Total processed: {total_images_processed} images, {total_boxes_written} boxes.")
    final_elapsed = max(0.001, time.time() - run_started)
    print(f"Elapsed: {final_elapsed / 60.0:.2f} min | Throughput: {total_images_processed / final_elapsed:.2f} img/s")
    print(f"Checkpoint file: {checkpoint_path}")
    
if __name__ == "__main__":
    main()
