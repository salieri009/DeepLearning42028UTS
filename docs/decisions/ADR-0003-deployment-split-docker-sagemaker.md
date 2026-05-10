# ADR-0003: Deployment split — Docker for FE+BE webapp / SageMaker for training only

- **Status**: Accepted
- **Date**: 2026-05-05
- **Deciders**: Jungwook (사용자), Claude (Cowork mode)
- **Branch**: `docs/design-decisions`
- **Related**: ADR-0002 (Spring backend), ADR-0009 (Keras 폐기)

## Context

DESIGN.md §4.2, §4.6 의 미해결 항목. 워커(W4) 분석 결과:

- `infra/docker/Dockerfile` 의 entry 가 **Jupyter Lab** — 학습 안 함, dev/탐색 환경
- `infra/sagemaker/sagemaker_launch.py` → `sagemaker_train.py` — 실제 YOLO 학습 경로 (ml.g5.xlarge 기본)
- 두 경로 사이에 SM_* 환경변수 정의 중복
- Docker 가 무엇을 위한 건지 코드상으로는 불명확했음

이대로 두면 (a) 학생 데모 시 Docker 로 뭘 실행할지 모호, (b) CI 매트릭스가 두 경로를 모두 검증해야 함.

## Decision

**We will split the two infra paths by purpose: Docker compose packages the runtime web application (frontend + Spring backend + Python inference-service with `best.pt`), while SageMaker handles training only and produces the `best.pt` checkpoint.**

즉:

- **Docker** = 학습 결과물(`best.pt`) 을 받아서 webapp 으로 배포하는 컨테이너 묶음
- **SageMaker** = 데이터를 입력받아 `best.pt` 를 출력하는 학습 잡

두 경로는 **`best.pt` artifact** 를 통해서만 연결되며 코드 공유는 없음.

## Alternatives Considered

- **Option A — Docker 단독 (SageMaker 폐기)**
  - pros: 단일 경로, 비용 예측 단순
  - cons: 단일 GPU 머신에서 100 epoch YOLO 학습 시간/메모리 위험, 학습 추적 도구 부재
  - reject: Assignment 학습 일정 위험
- **Option B — SageMaker 단독 (Docker 폐기)**
  - pros: 학습·배포 동일 인프라
  - cons: webapp 데모 환경(학생 노트북)에 SageMaker endpoint 필요 → 비용·복잡도, 오프라인 데모 불가
  - reject: 데모 가능성 손실
- **Option C (선택됨) — split: Docker for serving / SageMaker for training**
  - pros: 각 인프라 강점만 사용, 학생 노트북에서 webapp 데모 가능
  - cons: artifact 핸드오프(`best.pt`) 절차 명시 필요
  - selected (사용자 명시 결정)

## Consequences

- **Positive**:
  - `infra/docker/` 의 정체성 명확화: webapp 패키징 (Jupyter 로는 더 이상 안 띄움)
  - SageMaker job 실패가 webapp 데모를 막지 않음 (best.pt 는 캐시 가능)
  - Spring API + Python inference-service + React frontend 를 하나의 `docker compose up` 으로 띄움
- **Negative / risks**:
  - `best.pt` 핸드오프 절차가 수동이면 재현성 떨어짐 → S3 버전 태깅 또는 ClearML model registry 필요 (ADR-0004 와 연계)
  - 두 경로의 PyTorch/ultralytics 버전 불일치 시 추론 결과 미세 차이 → `train/requirements.txt` 와 `application/inference-service/requirements.txt` 의 핵심 패키지 버전 락 필요
- **Follow-up actions**:
  1. `infra/docker/Dockerfile` 갱신 — Jupyter 제거, multi-service compose 로 전환
  2. `infra/docker/docker-compose.yml` 에 3개 서비스 추가: `frontend` (Nginx + Vite build), `backend` (Spring jar), `inference` (FastAPI + best.pt mount)
  3. `application/inference-service/Dockerfile` 신규 작성 + `best.pt` 마운트 경로 명시 (`/opt/model/best.pt`)
  4. `application/backend/crowdnav-api/Dockerfile` 신규 작성 (Gradle build → JRE 실행)
  5. `application/frontend/Dockerfile` 신규 작성 (Vite build → Nginx serve)
  6. README 에 "best.pt 받기" 절차 명시 (SageMaker job → S3 다운로드 또는 ClearML artifact)
  7. `infra/train_skeleton.py`, `train_keras_skeleton.py` 폐기는 ADR-0009 에서

## References

- Related code:
  - `infra/docker/Dockerfile`
  - `infra/docker/docker-compose.yml`
  - `infra/sagemaker/sagemaker_launch.py`
  - `infra/sagemaker/sagemaker_train.py`
- Related docs:
  - `docs/DESIGN.md` §2.2, §4.2, §4.6
  - `docs/runbooks/SageMaker_Migration_Plan.md`
- Cookbooks pattern used: 해당 없음
