---
last_updated: 2026-04-22
related_code:
  - src/data/preprocessing/
  - src/inference/
  - src/mlops/train_pipeline.py
  - scripts/train_yolo.py
related_diagram:
  - PROJECTS/sysml/System_Architecture_Documentation.md
---

# System Architecture Documentation

## 1. Overview
This document reflects the current 4-layer CrowdNav scaffold in the latest feature branch and PR.

Implemented runtime areas:
- Domain layer for annotation and detection value objects
- Preprocessing layer for JRDB-style JSON parsing and YOLO label conversion
- Inference layer for proximity scoring and alert dispatching
- MLOps layer for tracking/training lifecycle scaffolds

The preprocessing layer reads JSON, normalizes raw records into typed domain models, converts bounding boxes to YOLO format, and writes per-image label files with class mapping output. The inference layer accepts normalized bounding boxes, computes proximity scores, estimates depth proxies, classifies risk states, and routes alerts. The MLOps layer exposes ClearML task setup and training/export pipeline scaffolds.

Separation goals:
- Parsing and format conversion remain in preprocessing modules
- Runtime risk and output routing remain in inference modules
- Experiment tracking and lifecycle orchestration remain in mlops/utils modules
- CI quality gates (ruff + mypy strict) validate Python quality in build workflows

## 2. Block Definition Diagram (BDD)
```mermaid
classDiagram
    class DomainLayer {
      <<package>>
    }

    class PreprocessingLayer {
      <<package>>
    }

    class InferenceLayer {
      <<package>>
    }

    class MLOpsLayer {
      <<package>>
    }

    class PreprocessingCLI {
      +build_parser()
      +convert(input_json, output_dir, image_width, image_height)
      +main()
    }

    class IOUtils {
      +load_json(path)
      +iter_raw_items(data)
      +parse_bbox(raw)
      +parse_record(raw)
    }

    class Converter {
      +to_yolo(bbox, class_id, image_width, image_height)
      +write_yolo_files(records, label_to_id, output_dir, image_width, image_height)
    }

    class BoundingBox {
      +x_min: float
      +y_min: float
      +x_max: float
      +y_max: float
    }

    class AnnotationRecord {
      +image_key: str
      +class_name: str
      +bbox: BoundingBox
    }

    class YoloBox {
      +class_id: int
      +x_center: float
      +y_center: float
      +width: float
      +height: float
    }

    class CollisionThresholds {
      +safe_max: float
      +warning_max: float
      +validate()
    }

    class CollisionAvoidance {
      +thresholds: CollisionThresholds
      +metric: str
      +proximity_score(bbox)
      +evaluate(bbox)
      +evaluate_many(bboxes)
    }

    class DepthEstimator {
      +focal_length: float
      +known_height: float
      +estimate(bbox)
      +normalize(depth)
    }

    class AlertDispatcher {
      +visual_alert(state)
      +audio_alert(state)
      +dispatch(state)
    }

    class AlertState {
      +SAFE
      +WARNING
      +DANGER
    }

    class MockYOLOGenerator {
      +__iter__()
      +__next__()
    }

    class ClearMLTaskInfo {
      +project_name: str
      +task_name: str
      +task_id: Optional[str]
    }

    class ClearMLSetup {
      +init_clearml_task(...): ClearMLTaskInfo
      +log_hyperparams(params)
      +log_metric(name, value, step)
    }

    class TrainPipeline {
      +model_cfg: str
      +data_yaml: str
      +epochs: int
      +imgsz: int
      +train()
      +validate()
      +export(fmt)
    }

    class ClearMLSmokeTest {
      +main()
    }

    class TrainSkeleton {
      +train_model()
    }

    AnnotationRecord *-- BoundingBox : composition
    Converter ..> YoloBox : creates
    IOUtils ..> AnnotationRecord : creates
    IOUtils ..> BoundingBox : creates
    PreprocessingCLI ..> IOUtils : uses
    PreprocessingCLI ..> Converter : uses
    DomainLayer .. PreprocessingLayer : shared types

    CollisionAvoidance *-- CollisionThresholds : composition
    CollisionAvoidance ..> AlertState : returns state
    CollisionAvoidance ..> DepthEstimator : optional depth proxy input
    AlertDispatcher ..> AlertState : dispatch by state
    MockYOLOGenerator ..> CollisionAvoidance : uses _clamp01
    InferenceLayer ..> DomainLayer : consumes bbox semantics

    AlertState --|> Enum : generalization
    AlertState --|> str : generalization
    MockYOLOGenerator --|> Iterator : generalization

    ClearMLSmokeTest ..> ClearMLSetup : calls init_clearml_task
    ClearMLSetup ..> ClearMLTaskInfo : returns
    TrainPipeline ..> ClearMLSetup : logs params and metrics
    MLOpsLayer ..> InferenceLayer : provides artifacts for edge runtime
    TrainSkeleton ..> ClearMLSetup : same ClearML task pattern (Task.init/task.connect)

    DomainLayer .. BoundingBox
    DomainLayer .. AnnotationRecord
    DomainLayer .. YoloBox
    PreprocessingLayer .. PreprocessingCLI
    PreprocessingLayer .. IOUtils
    PreprocessingLayer .. Converter
    InferenceLayer .. CollisionThresholds
    InferenceLayer .. CollisionAvoidance
    InferenceLayer .. DepthEstimator
    InferenceLayer .. AlertDispatcher
    InferenceLayer .. AlertState
    MLOpsLayer .. ClearMLTaskInfo
    MLOpsLayer .. ClearMLSetup
    MLOpsLayer .. TrainPipeline
    MLOpsLayer .. MockYOLOGenerator
```

