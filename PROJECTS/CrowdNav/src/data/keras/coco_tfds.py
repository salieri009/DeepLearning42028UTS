"""tf.data input pipeline for COCO JSON object detection datasets.

This loader is intentionally minimal and "SageMaker-friendly":
- Reads COCO JSON produced by src.data.prepare.yolo_to_coco
- Loads and decodes images from an images root directory
- Outputs dense, padded tensors suitable for Keras training loops

Output signature (per batch):
  images: float32 [B, H, W, 3] in [0, 1]
  y: dict with:
    - boxes: float32 [B, max_instances, 4] absolute xywh (pixels)
    - classes: int32  [B, max_instances]
    - num_instances: int32 [B]
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from ..formats.coco import CocoDataset, load_coco_json, validate_coco_dataset


@dataclass(frozen=True)
class TfDataConfig:
    image_size: tuple[int, int] = (640, 640)  # (H, W)
    batch_size: int = 8
    shuffle: bool = True
    shuffle_buffer: int = 2048
    max_instances: int = 100
    drop_remainder: bool = False
    num_parallel_calls: int | None = None


def _resolve_paths(dataset: CocoDataset, images_root: Path) -> tuple[list[str], list[list[float]], list[list[int]]]:
    image_id_to_index: dict[int, int] = {img.id: i for i, img in enumerate(dataset.images)}
    paths: list[str] = [str((images_root / img.file_name).resolve()) for img in dataset.images]

    boxes_by_index: list[list[list[float]]] = [[] for _ in dataset.images]
    classes_by_index: list[list[int]] = [[] for _ in dataset.images]

    for ann in dataset.annotations:
        idx = image_id_to_index.get(ann.image_id)
        if idx is None:
            continue
        x, y, w, h = ann.bbox
        boxes_by_index[idx].append([float(x), float(y), float(w), float(h)])
        classes_by_index[idx].append(int(ann.category_id))

    flat_boxes: list[list[float]] = []
    flat_classes: list[list[int]] = []
    for b, c in zip(boxes_by_index, classes_by_index, strict=True):
        flat_boxes.append([v for box in b for v in box])  # flattened to keep ragged simple
        flat_classes.append(c)

    return paths, flat_boxes, flat_classes


def _decode_and_resize(tf, path, image_size: tuple[int, int]):
    raw = tf.io.read_file(path)
    img = tf.io.decode_image(raw, channels=3, expand_animations=False)
    img = tf.image.convert_image_dtype(img, tf.float32)
    img = tf.image.resize(img, image_size, method="bilinear")
    return img


def _unflatten_boxes(tf, flat):
    flat = tf.cast(flat, tf.float32)
    n = tf.shape(flat)[0] // 4
    return tf.reshape(flat[: n * 4], [n, 4])


def _pad_instances(
    tf,
    boxes,
    classes,
    *,
    max_instances: int,
):
    num = tf.shape(boxes)[0]
    num_clamped = tf.minimum(num, max_instances)
    boxes = boxes[:num_clamped]
    classes = classes[:num_clamped]

    pad = max_instances - tf.shape(boxes)[0]
    boxes = tf.pad(boxes, [[0, pad], [0, 0]], constant_values=0.0)
    classes = tf.pad(classes, [[0, pad]], constant_values=-1)
    return boxes, classes, num_clamped


def build_coco_dataset(
    *,
    coco_json: str | Path,
    images_root: str | Path,
    config: TfDataConfig = TfDataConfig(),
) :
    try:
        import tensorflow as tf  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "TensorFlow is required to build tf.data pipelines. "
            "Install TensorFlow or run inside the provided SageMaker/Docker environment."
        ) from e

    dataset = load_coco_json(coco_json)
    errors = validate_coco_dataset(dataset)
    if errors:
        raise ValueError("Invalid COCO dataset:\n" + "\n".join(f"- {e}" for e in errors))

    images_root_path = Path(images_root)
    paths, flat_boxes, flat_classes = _resolve_paths(dataset, images_root_path)

    ds = tf.data.Dataset.from_tensor_slices((paths, flat_boxes, flat_classes))
    if config.shuffle:
        ds = ds.shuffle(buffer_size=config.shuffle_buffer, reshuffle_each_iteration=True)

    image_size = tuple(int(x) for x in config.image_size)

    def _map(path, flat_b, cls):
        img = _decode_and_resize(tf, path, image_size=image_size)
        boxes = _unflatten_boxes(tf, flat_b)
        cls = tf.cast(cls, tf.int32)
        boxes, cls, n = _pad_instances(tf, boxes, cls, max_instances=int(config.max_instances))
        y = {"boxes": boxes, "classes": cls, "num_instances": n}
        return img, y

    num_parallel = tf.data.AUTOTUNE if config.num_parallel_calls is None else int(config.num_parallel_calls)
    ds = ds.map(_map, num_parallel_calls=num_parallel)
    ds = ds.batch(config.batch_size, drop_remainder=config.drop_remainder)
    ds = ds.prefetch(tf.data.AUTOTUNE)
    return ds

