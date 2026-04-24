"""Legacy SageMaker training skeleton (classification placeholder).

This file predates the COCO/Keras object detection pipeline.
For COCO JSON training, use `deploy/train_keras_skeleton.py`.
"""

import argparse
import os

import tensorflow as tf
from tensorflow import keras

def train_model():
    parser = argparse.ArgumentParser()
    # SageMaker injects standard paths via environment variables:
    # - SM_MODEL_DIR: saved model output (uploaded to S3 automatically)
    # - SM_CHANNEL_TRAINING: training data channel path
    parser.add_argument("--model-dir", type=str, default=os.environ.get("SM_MODEL_DIR", "/opt/ml/model"))
    parser.add_argument(
        "--train-data",
        type=str,
        default=os.environ.get("SM_CHANNEL_TRAINING", "/opt/ml/input/data/training"),
    )
    args = parser.parse_args()

    # Placeholder model. Replace with a real training loop if you still use this file.
    print("Building model architecture...")
    model = keras.Sequential([
        keras.layers.Conv2D(32, (3, 3), activation="relu", input_shape=(224, 224, 3)),
        keras.layers.MaxPooling2D((2, 2)),
        keras.layers.Flatten(),
        keras.layers.Dense(64, activation="relu"),
        keras.layers.Dense(3, activation="softmax"),  # example: SAFE/WARNING/DANGER
    ])

    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])

    # Fake data for smoke testing only.
    import numpy as np

    x_train = np.random.random((10, 224, 224, 3))
    y_train = np.random.randint(0, 3, (10,))

    print("Starting training process...")
    tb_callback = keras.callbacks.TensorBoard(log_dir=f"{args.model_dir}/logs")

    model.fit(
        x_train,
        y_train,
        epochs=5,
        callbacks=[tb_callback]
    )

    # SageMaker collects artifacts from args.model_dir.
    save_path = os.path.join(args.model_dir, "crowdnav_yolo_model.h5")
    model.save(save_path)
    print(f"Training finished, model successfully saved to {save_path}")

if __name__ == "__main__":
    train_model()
