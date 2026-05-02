"""Legacy SageMaker training skeleton (classification placeholder).

This file predates the COCO/Keras object detection pipeline.
For COCO JSON training, use `deploy/train_keras_skeleton.py`.
"""

import argparse
import os

from tensorflow import keras

# Optional: from clearml import Task

# ==============================================================================
# Legacy SageMaker/Keras placeholder — prefer scripts/train_yolo.py for YOLO.
# ==============================================================================


def train_model():
    parser = argparse.ArgumentParser()
    # SageMaker env: SM_MODEL_DIR, SM_CHANNEL_TRAINING (or local paths)
    parser.add_argument("--model-dir", type=str, default=os.environ.get("SM_MODEL_DIR", "/opt/ml/model"))
    parser.add_argument(
        "--train-data",
        type=str,
        default=os.environ.get("SM_CHANNEL_TRAINING", "/opt/ml/input/data/training"),
    )
    args = parser.parse_args()

    # ClearML (optional)
    # task = Task.init(
    #     project_name="CrowdNav/Collision-Avoidance",
    #     task_name="SageMaker_YOLO_Training_Run",
    #     output_uri=True,
    # )
    # task.connect(args)

    print("Building model architecture...")
    model = keras.Sequential(
        [
            keras.layers.Conv2D(32, (3, 3), activation="relu", input_shape=(224, 224, 3)),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Flatten(),
            keras.layers.Dense(64, activation="relu"),
            keras.layers.Dense(3, activation="softmax"),  # e.g. SAFE / WARNING / DANGER
        ]
    )

    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])

    # Random smoke data; load from args.train_data in a real run
    import numpy as np

    x_train = np.random.random((10, 224, 224, 3))
    y_train = np.random.randint(0, 3, (10,))

    print("Starting training process...")
    tb_callback = keras.callbacks.TensorBoard(log_dir=f"{args.model_dir}/logs")

    model.fit(
        x_train,
        y_train,
        epochs=5,
        callbacks=[tb_callback],
    )

    save_path = os.path.join(args.model_dir, "crowdnav_yolo_model.h5")
    model.save(save_path)
    print(f"Training finished, model successfully saved to {save_path}")


if __name__ == "__main__":
    train_model()
