#!/bin/bash
# ==============================================================================
# Optional: SageMaker Studio / classic Notebook lifecycle (on start)
# Not for local dev — use only if your admin attaches this to an SM notebook.
# ==============================================================================
set -e

# Activate a preinstalled conda env if present (name varies by image).
source /home/ec2-user/anaconda3/bin/activate tensorflow2_p310 || true

echo "Installing required dependencies for CrowdNav interactive development..."

pip install --upgrade pip
pip install opencv-python-headless

# Optional: ClearML
# pip install clearml
# export CLEARML_WEB_HOST="https://app.clear.ml"
# export CLEARML_API_ACCESS_KEY="<your_access_key>"
# export CLEARML_API_SECRET_KEY="<your_secret_key>"

echo "Environment setup complete. Ready to run experiments."
