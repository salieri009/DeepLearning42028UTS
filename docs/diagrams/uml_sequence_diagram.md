# UML Sequence Diagrams — CrowdNav System

Two scenarios are modelled:
1. **Primary Flow** — live frame analysis (current implementation)
2. **Concept-Level Flow** — with depth estimation and hardware alert output (planned)

---

## Sequence 1 — Live Frame Analysis (Current Implementation)

```mermaid
sequenceDiagram
    autonumber

    actor User as Wheelchair User
    participant Browser as Browser<br/>(React App)
    participant Camera as Device Camera<br/>(MediaStream API)
    participant VideoFeed as VideoFeed<br/>Component
    participant StatPanel as StatPanel<br/>Component
    participant API as ApiClient<br/>(axios)
    participant Controller as AnalyzeFrameController<br/>(Spring Boot :8080)
    participant Service as RemoteAnalyzeFrameService<br/>(Spring Boot)
    participant Inference as FastAPI Inference<br/>(:9000)
    participant YOLO as YOLOv8 Model<br/>(best.pt)
    participant CA as CollisionAvoidance<br/>(Python)

    User->>Browser: Click "Start"
    Browser->>Camera: getUserMedia({ video: true })
    Camera-->>Browser: MediaStream (live feed)
    Browser->>VideoFeed: Stream video to <video> element

    loop Every 500 ms (capture interval)
        Browser->>Browser: captureFrame()<br/>canvas.drawImage(video) → toDataURL() → base64

        Browser->>API: analyzeFrame(frameBase64)
        API->>+Controller: POST /api/v1/analyze-frame<br/>{ "frame_base64": "..." }

        Controller->>Controller: Validate request (frame_base64 not null)
        Controller->>+Service: analyzeFrame(frameBase64)

        Service->>+Inference: POST /internal/infer<br/>{ "frame_base64": "..." }

        Inference->>Inference: base64_decode → cv2 image (HxW)
        Inference->>+YOLO: model(image, conf=0.35, classes=[0])
        YOLO-->>-Inference: YOLO Results<br/>(boxes, confs, cls)

        loop For each detected person
            Inference->>Inference: Normalise box coords<br/>(x_center, y_center, w, h)
            Inference->>CA: evaluate(bbox)
            CA->>CA: norm_height = (y2-y1) / frame_h<br/>score → AlertState
            CA-->>Inference: AlertState (SAFE/WARNING/DANGER)
        end

        Inference->>CA: evaluate_many(all_bboxes)
        CA-->>Inference: max_risk (worst AlertState)
        Inference->>Inference: _crowd_density(persons, max_risk)<br/>_recommendation(max_risk)

        Inference-->>-Service: 200 OK<br/>{ persons, crowd_density,<br/>  max_proximity_risk, recommendation }

        Service-->>-Controller: AnalyzeFrameResponseJava
        Controller-->>-API: 200 JSON response

        API-->>Browser: AnalyzeFrameResponse (TypeScript)

        Browser->>VideoFeed: Update bounding box overlay<br/>(colour-coded by proximity_risk)
        Browser->>StatPanel: Update crowd_density,<br/>max_proximity_risk, recommendation

        alt max_proximity_risk == "WARNING"
            Browser->>Browser: triggerAlert()<br/>SpeechSynthesis: "Caution. Pedestrians nearby."<br/>navigator.vibrate([200,100,200])
        else max_proximity_risk == "DANGER"
            Browser->>Browser: triggerAlert()<br/>SpeechSynthesis: "Warning! Crowd detected. Please stop."<br/>navigator.vibrate([200,100,200,100,400])
        end
    end

    User->>Browser: Click "Stop"
    Browser->>Camera: stream.getTracks().forEach(t => t.stop())
    Browser->>Browser: clearInterval(intervalRef)<br/>data = null
```

---

## Sequence 2 — Training Pipeline (MLOps)

