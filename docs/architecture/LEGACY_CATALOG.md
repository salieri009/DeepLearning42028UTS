---
last_updated: 2026-05-05
status: 1차 카탈로그 (자동 생성, 결정은 미완료)
related_code:
  - PROJECTS/CrowdNav/
  - train/src/
  - infra/
related_diagram:
  - docs/architecture/REPO_LAYOUT_AND_FUTURE_DEVELOPMENT.md
related_design_doc:
  - docs/DESIGN.md
related_skill:
  - docs/skills/crowdnav-design/SKILL.md
---

# Legacy Catalog — 잔존 코드·아티팩트 정리 후보

> 이 문서는 **카탈로그**일 뿐. 실제 이동·삭제는 **각 항목별 ADR 통과 후** 진행.
> 룰은 [`docs/skills/crowdnav-design/SKILL.md`](../skills/crowdnav-design/SKILL.md) §5 참조.

---

## 1. PROJECTS/CrowdNav/ — 옛 monolith 잔존

`docs/architecture/REPO_LAYOUT_AND_FUTURE_DEVELOPMENT.md` 에 *gitignored* 라고 명시되어 있으나
로컬 working tree 에 다음 잔존:

### 1.1 모델 가중치 (~193 MB)
| 파일 | 크기 | provenance | 권장 처리 |
|---|---|---|---|
| `PROJECTS/CrowdNav/yolo26n.pt` | 5.3 MB | **unknown** — 표준 yolov8 라인업이 아님 (`26` 표기 의심) | 제공자 확인 → 불명 시 archive 후 삭제 |
| `PROJECTS/CrowdNav/yolov8m.pt` | 50 MB | unknown — 미세조정본인지 stock 인지 불명 | hash 비교로 stock 여부 판별 후 결정 |
| `PROJECTS/CrowdNav/yolov8n.pt` | 6.3 MB | repo root 의 `yolov8n.pt` 와 중복 가능성 | hash 비교 후 중복이면 삭제 |
| `PROJECTS/CrowdNav/yolov8x.pt` | 131 MB | unknown — 추론용으로만 쓰는 stock 으로 추정 | Git LFS or 외부 스토리지 이전 |

→ 후보 ADR: **ADR-0006-legacy-weights-handling.md**

### 1.2 데이터 파일
| 경로 | 카운트 | 권장 처리 |
|---|---|---|
| `PROJECTS/CrowdNav/data/processed/auto_labels_08/` | **446,410개** YOLO label `.txt` | bytes-cafe 시퀀스 정답라벨 — `data/processed/labels_gt/` 와 중복 여부 검증 후 결정 |
| `PROJECTS/CrowdNav/data/raw/*.jpg` | (수십개) | repo-root `data/raw/` 와 중복 여부 검증 |

→ 후보 ADR: **ADR-0007-legacy-dataset-merge.md**

### 1.3 코드·로그
| 파일 | 상태 | 권장 처리 |
|---|---|---|
| `PROJECTS/CrowdNav/scratch/test_track.py` | YOLOv8 트래킹 5장 샘플 테스트 (~500B) | `train/notebooks/` 로 이전하거나 폐기 |
| `PROJECTS/CrowdNav/scratch/self_train_logs/cycle_00.*` | self-training cycle 0 메타데이터만 존재 | `runs/` 로 이전 또는 archive |
| `PROJECTS/CrowdNav/.dvc/tmp/*` | DVC lock·updater 잔존물 | DVC 정책 결정 후 일괄 정리 |
| `PROJECTS/CrowdNav/.env` | **ClearML 5개 키 평문** (CLEARML_WEB_HOST, API_HOST, FILES_HOST, ACCESS_KEY, SECRET_KEY) | **즉시 검토 필요** — git 히스토리 노출 여부 확인, 키 rotate 권장 |
| `PROJECTS/CrowdNav/backend/` | 빈 디렉토리 placeholder | 즉시 삭제 후보 (영향 없음) |

→ 후보 ADR: **ADR-0008-secret-rotation-and-cleanup.md** ⚠️ 보안 결정

---

