#!/bin/bash
# ==============================================================================
# Optional: SageMaker Studio / classic Notebook lifecycle (on start).
# Not for local dev or Docker — attach only if your admin wires this to an SM notebook.
# For the webapp demo use: cd application && docker compose up --build
# For cloud training see: docs/runbooks/SageMaker_Migration_Plan.md
# ==============================================================================
set -e

# Activate a preinstalled conda env if present (name varies by image).
# Project standardized on PyTorch + Ultralytics YOLO (see ADR-0009).
source /home/ec2-user/anaconda3/bin/activate pytorch_p310 || true

echo "Installing required dependencies for CrowdNav interactive development..."

pip install --upgrade pip
pip install opencv-python-headless

# Optional: ClearML
# pip install clearml
# export CLEARML_WEB_HOST="https://app.clear.ml"
# export CLEARML_API_ACCESS_KEY="<your_access_key>"
# export CLEARML_API_SECRET_KEY="<your_secret_key>"