---
last_updated: 2026-06-17
related_code:
  - infra/sagemaker/sagemaker_launch.py
  - infra/sagemaker/sagemaker_train.py
  - train/src/training/train_pipeline.py
  - train/scripts/train_yolo.py
  - train/scripts/self_train_loop.py
  - train/src/data/prepare/pseudo_label.py
  - train/src/data/prepare/split.py
related_diagram:
  - docs/architecture/data_pipeline_diagram.md
  - docs/architecture/System_Architecture_Documentation.md
  - docs/architecture/state_alerts.md
related_design_doc:
  - docs/DESIGN.md
related_decisions:
  - docs/decisions/ADR-0003-deployment-split-docker-sagemaker.md
  - docs/decisions/ADR-0010-train-packaging-remove-syspath-hacks.md
---

# Sequence Diagram — 학습 파이프라인 (SageMaker)

> 코드 grep 기반 다이어그램. ADR-0003 (Docker=webapp, SageMaker=training) 결정 후의 *intended* 학습 흐름.
> 출처: `infra/sagemaker/sagemaker_launch.py`, `infra/sagemaker/sagemaker_train.py`, `train/src/training/train_pipeline.py`, `train/scripts/self_train_loop.py`

## 1. 단일 학습 잡 (one-shot train)

가장 일반적인 경우. 사용자가 로컬에서 launcher 를 돌리고, SageMaker 가 클라우드에서 학습 후 `best.pt` 를 S3 로 회수.

```mermaid
sequenceDiagram
    actor Dev as 개발자 (로컬)
    participant LAUNCH as sagemaker_launch.py<br/>(로컬)
    participant S3 as S3 bucket<br/>(crowdnav-jrdb-data)
    participant SM as SageMaker<br/>Training Job
    participant TRAIN as sagemaker_train.py<br/>(컨테이너 안)
    participant TP as TrainPipeline<br/>(crowdnav_train.training)
    participant YOLO as Ultralytics YOLO

    Note over Dev,LAUNCH: 사전 준비: aws configure, IAM role,<br/>data 가 S3 에 업로드됨
    Dev->>LAUNCH: python infra/sagemaker/sagemaker_launch.py<br/>--role ARN --bucket NAME
    LAUNCH->>LAUNCH: repo root 를 source bundle 로 묶음<br/>(.sagemakerignore 적용)
    LAUNCH->>SM: PyTorchEstimator.fit(<br/>entry_point=infra/sagemaker/sagemaker_train.py,<br/>dependencies=infra/sagemaker/requirements.txt,<br/>training=s3://bucket/data)
    SM->>S3: training data 다운로드<br/>→ /opt/ml/input/data/training/

    SM->>TRAIN: python infra/sagemaker/sagemaker_train.py<br/>--data-dir /opt/ml/input/data/training
    TRAIN->>TRAIN: ensure_data_yaml(data_dir)<br/>(기존 yaml path 패치 또는 variant별 생성)
    TRAIN->>TP: TrainPipeline(model_cfg, data_yaml,<br/>epochs, imgsz, batch, device, ...)
    TP->>TP: _resolve_model()<br/>(local .pt? Ultralytics auto-download?)
    TP->>YOLO: model.train(data, epochs, imgsz,<br/>batch, device, project, name, ...)
    YOLO-->>TP: results (save_dir, metrics)
    TP->>TP: TrainArtifacts<br/>(run_dir, best.pt, last.pt)
    TP-->>TRAIN: artifacts

    TRAIN->>TRAIN: cp best.pt last.pt results.csv<br/>→ /opt/ml/model/
    TRAIN-->>SM: exit 0
    SM->>S3: /opt/ml/model/* 업로드<br/>→ s3://bucket/<job>/output/model.tar.gz
    SM-->>LAUNCH: training job complete
    LAUNCH-->>Dev: print artifact location<br/>(S3 URI)

    Note over Dev,S3: ADR-0003 핸드오프:<br/>infra/scripts/fetch_best_pt → application/models/best.pt<br/>→ docker compose up --build
```

## 2. Self-training 다중 사이클 (`self_train_loop.py`)

