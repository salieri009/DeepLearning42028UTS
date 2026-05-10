# ADR-0009: Keras skeleton 폐기

- **Status**: Accepted
- **Date**: 2026-05-05
- **Deciders**: Jungwook (사용자), Claude (Cowork mode)
- **Branch**: `docs/design-decisions`

## Context

워커(W4) 분석 결과, `infra/` 안에 현재 YOLO/Ultralytics 라인과 무관한 Keras 기반 코드가 잔존:

- `infra/train_skeleton.py` — "Legacy SageMaker/Keras placeholder" 주석. 3-class SAFE/WARNING/DANGER 분류기, dummy data, `.h5` 저장
- `infra/train_keras_skeleton.py` — COCO JSON → Keras CNN object detector, `src.data.keras.coco_tfds` import
- 추가 발견: `train/src/data/keras/__init__.py` (55B), `train/src/data/keras/coco_tfds.py` (4.7KB) — 위 스켈레톤이 의존하는 데이터 로더

`tensorflow` / `keras` 가 어떤 `requirements.txt` 에도 등재되어있지 않음 — 즉 이 코드는 **현재 install 환경에서 실행 자체가 불가능**한 orphan.

ADR-0003 결정으로 Docker = webapp 패키징, SageMaker = YOLO 학습 으로 역할이 명확해진 이상, Keras 라인은 어떤 use case 도 만족하지 않음.

## Decision

**We will delete the Keras skeleton files and the `train/src/data/keras/` package entirely. No Keras code remains in the repo.**

## Alternatives Considered

- **Option A — `archive/` 디렉토리로 이동 후 보존**
  - pros: 히스토리 보존
  - cons: git 자체가 히스토리 — archive 폴더는 중복. 추후 누군가 archive 파일을 import 시도할 위험
  - reject: git 히스토리로 충분
- **Option B — `# DEPRECATED` 주석만 추가하고 보존**
  - pros: 점진적
  - cons: 죽은 코드 잔존, mypy/ruff 가 계속 검사, IDE 검색 노이즈
  - reject: 사용자 명시 결정 ("keras 는 버려")
- **Option C (선택됨) — 완전 삭제, git 히스토리로 복구 보장**
  - pros: 깔끔, 검사 노이즈 0
  - cons: 없음 (히스토리에서 언제든 복구 가능)
  - selected

## Consequences

- **Positive**:
  - 신규 컨트리뷰터가 "왜 keras 가 있지?" 라고 헷갈리지 않음
  - mypy/ruff CI 검사 시간 감소 (작은 양이지만)
  - `infra/` 의 책임이 ADR-0003 와 완벽히 일치 (Docker compose + SageMaker 만 남음)
- **Negative / risks**:
  - `train/src/data/keras/coco_tfds.py` 의 COCO TFDS 변환 로직이 향후 필요해지면 재작성 — 다만 ultralytics 가 자체 COCO 지원이라 가능성 낮음
  - 없음. git 히스토리로 모두 복구 가능
- **Follow-up actions** (실행 가능 — 이 ADR Accepted 후):
  1. 다음 파일 삭제:
     ```
     infra/train_skeleton.py
     infra/train_keras_skeleton.py
     train/src/data/keras/__init__.py
     train/src/data/keras/coco_tfds.py
     train/src/data/keras/__pycache__/    (cache, gitignored 상관없음)
     ```
     → `train/src/data/keras/` 디렉토리 자체도 빈 디렉토리로 남으면 함께 삭제
  2. **검색 검증**: 삭제 후 다음 명령으로 잔존 import 0 확인
     ```bash
     rg -n "from src\.data\.keras|import.*keras|tensorflow" train/ application/ infra/
     ```
  3. **CI 검증**: ruff + mypy strict 가 여전히 통과해야 함 (의존이 없었으므로 통과해야 정상)
  4. **README 패치**: `infra/` 디렉토리 설명에 "Docker (webapp 패키징) + SageMaker (학습)" 만 남기고 Keras 언급 제거

## References

- Related code (삭제 대상):
  - `infra/train_skeleton.py`
  - `infra/train_keras_skeleton.py`
  - `train/src/data/keras/`
- Related docs:
  - `docs/DESIGN.md` §2.2 (Infra 행 "레거시 후보")
  - `docs/architecture/LEGACY_CATALOG.md` §2
- Cookbooks pattern used: 해당 없음
- 의존 ADR: ADR-0003 (Docker 의 역할 변경으로 Keras 가 들어갈 자리가 없어짐)