## 3. Internal Block Diagram (IBD)
```mermaid
flowchart LR
    subgraph DomainLayer
      DTypes[types.py\nBoundingBox/AnnotationRecord/YoloBox]
    end

    subgraph PreprocessingSubsystem
      CLI[cli.py\nconvert/main]
      IO[io_utils.py\nload_json/parse_record]
      Conv[converter.py\nto_yolo/write_yolo_files]
      Out[(YOLO label files\n+ classes.txt)]
    end

    subgraph InferenceSubsystem
      IMain[collision_avoidance.py\nmain]
      Thresholds[CollisionThresholds]
      Evaluator[CollisionAvoidance]
      Depth[depth_estimator.py\nDepthEstimator]
      Dispatcher[alert_dispatcher.py\nAlertDispatcher]
      Generator[MockYOLOGenerator]
      Result[(AlertState + score)]
    end

    subgraph MLOpsSubsystem
      Smoke[clearml_smoketest.py\nmain]
      Setup[utils/clearml_setup.py\ninit_clearml_task]
      Pipeline[mlops/train_pipeline.py\nTrainPipeline]
      MockGen[mlops/mock_generator.py\nMockYOLOGenerator export]
      Train[deploy/train_skeleton.py\ntrain_model]
      ClearML[(ClearML Task/Logger)]
      ModelOut[(Saved model artifact)]
    end

    subgraph CIQualityGate
      Build[build-check.yml]
      Ruff[ruff check src]
      Mypy[mypy --strict src]
    end

    CLI -->|input_json path| IO
    IO -->|AnnotationRecord stream| CLI
    CLI -->|records + class map| Conv
    Conv -->|YoloBox lines| Out
    DTypes -. shared domain types .- IO
    DTypes -. shared domain types .- Conv
    DTypes -. shared domain types .- Evaluator
    DTypes -. shared domain types .- Depth

    IMain --> Thresholds
    IMain --> Evaluator
    IMain --> Depth
    IMain --> Dispatcher
    IMain --> Generator
    Generator -->|bbox tuple stream| IMain
    IMain -->|evaluate / proximity_score| Evaluator
    Evaluator --> Result
    Result --> Dispatcher

    Smoke --> Setup
    Pipeline --> Setup
    Train --> ClearML
    Smoke --> ClearML
    Pipeline --> ClearML
    Pipeline --> ModelOut
    MockGen --> IMain
    Train --> ModelOut
    Setup --> ClearML

    Build --> Ruff
    Build --> Mypy
```

## 4. Sequence Diagram
```mermaid
sequenceDiagram
    participant User as preprocessing.cli.main
    participant CLI as convert()
    participant IO as io_utils
    participant Conv as converter
    participant FS as filesystem

    User->>CLI: parse args and call convert(...)
    CLI->>IO: load_json(input_json)
    IO-->>CLI: data
    CLI->>IO: iter_raw_items(data)
    loop each raw item
      CLI->>IO: parse_record(raw)
      IO->>IO: parse_bbox(raw)
      IO-->>CLI: AnnotationRecord
    end
    CLI->>Conv: write_yolo_files(record_stream, label_to_id, output_dir, w, h)
    loop each record
      Conv->>Conv: to_yolo(record.bbox, class_id, w, h)
      Conv-->>Conv: YoloBox
    end
    Conv->>FS: write *.txt label files
    CLI->>FS: write classes.txt
    FS-->>User: conversion artifacts saved
```

  ### Inference Runtime Sequence
  ```mermaid
  sequenceDiagram
    participant Cam as Edge Camera Frame
    participant Yolo as YOLOv8 Inference
    participant Depth as DepthEstimator
    participant Eval as CollisionAvoidance
    participant Alert as AlertDispatcher
    participant Log as Local Logger

    Cam->>Yolo: frame tensor
    Yolo-->>Eval: bbox list + confidence
    Eval->>Eval: confidence filter + proximity_score
    Eval->>Depth: estimate(bbox)
    Depth-->>Eval: normalized depth proxy
    Eval-->>Alert: AlertState (SAFE/WARNING/DANGER)
    Alert->>Alert: visual_alert / audio_alert
    Alert-->>Log: alert + frame stats
  ```

  ### Training and Export Sequence
  ```mermaid
  sequenceDiagram
    participant Prep as PreprocessingCLI
    participant Data as YOLO labels/data.yaml
    participant TP as TrainPipeline
    participant CM as ClearMLSetup
    participant Art as Model Artifacts

    Prep->>Data: convert JRDB JSON to labels
    TP->>CM: init_clearml_task()
    TP->>CM: log_hyperparams()
    loop epoch
      TP->>CM: log_metric(mAP50/val_loss)
    end
    TP->>TP: validate()
    TP->>Art: export(onnx/ncnn)
  ```

## 5. Notes & Assumptions
- Default branch for PRs is `main`; integration work may use `dev` (at time of last update).
- Diagram structure reflects current scaffold state: class-level interfaces may still raise `NotImplementedError` by design.
- `ruff check` passes; `mypy --strict` is integrated into CI and requires code-level type cleanup to pass consistently.
- External services (ClearML server/runtime dependencies) are modeled as external artifacts, not internal blocks.

## 6. Additional Updates Needed
- Replace remaining scaffold-only notes as modules become fully implemented.
- Add an explicit API contract diagram once frontend/backend interfaces are finalized.
- Add deployment view for Docker compose runtime under `deploy/`.
- Add metric lineage mapping between training logs and exported model artifacts.

## Review Request Guide
- List the exact diagrams updated (BDD, IBD, sequence).
- Link affected code modules for each diagram change.
- State if a diagram block is speculative or implemented.
- Confirm that naming in diagrams matches module/class names in code.
