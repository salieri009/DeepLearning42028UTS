"""Split preprocessed YOLO dataset into train/val/test by video sequences."""

import argparse
import random
import shutil
from pathlib import Path


IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".bmp", ".webp")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Split JRDB dataset by sequences.")
    parser.add_argument("--src-labels", type=Path, required=True, help="Directory with generated YOLO txt files")
    parser.add_argument("--src-images", type=Path, required=True, help="Directory containing raw images in sequence folders")
    parser.add_argument("--output-dir", type=Path, default=Path("data/processed"), help="Output directory for train/val/test splits")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for splitting sequences")
    parser.add_argument("--train-ratio", type=float, default=0.7, help="Train split ratio")
    parser.add_argument("--val-ratio", type=float, default=0.2, help="Validation split ratio")
    return parser


def _clamp_ratio(value: float) -> float:
    return max(0.0, min(1.0, value))


def _copy_pairs(items: list[tuple[Path, Path, str]], out_img_dir: Path, out_lbl_dir: Path) -> int:
    copied = 0
    out_img_dir.mkdir(parents=True, exist_ok=True)
    out_lbl_dir.mkdir(parents=True, exist_ok=True)
    for img_path, lbl_path, out_stem in items:
        shutil.copy2(img_path, out_img_dir / f"{out_stem}{img_path.suffix}")
        shutil.copy2(lbl_path, out_lbl_dir / f"{out_stem}.txt")
        copied += 1
    return copied


def _collect_recursive_pairs(src_images: Path, src_labels: Path) -> list[tuple[Path, Path, str]]:
    pairs: list[tuple[Path, Path, str]] = []
    for img_path in sorted(src_images.rglob("*")):
        if not img_path.is_file() or img_path.suffix.lower() not in IMAGE_EXTS:
            continue
        lbl_path = src_labels / f"{img_path.stem}.txt"
        if lbl_path.exists():
            pairs.append((img_path, lbl_path, img_path.stem))
    return pairs


def _split_counts(total: int, train_ratio: float, val_ratio: float) -> tuple[int, int, int]:
    if total <= 0:
        return 0, 0, 0
    train_count = int(total * train_ratio)
    val_count = int(total * val_ratio)
    if total >= 3 and val_count == 0:
        val_count = 1
    if total >= 2 and train_count == 0:
        train_count = 1
    if train_count + val_count > total:
        val_count = max(0, total - train_count)
    test_count = total - train_count - val_count
    return train_count, val_count, test_count


def _load_class_names(src_labels: Path) -> list[str]:
    classes_path = src_labels / "classes.txt"
    if not classes_path.exists() or not classes_path.is_file():
        return ["person"]
    lines = [line.strip() for line in classes_path.read_text(encoding="utf-8").splitlines()]
    names = [line for line in lines if line]
    return names if names else ["person"]


def _write_data_yaml(output_dir: Path, class_names: list[str]) -> Path:
    data_yaml = output_dir / "data.yaml"
    names_repr = ", ".join(f'"{name}"' for name in class_names)
    dataset_root = output_dir.resolve().as_posix()
    content = (
        f"path: {dataset_root}\n"
        "train: train/images\n"
        "val: val/images\n"
        "test: test/images\n"
        f"nc: {len(class_names)}\n"
        f"names: [{names_repr}]\n"
    )
    data_yaml.write_text(content, encoding="utf-8")
    return data_yaml


