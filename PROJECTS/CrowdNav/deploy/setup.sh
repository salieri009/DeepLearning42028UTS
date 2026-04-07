#!/bin/bash
# SageMaker Studio / Notebook Lifecycle Configuration Script
# This script prepares an interactive Jupyter environment before training is shifted to a custom container.

set -e

# Activate the default Jupyter environment (e.g., TensorFlow 2)
# The exact environment name depends on the SageMaker image being used (e.g., studio or notebook instance)
source /home/ec2-user/anaconda3/bin/activate tensorflow2_p310 || true

echo "Installing required dependencies for CrowdNav interactive development..."

# Install ClearML and computer vision dependencies
pip install --upgrade pip
pip install clearml opencv-python-headless

# Note: ClearML credentials should NOT be hardcoded here.
# Instead, they can be injected via shell profile or AWS Secrets Manager.
# For interactive sessions, you can run `clearml-init` manually or export the variables:
# export CLEARML_WEB_HOST="https://app.clear.ml"
# export CLEARML_API_ACCESS_KEY="<your_access_key>"
# export CLEARML_API_SECRET_KEY="<your_secret_key>"

echo "Environment setup complete. Ready to run Keras/YOLO experiments."
