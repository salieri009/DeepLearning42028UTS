"""Split preprocessed YOLO dataset into train/val/test by video sequences."""

import argparse
import random
import shutil
from pathlib import Path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Split JRDB dataset by sequences.")
    parser.add_argument("--src-labels", type=Path, required=True, help="Directory with generated YOLO txt files")
    parser.add_argument("--src-images", type=Path, required=True, help="Directory containing raw images in sequence folders")
    parser.add_argument("--output-dir", type=Path, default=Path("data/processed"), help="Output directory for train/val/test splits")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for splitting sequences")
    return parser


def main() -> None:
    args = build_parser().parse_args()

    src_labels = args.src_labels
    src_images = args.src_images
    output_dir = args.output_dir

    if not src_images.is_dir():
        print(f"Error: Images directory not found at {src_images}")
        return
    if not src_labels.is_dir():
        print(f"Error: Labels directory not found at {src_labels}")
        return

    # Find sequences (assume folders inside src_images)
    sequences = sorted([d.name for d in src_images.iterdir() if d.is_dir()])
    if not sequences:
        print("No sequence folders found in images directory!")
        return

    print(f"Found {len(sequences)} sequences for splitting.")

    # Sort and then shuffle predictably
    random.seed(args.seed)
    random.shuffle(sequences)

    # 70/20/10 Split
    num_seq = len(sequences)
    train_end = int(num_seq * 0.7)
    val_end = train_end + max(1, int(num_seq * 0.2))  # Ensure at least 1 val if > 1 total

    splits = {
        "train": sequences[:train_end],
        "val": sequences[train_end:val_end],
        "test": sequences[val_end:]
    }

    # Setup output directories
    total_images = {"train": 0, "val": 0, "test": 0}
    for split_name, seqs in splits.items():
        if not seqs:
            continue
            
        print(f"[{split_name.upper()}] processing {len(seqs)} sequences...")
        out_img_dir = output_dir / split_name / "images"
        out_lbl_dir = output_dir / split_name / "labels"
        out_img_dir.mkdir(parents=True, exist_ok=True)
        out_lbl_dir.mkdir(parents=True, exist_ok=True)

        for seq in seqs:
            seq_dir = src_images / seq
            for img_path in seq_dir.glob("*.jpg"):  # Adjust extension if needed
                # Target filename in output (prefix with seq to avoid collisions)
                new_stem = f"{seq}_{img_path.stem}"
                
                # Check for corresponding label
                lbl_path = src_labels / f"{new_stem}.txt"
                if not lbl_path.exists():
                    # Check original filename logic inside src_labels if no prefix
                    lbl_path = src_labels / f"{img_path.stem}.txt"
                
                if lbl_path.exists():
                    # Copy image and label
                    shutil.copy2(img_path, out_img_dir / f"{new_stem}{img_path.suffix}")
                    shutil.copy2(lbl_path, out_lbl_dir / f"{new_stem}.txt")
                    total_images[split_name] += 1

    print("\n--- Summary ---")
    for split_name, count in total_images.items():
        print(f" - {split_name}: {count} image/label pairs")

if __name__ == "__main__":
    main()