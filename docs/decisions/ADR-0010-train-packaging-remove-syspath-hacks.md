# ADR-0010: train/ 을 editable package 로 전환하여 sys.path 핵 제거

- **Status**: Accepted
- **Date**: 2026-05-05
- **Deciders**: Jungwook (사용자), Claude (Cowork mode)
- **Branch**: `docs/design-decisions`

## Context

워커(W1) 분석 결과, `train/` 트리에 진입점 스크립트가 `sys.path.insert(...)` 우회 로직을 포함:

| 파일 | 라인 | 핵 |
|---|---|---|
| `train/run_auto_labeling.py` | 9 | `sys.path.insert(0, str(_TRAIN))` |
| `train/scripts/automate_preprocessing.py` | 33 | `sys.path.insert(0, str(Path(__file__).resolve().parents[1]))` |
| `train/scripts/self_train_loop.py` | 24 | `sys.path.insert(0, str(PROJECT_ROOT))` |
| `train/scripts/train_yolo.py` | 12 | `sys.path.insert(0, str(PROJECT_ROOT))` |
| `train/notebooks/01_sagemaker_clearml_launcher.ipynb` | 51 | 같은 패턴 |

또한 `train/`, repo root 어디에도 `pyproject.toml` / `setup.py` / `setup.cfg` 가 **없음** — 즉 `src` 가 정식 패키지로 install 가능한 상태가 아님. 실행 디렉토리에 따라 `from src.training.train_pipeline import ...` 가 깨지므로 핵을 박은 것.

부작용: IDE auto-import 가 `src.training.X` 와 `train.src.training.X` 사이에서 갈팡질팡, mypy strict 검사가 진입점에 따라 다른 결과 반환.

## Decision

**We will package `train/` as an editable Python package (`crowdnav-train`) via a new `train/pyproject.toml`. After `pip install -e ./train`, every `sys.path.insert` line is removed. The existing `src/` directory is exposed directly as the `src` package (namespace mapping), so all existing `from src.X` imports continue to work unchanged — no bulk rename is required.**

## Alternatives Considered

- **Option A — repo root 에 단일 `pyproject.toml` 두고 `train/src` 를 `tool.setuptools.packages.find` 로 픽업**
  - pros: 한 곳만 관리
  - cons: `application/` (Java/TS) 와 `train/` (Python) 가 같은 패키지 매니페스트 공유 → 부적절. 향후 backend 에 Python 추론 모듈 분리 시 충돌
  - reject: 모노레포 경계 흐려짐
- **Option B — `train/` 안의 `src` 를 `train_src` 로 rename + flat layout**
  - pros: 패키지 구조 단순
  - cons: 거대한 rename, 모든 import 변경, git diff 폭발
  - reject: 변경 범위 과다
- **Option C (선택됨) — `train/pyproject.toml` 하나로 `crowdnav_train` 네임스페이스 패키지 정의 + `pip install -e ./train`**
  - pros: 변경 최소, 표준 PEP 621/518 패턴, `application/inference-service` 가 추후 동일 패키지를 의존성으로 잡을 수 있음
  - cons: 신규 컨트리뷰터가 `pip install -e ./train` 한 번 더 돌려야 함 (root README 갱신으로 안내)
  - selected (사용자 명시 결정 — "ㅇㅇ 우회 패키징해라")

## Consequences

- **Positive**:
  - 5개 진입점에서 `sys.path` 핵 라인 제거 → 코드 깔끔
  - IDE auto-import / mypy 가 단일 모듈 경로 사용 → 정합성 회복
  - `application/inference-service/` 가 `src.inference.collision_avoidance` 등을 정식 import 가능 → ADR-0002 의 "Spring↔FastAPI 통합" 가속
- **Negative / risks**:
  - `from src.X` import 는 **그대로 유지** (rename 없음) — `pyproject.toml` 의 `packages.find` 가 `src` 패키지를 직접 노출하므로 기존 코드 변경 불필요
  - SageMaker job (`infra/sagemaker/sagemaker_train.py`) 환경에 `crowdnav-train` 가 install 되도록 `infra/sagemaker/requirements.txt` 갱신 필요
  - Docker 이미지 빌드 시 `pip install -e ./train` 또는 wheel 빌드 단계 추가 필요
- **Follow-up actions** (Accepted 후 단계):
  1. **신규 파일**: `train/pyproject.toml` — 아래 §A 템플릿 적용 (**완료**)
  2. **디렉토리 rename**: 불필요 — `pyproject.toml` 의 `[tool.setuptools.packages.find]` 가 `src` 패키지를 직접 expose (**namespace mapping 없이 진행**)
  3. **sys.path.insert 5곳 삭제** (notebook 포함) (**완료**)
  4. **`README.md` 갱신**: 환경 셋업 절차에 `pip install -e ./train` 추가
  5. **`infra/sagemaker/sagemaker_train.py`** `requirements.txt` 에 `./train` 또는 빌드된 wheel 등록
  6. **CI**: `.github/workflows/build-check.yml` 에서 `pip install -e ./train` 단계 확인/추가
  7. **검증**: `python -c "from src.training.train_pipeline import TrainPipeline; print('ok')"` 가 어느 디렉토리에서도 동작

### §A `train/pyproject.toml` 초안

```toml
[build-system]
requires = ["setuptools>=68", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "crowdnav-train"
version = "0.1.0"
description = "CrowdNav training, preprocessing, and inference packages (UTS 42028 DL A3)"
requires-python = ">=3.10"
dynamic = ["dependencies"]

[tool.setuptools.dynamic]
dependencies = { file = ["requirements.txt"] }

[tool.setuptools.packages.find]
where = ["src"]
include = ["*"]
namespaces = false

[tool.setuptools.package-dir]
"crowdnav_train" = "src"

# ruff/mypy 설정은 기존 .ruff.toml / mypy.ini 유지
```

> 위 `package-dir` 매핑으로 `src/` 디렉토리를 그대로 두고 import 시엔 `crowdnav_train` 으로 노출. 디렉토리 rename 없이 진행 가능.

## References

- Related code:
  - `train/run_auto_labeling.py`
  - `train/scripts/automate_preprocessing.py`
  - `train/scripts/self_train_loop.py`
  - `train/scripts/train_yolo.py`
  - `train/notebooks/01_sagemaker_clearml_launcher.ipynb`
  - `train/src/` 전체
- Related docs:
  - `docs/DESIGN.md` §3.3
  - `docs/architecture/LEGACY_CATALOG.md` §3
- 의존 ADR:
  - ADR-0002 (Spring↔Python 통합 시 정식 패키지 import 가능해짐으로 가속)
  - ADR-0003 (Docker 빌드에 `pip install -e ./train` 추가 필요)
- PEP 621 (project metadata), PEP 518 (build system)
- Cookbooks pattern used: 해당 없음