def main() -> None:
    args = build_parser().parse_args()

    src_labels = args.src_labels
    src_images = args.src_images
    output_dir = args.output_dir
    train_ratio = _clamp_ratio(args.train_ratio)
    val_ratio = _clamp_ratio(args.val_ratio)

    if not src_images.is_dir():
        print(f"Error: Images directory not found at {src_images}")
        return
    if not src_labels.is_dir():
        print(f"Error: Labels directory not found at {src_labels}")
        return

    if train_ratio + val_ratio >= 1.0:
        print("Error: train-ratio + val-ratio must be < 1.0")
        return

    class_names = _load_class_names(src_labels)

    recursive_pairs = _collect_recursive_pairs(src_images, src_labels)

    # Find sequences (assume folders inside src_images)
    sequences = sorted([d.name for d in src_images.iterdir() if d.is_dir()])
    random.seed(args.seed)

    total_images = {"train": 0, "val": 0, "test": 0}

    if recursive_pairs:
        print(f"Found {len(recursive_pairs)} matched image/label pairs in recursive stem mode.")
        random.shuffle(recursive_pairs)

        train_count, val_count, _ = _split_counts(len(recursive_pairs), train_ratio, val_ratio)
        train_end = train_count
        val_end = train_count + val_count
        split_pairs = {
            "train": recursive_pairs[:train_end],
            "val": recursive_pairs[train_end:val_end],
            "test": recursive_pairs[val_end:],
        }

        for split_name, pairs in split_pairs.items():
            if not pairs:
                continue
            print(f"[{split_name.upper()}] processing {len(pairs)} pairs...")
            out_img_dir = output_dir / split_name / "images"
            out_lbl_dir = output_dir / split_name / "labels"
            total_images[split_name] = _copy_pairs(pairs, out_img_dir, out_lbl_dir)
    elif sequences:
        print(f"Found {len(sequences)} sequences for splitting.")
        random.shuffle(sequences)

        train_count, val_count, _ = _split_counts(len(sequences), train_ratio, val_ratio)
        train_end = train_count
        val_end = train_count + val_count
        split_sequences = {
            "train": sequences[:train_end],
            "val": sequences[train_end:val_end],
            "test": sequences[val_end:],
        }

        for split_name, seqs in split_sequences.items():
            if not seqs:
                continue
            print(f"[{split_name.upper()}] processing {len(seqs)} sequences...")
            out_img_dir = output_dir / split_name / "images"
            out_lbl_dir = output_dir / split_name / "labels"

            pairs: list[tuple[Path, Path, str]] = []
            for seq in seqs:
                seq_dir = src_images / seq
                for img_path in sorted(seq_dir.iterdir()):
                    if not img_path.is_file() or img_path.suffix.lower() not in IMAGE_EXTS:
                        continue
                    new_stem = f"{seq}_{img_path.stem}"
                    lbl_path = src_labels / f"{new_stem}.txt"
                    if not lbl_path.exists():
                        lbl_path = src_labels / f"{img_path.stem}.txt"
                    if lbl_path.exists():
                        pairs.append((img_path, lbl_path, new_stem))

            total_images[split_name] = _copy_pairs(pairs, out_img_dir, out_lbl_dir)
    else:
        print("No sequence folders found. Using flat-image split mode.")
        flat_pairs: list[tuple[Path, Path, str]] = []
        for img_path in sorted(src_images.iterdir()):
            if not img_path.is_file() or img_path.suffix.lower() not in IMAGE_EXTS:
                continue
            lbl_path = src_labels / f"{img_path.stem}.txt"
            if lbl_path.exists():
                flat_pairs.append((img_path, lbl_path, img_path.stem))

        if not flat_pairs:
            print("No image/label pairs found in flat-image mode!")
            return

        random.shuffle(flat_pairs)
        train_count, val_count, _ = _split_counts(len(flat_pairs), train_ratio, val_ratio)
        train_end = train_count
        val_end = train_count + val_count
        split_pairs = {
            "train": flat_pairs[:train_end],
            "val": flat_pairs[train_end:val_end],
            "test": flat_pairs[val_end:],
        }

        for split_name, pairs in split_pairs.items():
            if not pairs:
                continue
            print(f"[{split_name.upper()}] processing {len(pairs)} pairs...")
            out_img_dir = output_dir / split_name / "images"
            out_lbl_dir = output_dir / split_name / "labels"
            total_images[split_name] = _copy_pairs(pairs, out_img_dir, out_lbl_dir)

    print("\n--- Summary ---")
    for split_name, count in total_images.items():
        print(f" - {split_name}: {count} image/label pairs")

    data_yaml = _write_data_yaml(output_dir, class_names)
    print(f"\nYOLO data config written: {data_yaml}")

if __name__ == "__main__":
    main()