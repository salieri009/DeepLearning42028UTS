import argparse
from pathlib import Path
import csv
import yaml
import torch
from ultralytics import YOLO
from clearml import Task

CLASS_MAP = {'person': 0}

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Pseudo-label JRDB subset using YOLOv8.")
    parser.add_argument("--model", type=str, default="yolov8x.pt", help="YOLO model path or name")
    parser.add_argument("--src-dir", type=Path, default=Path("data/raw/images"), help="Source images directory")
    parser.add_argument("--out-dir", type=Path, default=Path("data/processed/labels"), help="Output labels directory")
    parser.add_argument("--debug", action="store_true", help="Enable visual sanity check previews")
    parser.add_argument("--debug-dir", type=Path, default=Path("data/processed/debug_previews"), help="Debug previews directory")
    parser.add_argument("--conf-thresh", type=float, default=0.5, help="Confidence threshold for detection")
    parser.add_argument("--manual-thresh", type=float, default=0.8, help="Confidence threshold below which manual review is flagged")
    return parser

def write_yaml(output_dir: Path, class_map: dict):
    yaml_path = output_dir / "data.yaml"
    sorted_classes = sorted(class_map.items(), key=lambda x: x[1])
    class_names = [name for name, _ in sorted_classes]
    
    # Just outputting a simple structure compatible with SageMaker/YOLO
    dataset_root = output_dir.resolve().as_posix()
    content = {
        "path": dataset_root,
        "train": "train/images",
        "val": "val/images",
        "test": "test/images",
        "nc": len(class_names),
        "names": class_names
    }
    
    with open(yaml_path, "w") as f:
        yaml.dump(content, f, sort_keys=False)
    
    return yaml_path

def main():
    args = build_parser().parse_args()
    
    # Initialize ClearML Task
    task = Task.init(project_name="CrowdNav", task_name="pseudo_labeling_v1")
    task.connect(vars(args))
    
    # Setup Device & Batch Size
    device = "cuda" if torch.cuda.is_available() else "cpu"
    batch_size = 16 if device == "cuda" else 4
    print(f"Using device: {device} | Batch Size: {batch_size}")
    
    model = YOLO(args.model)
    
    src_dir = args.src_dir
    out_dir = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    
    if args.debug:
        args.debug_dir.mkdir(parents=True, exist_ok=True)
        
    manual_review_csv = out_dir / "manual_review_required.csv"
    manual_review_list = []
    
    # COCO "person" class is 0. If model is COCO-pretrained, we filter by 0.
    target_classes = [0] 
    
    valid_exts = {".jpg", ".jpeg", ".png", ".bmp"}
    
    sequences = [d for d in src_dir.iterdir() if d.is_dir() and d.name in {"image_0", "image_2"}]
    
    total_images_processed = 0
    total_boxes_written = 0
    
    for seq_group in sequences:
        # e.g., seq_group is image_0 or image_2
        for sequence in seq_group.iterdir():
            if not sequence.is_dir():
                continue
            
            print(f"Processing sequence: {sequence.name}")
            seq_out_dir = out_dir / sequence.name
            seq_out_dir.mkdir(parents=True, exist_ok=True)
            
            if args.debug:
                seq_debug_dir = args.debug_dir / sequence.name
                seq_debug_dir.mkdir(parents=True, exist_ok=True)
            
            image_paths = sorted([img for img in sequence.iterdir() if img.suffix.lower() in valid_exts])
            
            # Process in batches
            for i in range(0, len(image_paths), batch_size):
                batch_paths = image_paths[i:i + batch_size]
                
                # YOLO inference
                results = model.predict(
                    source=batch_paths,
                    device=device,
                    conf=args.conf_thresh,
                    classes=target_classes,
                    verbose=False,
                    save=False
                )
                
                for r_idx, r in enumerate(results):
                    img_path = batch_paths[r_idx]
                    label_path = seq_out_dir / f"{img_path.stem}.txt"
                    
                    needs_review = False
                    boxes = r.boxes
                    
                    lines = []
                    for box in boxes:
                        cls_idx = int(box.cls[0].item())
                        conf = box.conf[0].item()
                        x, y, w, h = box.xywhn[0].tolist()
                        
                        # Check confidence
                        if conf < args.manual_thresh:
                            needs_review = True
                            
                        # Ensure we map to our CLASS_MAP index (person -> 0)
                        mapped_id = CLASS_MAP.get("person", 0)
                        lines.append(f"{mapped_id} {x:.6f} {y:.6f} {w:.6f} {h:.6f}")
                    
                    if lines:
                        label_path.write_text("\n".join(lines) + "\n")
                        total_boxes_written += len(lines)
                        
                    if needs_review:
                        manual_review_list.append([str(img_path), conf])
                        
                    # Visual Sanity Check
                    if args.debug and i == 0 and r_idx < 5:
                        debug_path = seq_debug_dir / f"preview_{img_path.name}"
                        r.save(filename=str(debug_path))
                        
                total_images_processed += len(batch_paths)
                
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
    
if __name__ == "__main__":
    main()