```mermaid
sequenceDiagram
    autonumber

    actor DevOps as MLOps Engineer
    participant CLI as train_yolo.py<br/>(CLI Script)
    participant Pipeline as TrainPipeline<br/>(Python)
    participant Device as training_device<br/>(CUDA/CPU resolver)
    participant DVC as DVC<br/>(Data Version Control)
    participant Storage as Remote Storage<br/>(Google Drive / S3)
    participant YOLO as Ultralytics YOLO<br/>(Training Loop)
    participant ClearML as ClearML<br/>(Experiment Tracker)
    participant Artifacts as TrainArtifacts<br/>(best.pt)

    DevOps->>CLI: python train_yolo.py --model yolov8n.pt --data data.yaml
    CLI->>Device: resolve_training_device()
    Device-->>CLI: "cuda:0" or "cpu"

    CLI->>DVC: dvc pull (fetch dataset)
    DVC->>Storage: Download images + labels
    Storage-->>DVC: data/processed/splits/
    DVC-->>CLI: Dataset ready

    CLI->>+Pipeline: TrainPipeline(model, data_yaml, epochs, device, ...)
    Pipeline->>ClearML: init_clearml_task(project, name)
    ClearML-->>Pipeline: Task handle

    Pipeline->>ClearML: log_hyperparams(lr0, epochs, imgsz, ...)

    Pipeline->>+YOLO: model.train(data=data_yaml, epochs=N, imgsz=640, ...)

    loop Each Epoch
        YOLO->>YOLO: Forward pass (detection head)
        YOLO->>YOLO: Compute loss (box + cls + dfl)
        YOLO->>YOLO: Backprop + optimiser step
        YOLO->>Pipeline: Metrics (mAP50, precision, recall, loss)
        Pipeline->>ClearML: log_metric(epoch_metrics)
    end

    YOLO-->>-Pipeline: Training complete<br/>runs/train/<name>/weights/best.pt

    Pipeline->>+YOLO: model.val() → validation metrics
    YOLO-->>-Pipeline: mAP50, mAP50-95

    opt Export requested
        Pipeline->>YOLO: model.export(format="onnx")
        YOLO-->>Pipeline: best.onnx
    end

    Pipeline-->>-CLI: TrainArtifacts(run_dir, best_weights, last_weights)
    CLI->>Artifacts: Copy best.pt → application/models/best.pt
    DevOps->>DevOps: Build & push Docker image<br/>with updated best.pt
```

---

## Sequence 3 — Auto-Labelling Pipeline (Concept-Level Extension)

```mermaid
sequenceDiagram
    autonumber

    actor Annotator as Data Annotator
    participant AutoLabel as AutoLabeler<br/>(Python)
    participant YOLOx as YOLOv8x<br/>(pseudo-label teacher)
    participant Converter as converter.py<br/>(YOLO label writer)
    participant Split as split.py<br/>(dataset splitter)
    participant Storage as data/processed/

    note over Annotator,Storage: Used when new unlabelled frames arrive

    Annotator->>AutoLabel: label_folder(img_dir, conf=0.6)
    AutoLabel->>AutoLabel: discover_image_folders(root)

    loop For each image
        AutoLabel->>+YOLOx: model(image, classes=[0])
        YOLOx-->>-AutoLabel: boxes with confidence ≥ 0.6
        AutoLabel->>Converter: write_yolo_files(records, out_dir)
        Converter->>Storage: Save .txt label file
    end

    AutoLabel-->>Annotator: Summary { n_images, n_boxes, skipped }

    Annotator->>Split: run(processed_dir, ratios=[0.8,0.1,0.1])
    Split->>Split: Group by sequence<br/>(prevent data leakage)
    Split->>Storage: data/processed/splits/{train,val,test}
    Split-->>Annotator: Split manifest
```

---

## Sequence 4 — Concept: Depth-Aware Alert Dispatch (Future)

```mermaid
sequenceDiagram
    autonumber

    participant Inference as FastAPI Inference
    participant YOLO as YOLOv8
    participant Depth as DepthEstimator<br/><<future>>
    participant CA as CollisionAvoidance
    participant Dispatch as AlertDispatcher<br/><<future>>
    participant Speaker as Hardware Speaker<br/><<future>>
    participant Haptic as Haptic Motor<br/><<future>>
    participant Display as Heads-Up Display<br/><<future>>

    note over Depth,Display: Concept-level — not yet implemented

    Inference->>YOLO: run inference
    YOLO-->>Inference: bounding boxes

    loop Per detected person
        Inference->>Depth: estimate(bbox, frame_dims)
        Depth->>Depth: depth = (focal_length × known_height) / bbox_height
        Depth->>Depth: normalize(depth) → [0,1]
        Depth-->>Inference: normalised depth score

        Inference->>CA: evaluate_with_depth(bbox, depth_score)
        CA->>CA: fuse proximity_score + depth_score
        CA-->>Inference: AlertState
    end

    Inference->>CA: evaluate_many(enriched_bboxes)
    CA-->>Inference: max_risk, confidence_map

    Inference->>Dispatch: dispatch(max_risk, persons)

    alt DANGER
        Dispatch->>Speaker: audio_alert("DANGER — Stop immediately")
        Dispatch->>Haptic: vibrate([200,100,200,100,400])
        Dispatch->>Display: overlay_alert(RED, "STOP")
    else WARNING
        Dispatch->>Speaker: audio_alert("WARNING — Pedestrians nearby")
        Dispatch->>Haptic: vibrate([200,100,200])
        Dispatch->>Display: overlay_alert(YELLOW, "CAUTION")
    else SAFE
        Dispatch->>Display: overlay_alert(GREEN, "PROCEED")
    end
```
