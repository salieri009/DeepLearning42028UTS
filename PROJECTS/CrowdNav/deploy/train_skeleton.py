import os
import tensorflow as tf
from tensorflow import keras
from clearml import Task
import argparse

def train_model():
    parser = argparse.ArgumentParser()
    # AWS SageMaker injects parameters via environment variables automatically
    # SM_MODEL_DIR -> Output directory for model artifacts (saved to S3)
    parser.add_argument('--model-dir', type=str, default=os.environ.get('SM_MODEL_DIR'))
    # SM_CHANNEL_TRAINING -> Input directory for data from S3
    parser.add_argument('--train-data', type=str, default=os.environ.get('SM_CHANNEL_TRAINING'))
    args = parser.parse_args()

    # 1. Initialize ClearML Task securely.
    # Credentials should be passed via SageMaker Estimator Environment variables.
    task = Task.init(
        project_name="CrowdNav/Collision-Avoidance",
        task_name="SageMaker_YOLO_Training_Run",
        output_uri=True # Captures prints and metrics automatically
    )

    # Capture argparse parameters
    task.connect(args)

    # 2. Simulate YOLO/CNN Model Architecture
    model = keras.Sequential([
        keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
        keras.layers.MaxPooling2D((2, 2)),
        keras.layers.Flatten(),
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dense(3, activation='softmax') # e.g., SAFE, WARNING, DANGER
    ])

    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

    # Pseudo-data for skeletal structure
    import numpy as np
    x_train = np.random.random((10, 224, 224, 3))
    y_train = np.random.randint(0, 3, (10,))
    y_train = tf.keras.utils.to_categorical(y_train, 3)

    # 3. ClearML Keras/TensorBoard integration
    # Best practice: use Keras TensorBoard callback to stream directly to ClearML Experiment Tracking
    tb_callback = keras.callbacks.TensorBoard(log_dir=f'{args.model_dir}/logs')

    # Start training
    model.fit(
        x_train, y_train, 
        epochs=5,
        callbacks=[tb_callback] # Automatically hooked by ClearML because we called Task.init()
    )

    # 4. Save model locally so SageMaker can archive to S3
    model.save(os.path.join(args.model_dir, "crowdnav_yolo_model.h5"))
    print("Training finished, model saved to /opt/ml/model (which is shipped to S3 automatically)")

if __name__ == "__main__":
    train_model()
