import os
import tensorflow as tf
from tensorflow import keras
import argparse

# [안내] ClearML 연동은 현재 데이터 전처리 단계이므로 임시로 비활성화(주석 처리) 하였습니다.
# from clearml import Task

# ==============================================================================
# AWS SageMaker 전용 뼈대(Skeleton) 학습 스크립트입니다.
# 
# [향후 사용 방법]
# 현재 로컬(또는 Jupyter)에서 작성 중인 데이터 전처리 및 학습 코드를
# 나중에 이 스크립트 내부로 옮기시면 됩니다. 
# SageMaker는 컨테이너를 실행할 때 이 스크립트를 호출하게 됩니다.
# ==============================================================================

def train_model():
    parser = argparse.ArgumentParser()
    # AWS SageMaker는 환경 변수를 통해 입력 데이터 경로와 출력 모델 경로를 자동으로 주입합니다.
    # --model-dir: 학습이 끝난 후 모델 파일(.h5 등)을 저장해야 하는 경로입니다. 
    #              여기에 저장된 파일은 자동으로 S3로 업로드됩니다.
    parser.add_argument('--model-dir', type=str, default=os.environ.get('SM_MODEL_DIR', '/opt/ml/model'))
    
    # --train-data: S3에 있는 학습용 데이터셋이 다운로드되어 마운트되는 경로입니다.
    #               데이터 전처리가 끝나고 학습할 때 이 폴더에서 데이터를 읽어와야 합니다.
    parser.add_argument('--train-data', type=str, default=os.environ.get('SM_CHANNEL_TRAINING', '/opt/ml/input/data/training'))
    args = parser.parse_args()

    # ---------------------------------------------------------
    # 1. ClearML 초기화 (현재 미사용 - 주석 처리)
    # ---------------------------------------------------------
    # task = Task.init(
    #     project_name="CrowdNav/Collision-Avoidance",
    #     task_name="SageMaker_YOLO_Training_Run",
    #     output_uri=True 
    # )
    # task.connect(args)

    # ---------------------------------------------------------
    # 2. 모델 아키텍처 정의 (예시: YOLO/CNN)
    # 향후 Jupyter에서 테스트한 실제 모델 코드로 이 부분을 대체하세요.
    # ---------------------------------------------------------
    print("Building model architecture...")
    model = keras.Sequential([
        keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
        keras.layers.MaxPooling2D((2, 2)),
        keras.layers.Flatten(),
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dense(3, activation='softmax') # 예: 0: SAFE, 1: WARNING, 2: DANGER
    ])

    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

    # [예시] 임의의 가짜 데이터 생성 (Skeleton 구조 테스트용)
    # 실제로는 args.train_data 경로에서 데이터를 로드해야 합니다.
    import numpy as np
    x_train = np.random.random((10, 224, 224, 3))
    y_train = np.random.randint(0, 3, (10,))
    # y_train = tf.keras.utils.to_categorical(y_train, 3)

    # ---------------------------------------------------------
    # 3. 모델 학습 (Training)
    # ---------------------------------------------------------
    print("Starting training process...")
    # TensorBoard 로그를 남기면, 추후 ClearML이나 로컬에서 시각화하기 편합니다.
    tb_callback = keras.callbacks.TensorBoard(log_dir=f'{args.model_dir}/logs')

    model.fit(
        x_train, y_train, 
        epochs=5,
        callbacks=[tb_callback]
    )

    # ---------------------------------------------------------
    # 4. 모델 저장 (중요!)
    # ---------------------------------------------------------
    # SageMaker가 이 결과물을 수거해 S3로 올릴 수 있도록 반드시 args.model_dir 에 저장해야 합니다.
    save_path = os.path.join(args.model_dir, "crowdnav_yolo_model.h5")
    model.save(save_path)
    print(f"Training finished, model successfully saved to {save_path}")

if __name__ == "__main__":
    train_model()
