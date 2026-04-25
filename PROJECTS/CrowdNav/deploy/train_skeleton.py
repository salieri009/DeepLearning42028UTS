"""Legacy SageMaker training skeleton (classification placeholder).

This file predates the COCO/Keras object detection pipeline.
For COCO JSON training, use `deploy/train_keras_skeleton.py`.
"""

import argparse
import os

from tensorflow import keras

# ClearML은 데이터 전처리 단계에서 임시 비활성화.
# from clearml import Task

# ==============================================================================
# AWS SageMaker 전용 뼈대(Skeleton) 학습 스크립트.
# 향후 Jupyter에서 테스트한 코드를 이 스크립트로 옮기면 SageMaker가 호출함.
# ==============================================================================


def train_model():
    parser = argparse.ArgumentParser()
    # SageMaker 환경 변수:
    # - SM_MODEL_DIR: 모델 저장 경로 (SageMaker가 있으면 아티팩트로 수집)
    # - SM_CHANNEL_TRAINING: 학습 데이터 마운트 경로
    parser.add_argument("--model-dir", type=str, default=os.environ.get("SM_MODEL_DIR", "/opt/ml/model"))
    parser.add_argument(
        "--train-data",
        type=str,
        default=os.environ.get("SM_CHANNEL_TRAINING", "/opt/ml/input/data/training"),
    )
    args = parser.parse_args()

    # ClearML (현재 미사용)
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
            keras.layers.Dense(3, activation="softmax"),  # 예: SAFE / WARNING / DANGER
        ]
    )

    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])

    # 스모크 테스트용 가짜 데이터; 실제로는 args.train_data에서 로드
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
