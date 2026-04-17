# System Architecture Documentation

## 1. Overview
This system currently has three implemented runtime areas in the latest remote default branch (`origin/master`):
- Data preprocessing pipeline for converting JRDB-style annotations into YOLO label files
- Collision-risk inference simulation pipeline
- ClearML integration for experiment/task tracking (plus a TensorFlow training skeleton)

The preprocessing side reads JSON, normalizes raw records into typed domain models, converts bounding boxes to YOLO format, and writes per-image label files with class mapping output. The inference side generates or accepts normalized bounding boxes, computes a proximity-based risk score, and maps that score to alert states. The ClearML side initializes tasks and logs metadata/metrics for training or smoke testing.

The architecture is split this way to keep concerns separate:
- Parsing/format conversion logic is isolated in preprocessing modules
- Runtime risk logic is isolated in inference classes
- Experiment tracking is isolated in utility/deploy entry points

## 2. Block Definition Diagram (BDD)
```mermaid
classDiagram
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
      +weights: tuple[float,float,float]
      +proximity_score(bbox)
      +evaluate(bbox)
      +evaluate_many(bboxes)
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

    CollisionAvoidance *-- CollisionThresholds : composition
    CollisionAvoidance ..> AlertState : returns state
    MockYOLOGenerator ..> CollisionAvoidance : uses _clamp01

    AlertState --|> Enum : generalization
    AlertState --|> str : generalization
    MockYOLOGenerator --|> Iterator : generalization

    ClearMLSmokeTest ..> ClearMLSetup : calls init_clearml_task
    ClearMLSetup ..> ClearMLTaskInfo : returns
    TrainSkeleton ..> ClearMLSetup : same ClearML task pattern (Task.init/task.connect)
```

## 3. Internal Block Diagram (IBD)
```mermaid
flowchart LR
    subgraph PreprocessingSubsystem
      CLI[cli.py\nconvert/main]
      IO[io_utils.py\nload_json/parse_record]
      Types[types.py\nBoundingBox/AnnotationRecord/YoloBox]
      Conv[converter.py\nto_yolo/write_yolo_files]
      Out[(YOLO label files\n+ classes.txt)]
    end

    subgraph InferenceSubsystem
      IMain[collision_avoidance.py\nmain]
      Thresholds[CollisionThresholds]
      Evaluator[CollisionAvoidance]
      Generator[MockYOLOGenerator]
      Result[(AlertState + score)]
    end

    subgraph TrackingAndTrainingSubsystem
      Smoke[clearml_smoketest.py\nmain]
      Setup[utils/clearml_setup.py\ninit_clearml_task]
      Train[deploy/train_skeleton.py\ntrain_model]
      ClearML[(ClearML Task/Logger)]
      ModelOut[(Saved model artifact)]
    end

    CLI -->|input_json path| IO
    IO -->|AnnotationRecord stream| CLI
    CLI -->|records + class map| Conv
    Conv -->|YoloBox lines| Out
    Types -. shared domain types .- IO
    Types -. shared domain types .- Conv

    IMain --> Thresholds
    IMain --> Evaluator
    IMain --> Generator
    Generator -->|bbox tuple stream| IMain
    IMain -->|evaluate / proximity_score| Evaluator
    Evaluator --> Result

    Smoke --> Setup
    Train --> ClearML
    Smoke --> ClearML
    Train --> ModelOut
    Setup --> ClearML
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

## 5. Notes & Assumptions
- `needs clarification`: Requested branch was `main`, but remote default branch after latest fetch is `master` and `origin/main` does not exist.
- Diagrams are generated from files in `origin/master` only.
- Some external services/libraries (ClearML server, TensorFlow runtime) are shown as external artifacts, not internal blocks.
