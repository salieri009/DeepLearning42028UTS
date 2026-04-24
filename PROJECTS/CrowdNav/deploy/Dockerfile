# ==============================================================================
# CrowdNav 프로젝트 공통 개발 & 배포용 Dockerfile
# ==============================================================================
# 이 Dockerfile은 두 가지 목적을 가지고 있습니다:
# 1. 팀원들(Mac, Windows 등)이 동일한 환경에서 Jupyter Notebook을 띄워 데이터 전처리/개발을 할 수 있게 합니다.
# 2. 향후 AWS SageMaker에서 학습(Training) 컨테이너로 쓰일 수 있는 뼈대 구조를 갖춥니다.

# [1] Base Image (운영체제 및 기본 환경 설정)
# TensorFlow 2.15.0 버전과 GPU 지원이 포함된 공식 이미지를 사용합니다.
# (참고: Apple Silicon Mac의 경우 CPU 에뮬레이션으로 동작하여 조금 느릴 수 있으나 코드는 완벽히 호환됩니다.)
FROM tensorflow/tensorflow:2.15.0-gpu

# [2] Environment Variables (환경 변수 설정)
# 파이썬 실행 관련 설정과 AWS SageMaker가 요구하는 필수 디렉토리 경로를 환경 변수로 미리 지정합니다.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # SageMaker가 S3 버킷의 데이터를 컨테이너로 다운로드(Mount) 해주는 경로
    SM_CHANNEL_TRAINING=/opt/ml/input/data/training \
    # SageMaker가 학습 완료 후 모델 파일(.h5, .pt 등)을 수거해가는 경로
    SM_MODEL_DIR=/opt/ml/model \
    # 로그 파일이나 기타 비-모델 산출물들을 저장하는 경로
    SM_OUTPUT_DATA_DIR=/opt/ml/output/data

# [3] Directory Creation (디렉토리 생성)
# 위에서 지정한 SageMaker용 디렉토리들을 컨테이너 내부에 실제로 생성해둡니다.
RUN mkdir -p /opt/ml/input/data/training \
    && mkdir -p /opt/ml/model \
    && mkdir -p /opt/ml/output/data

# [4] Work Directory (작업 폴더 지정)
# 컨테이너에 접속했을 때나 코드가 실행될 때 기본적으로 위치할 폴더를 /opt/program 으로 설정합니다.
WORKDIR /opt/program

# [5] System Dependencies (OS 레벨 필수 패키지 설치)
# OpenCV나 외부 스크립트 실행에 필요한 기본적인 리눅스 패키지를 설치합니다.
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# [6] Python Packages (파이썬 라이브러리 설치)
# 팀원들이 로컬에서 데이터 전처리와 Jupyter를 사용할 수 있도록 jupyterlab 등을 설치합니다.
# (주의: 당장 사용하지 않는 clearml은 비활성화(제거) 하였습니다.)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    jupyterlab \
    notebook \
    opencv-python-headless \
    boto3 \
    sagemaker-training \
    pandas \
    matplotlib

# [7] Source Code Copy (소스코드 복사 - 주석 처리됨)
# 로컬 개발(Jupyter) 시에는 docker-compose.yml을 통해 폴더 자체를 동기화(Volume Mount)할 것이므로, 
# Dockerfile 안에서 COPY를 강제로 하지 않습니다. 
# 나중에 AWS SageMaker에 배포할 때만 아래 주석을 풀고 빌드하면 됩니다.
# COPY ./src/models/ ./src/models/
# COPY ./train_skeleton.py ./train.py

# [8] Entrypoint (진입점 설정 - 주석 처리됨)
# 기존에는 컨테이너가 켜지자마자 무조건 train.py를 실행하도록 강제되어 있었습니다.
# 팀원들이 로컬에서 Jupyter나 Bash로 자유롭게 접속할 수 있도록 Entrypoint를 제거했습니다.
# (나중에 SageMaker에 올릴 때는 아래 주석을 풀어서 사용합니다.)
# ENTRYPOINT ["python", "train.py"]

# 기본 실행 커맨드는 bash 쉘로 지정합니다. docker-compose에서는 이 대신 jupyter를 실행할 것입니다.
CMD ["/bin/bash"]
