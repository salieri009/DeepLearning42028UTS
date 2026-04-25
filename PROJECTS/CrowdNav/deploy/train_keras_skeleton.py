"""SageMaker entry-point for Keras object detection training (COCO JSON).

This script is designed to run under the SageMaker Training Toolkit.
It expects COCO JSON annotation files and an images root directory.

Recommended workflow:
1) Prepare data locally:
   - pseudo-label -> split -> convert to COCO JSON
2) Upload `data/processed/coco/*.json` and `data/processed/splits/*/images` to S3
3) Launch a SageMaker training job that calls this script.

Artifacts:
- Model is saved to SM_MODEL_DIR (uploaded to S3 automatically)
- Metrics JSON is written to SM_OUTPUT_DATA_DIR for easy retrieval
"""

from __future__ import annotations

import argparse
import json
import os
from dataclasses import asdict
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class TrainResult:
    model_dir: str
    metrics_path: str
    epochs: int


def _env_path(name: str, default: str) -> str:
    value = os.environ.get(name)
    return value if value else default


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Train a Keras detector from COCO JSON (SageMaker entry-point).")

    p.add_argument("--train-json", type=str, required=True, help="Path to COCO train.json")
    p.add_argument("--val-json", type=str, required=True, help="Path to COCO val.json")
    p.add_argument("--images-root", type=str, required=True, help="Root directory containing images referenced by COCO JSON")

    p.add_argument("--epochs", type=int, default=50)
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--batch", type=int, default=8)
    p.add_argument("--lr", type=float, default=1e-3)
    p.add_argument("--max-instances", type=int, default=100)

    p.add_argument("--model-dir", type=str, default=_env_path("SM_MODEL_DIR", "/opt/ml/model"))
    p.add_argument("--output-data-dir", type=str, default=_env_path("SM_OUTPUT_DATA_DIR", "/opt/ml/output/data"))
    return p


def train(args: argparse.Namespace) -> TrainResult:
    # TensorFlow/Keras is expected to be available in the SageMaker/Docker runtime.
    import tensorflow as tf
    from tensorflow import keras

    from src.data.keras.coco_tfds import TfDataConfig, build_coco_dataset

    model_dir = Path(args.model_dir)
    out_dir = Path(args.output_data_dir)
    model_dir.mkdir(parents=True, exist_ok=True)
    out_dir.mkdir(parents=True, exist_ok=True)

    cfg = TfDataConfig(
        image_size=(int(args.imgsz), int(args.imgsz)),
        batch_size=int(args.batch),
        max_instances=int(args.max_instances),
        shuffle=True,
    )

    train_ds = build_coco_dataset(
        coco_json=args.train_json,
        images_root=args.images_root,
        config=cfg,
    )
    val_ds = build_coco_dataset(
        coco_json=args.val_json,
        images_root=args.images_root,
        config=TfDataConfig(
            image_size=(int(args.imgsz), int(args.imgsz)),
            batch_size=int(args.batch),
            max_instances=int(args.max_instances),
            shuffle=False,
        ),
    )

    # Minimal baseline model: image -> global features -> fixed number of boxes/classes.
    # Replace this with KerasCV detector models when ready.
    inputs = keras.Input(shape=(int(args.imgsz), int(args.imgsz), 3), name="image")
    x = keras.layers.Conv2D(32, 3, padding="same", activation="relu")(inputs)
    x = keras.layers.MaxPooling2D()(x)
    x = keras.layers.Conv2D(64, 3, padding="same", activation="relu")(x)
    x = keras.layers.GlobalAveragePooling2D()(x)

    # Predict a fixed set of instances: [max_instances, 4] and [max_instances] class logits.
    max_instances = int(args.max_instances)
    box_out = keras.layers.Dense(max_instances * 4, name="boxes_dense")(x)
    cls_out = keras.layers.Dense(max_instances, name="classes_dense")(x)
    boxes = keras.layers.Reshape((max_instances, 4), name="boxes")(box_out)
    classes = keras.layers.Reshape((max_instances,), name="classes")(cls_out)

    model = keras.Model(inputs=inputs, outputs={"boxes": boxes, "classes": classes})

    optimizer = keras.optimizers.Adam(learning_rate=float(args.lr))
    model.compile(
        optimizer=optimizer,
        loss={
            "boxes": keras.losses.MeanSquaredError(),
            "classes": keras.losses.SparseCategoricalCrossentropy(from_logits=True),
        },
    )

    tb_dir = model_dir / "logs"
    callbacks = [keras.callbacks.TensorBoard(log_dir=str(tb_dir))]

    history = model.fit(train_ds, validation_data=val_ds, epochs=int(args.epochs), callbacks=callbacks)

    # Save model as SavedModel for serving/portable loading.
    saved_model_path = model_dir / "saved_model"
    model.save(str(saved_model_path), include_optimizer=False)

    metrics_path = out_dir / "metrics.json"
    metrics_path.write_text(json.dumps(history.history, indent=2), encoding="utf-8")

    return TrainResult(model_dir=str(model_dir.resolve()), metrics_path=str(metrics_path.resolve()), epochs=int(args.epochs))


def main() -> None:
    args = build_arg_parser().parse_args()
    result = train(args)
    print(json.dumps(asdict(result), indent=2))


if __name__ == "__main__":
    main()