## 2. infra/ — Keras 스켈레톤 잔존

**Status: Resolved (ADR-0009, 2026-05-05)** — `infra/train_skeleton.py`, `infra/train_keras_skeleton.py`, and `train/src/data/keras/` were deleted. `infra/` now contains only Docker compose wrapper + SageMaker training glue.

| File | Former content | Resolution |
|---|---|---|
| ~~`infra/train_skeleton.py`~~ | Keras placeholder | Deleted |
| ~~`infra/train_keras_skeleton.py`~~ | COCO → Keras detector | Deleted |

→ [ADR-0009](../decisions/ADR-0009-keras-skeleton-removal.md)

---

## 3. train/ 내부의 sys.path 핵 (잔존 import 우회)

W1 분석에서 발견:

```python
# train/scripts/train_yolo.py, self_train_loop.py, automate_preprocessing.py, run_auto_labeling.py
sys.path.insert(0, str(PROJECT_ROOT))
```

→ 패키지 경로 정리 (`pyproject.toml` 의 `[tool.setuptools.packages.find]` 또는 editable install) 후 제거 가능.

또한 `train/src/data/prepare/pseudo_label.py` 가 backward-compat 목적으로 `pseudo_label_yolov8.main()` 을 그대로 위임하고 있음 — 둘 중 하나만 남기는 결정 필요.

→ 후보 ADR: **ADR-0010-train-import-path-cleanup.md**

---

## 4. application/ — 단절된 통합

W2·W3 종합 결과:

- `application.yml` 의 `app.inference.mode` 기본값은 **`remote`** (mock 은 테스트 전용)
- `RemoteAnalyzeFrameService` **구현 완료** — `RestClient`(HTTP/1.1)로 FastAPI inference 호출
- `application/inference-service/main.py` 의 `/internal/infer` **구현 완료** — YOLOv8 detection + proximity heuristics
- 프런트엔드는 Docker 배포 시 **nginx 가 `/api/` 를 백엔드로 프록시** (동일 출처)

> **Update (2026-06):** 위 W2·W3 시점의 "incomplete integration" 은 **해소됨**. 전체 체인
> (React → Spring → FastAPI/YOLO)이 end-to-end 로 동작하며 `docker compose up --build` 로 검증됨.
> 설계는 ADR-0002 로 확정 (DESIGN.md §4.1).

---

## 5. 우선순위 매트릭스 (제안)

| ID | 항목 | 영향 범위 | 위험 | 우선순위 |
|---|---|---|---|---|
| 1 | `.env` ClearML 키 노출 검토 | 보안 | **높음** | 🔴 즉시 |
| 2 | `auto_labels_08` 446K 라벨 운명 | 학습 정확도 | 중 | 🟠 빠르게 |
| 3 | yolo26n.pt provenance | 평가 신뢰도 | 중 | 🟠 빠르게 |
| 4 | infra/ Keras 스켈레톤 폐기 | CI 단순화 | 낮 | ✅ Done (ADR-0009) |
| 5 | sys.path 핵 정리 | DX | 낮 | ✅ Done (ADR-0010) |
| 6 | 빈 `backend/` 폴더 삭제 | 무영향 | 낮 | 🟢 즉시 가능 |

---

## 6. 다음 액션

1. **🔴 #1 즉시**: `.env` 가 git 히스토리에 들어간 적 있는지 검사 → 그렇다면 키 rotate. 사용자 결정 필요.
2. **🟠 #2, #3**: `auto_labels_08` 와 `yolo26n.pt` 의 hash·내용 비교 분석 (별도 워커 dispatch 필요)
3. **🟢 #6**: 빈 `PROJECTS/CrowdNav/backend/` 즉시 정리 가능 — 그래도 ADR 한 줄로 기록 (SKILL.md §5 룰)
4. ADR 0002, 0006~0010 골격 생성 → DESIGN.md §4 와 sync

---

## 7. 변경 이력

| 날짜 | 변경 | 작성자 |
|---|---|---|
| 2026-05-05 | 5개 워커 병렬 분석 결과 1차 카탈로그 | Claude (Cowork mode) |
