#!/bin/bash
# ==============================================================================
# SageMaker Studio / Notebook Lifecycle Configuration Script
# (SageMaker 노트북 초기 설정 스크립트)
# ==============================================================================
# 이 스크립트는 로컬(Mac/Windows)에서 쓰이는 것이 아닙니다!
# AWS SageMaker에서 대화형 환경(Jupyter Notebook 인스턴스)을 생성할 때, 
# 켜지자마자 자동으로 필요한 라이브러리를 설치해주기 위한 설정 파일입니다.

set -e

# SageMaker 환경 내부에 기본적으로 깔려있는 conda 환경을 활성화합니다.
# (사용하는 SageMaker 이미지 버전에 따라 환경 이름이 다를 수 있습니다.)
source /home/ec2-user/anaconda3/bin/activate tensorflow2_p310 || true

echo "Installing required dependencies for CrowdNav interactive development..."

# 기본적으로 필요한 컴퓨터 비전 라이브러리 등을 설치합니다.
pip install --upgrade pip
pip install opencv-python-headless

# ------------------------------------------------------------------
# [주의] ClearML은 현재 데이터 전처리 단계이므로 임시로 비활성화 합니다.
# ------------------------------------------------------------------
# pip install clearml
# export CLEARML_WEB_HOST="https://app.clear.ml"
# export CLEARML_API_ACCESS_KEY="<your_access_key>"
# export CLEARML_API_SECRET_KEY="<your_secret_key>"

echo "Environment setup complete. Ready to run experiments."
