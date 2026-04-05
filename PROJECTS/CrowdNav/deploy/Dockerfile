# Base image with CUDA/cuDNN support for TensorFlow/Keras
# Using a stable, official GPU image to minimize build complexity
FROM tensorflow/tensorflow:2.15.0-gpu

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # SageMaker-specific environment variables for custom containers
    # /opt/ml/input/data is where SageMaker mounts the training dataset (e.g., S3 -> container)
    SM_CHANNEL_TRAINING=/opt/ml/input/data/training \
    # /opt/ml/model is where the container must write the final model artifacts (SageMaker extracts this to S3)
    SM_MODEL_DIR=/opt/ml/model \
    # /opt/ml/output is for failure logs or non-model artifacts
    SM_OUTPUT_DATA_DIR=/opt/ml/output/data

# Create required SageMaker directory structure explicitly
RUN mkdir -p /opt/ml/input/data/training \
    && mkdir -p /opt/ml/model \
    && mkdir -p /opt/ml/output/data

# Set the working directory
WORKDIR /opt/program

# Install system dependencies (e.g., for OpenCV headless if needed)
# Using apt-get clean to minimize layer size
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install required Python packages
# Keras is included in TensorFlow 2.x, but explicitly adding clearml and opencv-python-headless
# Layer caching: copy requirements first if we had a requirements.txt, but inline pip is fine for a few dependencies
RUN pip install --no-cache-dir \
    clearml==1.14.3 \
    opencv-python-headless \
    boto3 \
    sagemaker-training

# Copy the training code into the container
COPY ./src/models/ ./src/models/
COPY ./train_skeleton.py ./train.py

# SageMaker expects the entrypoint to be an executable script located in the PATH or explicitly defined
ENTRYPOINT ["python", "train.py"]