`train → pseudo-label → split` 한 사이클을 N 회 반복. `--cycles 5` 가 default. 각 사이클의 `best.pt` 가 다음 사이클의 base model 이 됨.

```mermaid
sequenceDiagram
    actor Dev
    participant SCRIPT as self_train_loop.py
    participant TP as TrainPipeline
    participant PL as pseudo_label_api.run()<br/>(crowdnav_train.data.prepare)
    participant SP as split_api.run()
    participant FS as data/processed/<br/>{labels, splits}

    Dev->>SCRIPT: python self_train_loop.py<br/>--cycles 5 --base-model yolov8m.pt
    SCRIPT->>SCRIPT: resolve_training_device()<br/>(CUDA 0 / cpu auto)

    loop 사이클 i = 0..N-1
        Note over SCRIPT,TP: 사이클 i: train
        SCRIPT->>TP: TrainPipeline(model=base_or_prev_best,<br/>epochs, imgsz, ...)
        TP-->>SCRIPT: TrainArtifacts (best.pt path)

        Note over SCRIPT,PL: 사이클 i: pseudo-label
        SCRIPT->>PL: pseudo_label.run(<br/>weights=best.pt,<br/>labels-dir=data/processed/labels)
        PL->>FS: 새 라벨 .txt 작성<br/>(low-conf flag 포함)
        PL-->>SCRIPT: 라벨 카운트, low-conf %

        Note over SCRIPT,SP: 사이클 i: split
        SCRIPT->>SP: split.run(splits-dir=...)
        SP->>FS: train/val/test 파일목록 갱신<br/>(8:1:1 sequence 단위)
        SP-->>SCRIPT: split sizes

        SCRIPT->>SCRIPT: write_cycle_metrics_json(...)<br/>append_cycle_metrics_csv(...)<br/>(scratch/self_train_logs/cycle_NN.json)

        SCRIPT->>SCRIPT: base_model = best.pt<br/>(다음 사이클용)
    end

    SCRIPT-->>Dev: 최종 best.pt 경로,<br/>cycle_metrics.csv 위치
```

## 3. 핵심 contract 요약

| 입력 | 형식 | 출처 |
|---|---|---|
| training data | YOLO 디렉토리 (`train/images/`, `train/labels/`, `data.yaml`) | S3 (SageMaker) / `data/processed/splits/` (로컬) |
| base model | `.pt` checkpoint | Ultralytics 자동 다운로드 또는 직접 지정 |
| hyperparams | argparse CLI | 로컬: `train_yolo.py` / SageMaker: `sagemaker_launch.py` 의 `hyperparameters` |

| 출력 | 위치 (SageMaker) | 위치 (로컬) |
|---|---|---|
| `best.pt`, `last.pt` | `/opt/ml/model/` → S3 자동 업로드 | `runs/train/<name>/weights/` |
| 학습 메트릭 (`results.csv`) | `/opt/ml/model/` | 같은 폴더 |
| 학습 plot (PNG) | `/opt/ml/output/data/` (auxiliary) | `runs/train/<name>/` |

## 4. 미해결 디자인 결정 후보 (이 다이어그램 만들면서 식별)

- **모델 레지스트리**: SageMaker job 의 `best.pt` 를 webapp 에 어떻게 넘길지 — S3 직접 다운로드 vs ClearML model registry vs MLflow?
  → 후보 ADR: `ADR-0013-model-registry-handoff.md`
- **사이클 metric 위치**: 현재 `cycle_metrics.csv` 가 `scratch/self_train_logs/` 에 저장 (PROJECTS/CrowdNav 잔재 가능성). `runs/` 또는 ClearML 으로 일원화 필요
  → ADR-0004 (ClearML 정책) 와 묶어서 결정
- **ClearML 기록 시점**: 현재 `clearml_setup` 은 utils 에 분리. `TrainPipeline.train()` 안에서 자동 기록 vs 호출자가 명시적으로 기록?
  → ADR-0004 와 결합

## 5. 변경 이력

| 날짜 | 변경 | 작성자 |
|---|---|---|
| 2026-05-05 | 코드 grep 기반 1차 작성 (sagemaker_launch + sagemaker_train + TrainPipeline + self_train_loop) | Claude (Cowork mode) |
