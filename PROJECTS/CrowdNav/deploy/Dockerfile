# ==============================================================================
# CrowdNav: PyTorch + CUDA 12.1 + Ultralytics (YOLO) for local GPU / SageMaker
# Aligned with requirements.txt (cu121) and g6 / L4-class instances.
# ==============================================================================
FROM pytorch/pytorch:2.5.1-cuda12.1-cudnn9-runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    SM_CHANNEL_TRAINING=/opt/ml/input/data/training \
    SM_MODEL_DIR=/opt/ml/model \
    SM_OUTPUT_DATA_DIR=/opt/ml/output/data

RUN mkdir -p /opt/ml/input/data/training \
    && mkdir -p /opt/ml/model \
    && mkdir -p /opt/ml/output/data

WORKDIR /opt/program

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Project deps (ultralytics, clearml, torch cu121 wheels, etc.)
COPY requirements.txt /opt/program/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /opt/program/requirements.txt

RUN pip install --no-cache-dir jupyterlab notebook sagemaker-training boto3

# For SageMaker: COPY source or mount at run time. docker-compose uses a volume.
# Build from CrowdNav repo root: docker build -f deploy/Dockerfile .

CMD ["/bin/bash"]
