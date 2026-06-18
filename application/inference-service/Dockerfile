# =============================================================================
# CrowdNav inference-service (FastAPI + Ultralytics YOLO)
# Build context: application/inference-service/
#
# Per ADR-0002 this service is the Spring backend's internal inference adapter.
# Per ADR-0003 the SageMaker job produces `best.pt`, which is mounted at runtime
# to /opt/model/best.pt (NOT baked into the image).
# =============================================================================
FROM python:3.11-slim AS runtime

LABEL org.opencontainers.image.title="crowdnav-inference" \
      org.opencontainers.image.version="2.5.0"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MODEL_PATH=/opt/model/best.pt \
    HOST=0.0.0.0 \
    PORT=9000

# OS deps for OpenCV (ultralytics dep) — keep slim
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/inference

# Install Python deps first to maximize layer cache hits
COPY requirements.txt /opt/inference/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r /opt/inference/requirements.txt

# Source
COPY . /opt/inference/

# Expected mount point for the trained checkpoint (see compose `volumes:`).
RUN mkdir -p /opt/model

# Run as non-root
RUN useradd --system --create-home --shell /bin/bash inference \
    && chown -R inference:inference /opt/inference /opt/model
USER inference

EXPOSE 9000
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=5 \
    CMD curl -fsS http://localhost:9000/health >/dev/null || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]
