# SysML Diagrams — CrowdNav System

Four SysML view types are provided:
1. **Block Definition Diagram (BDD)** — system block hierarchy and properties
2. **Internal Block Diagram (IBD)** — connector/port wiring between blocks
3. **Use Case Diagram** — actors and system use cases
4. **State Machine Diagram** — alert state transitions

---

## SysML Diagram 1 — Block Definition Diagram (BDD)

> Shows the system decomposition into blocks, their value properties, and relationships.
> `<<block>>` stereotypes follow SysML v1.6 notation.

```mermaid
classDiagram
    direction TB

    class CrowdNavSystem {
        <<block>>
        +systemVersion : String = "1.0"
        +targetEnvironment : String = "transport hub"
        +deploymentMode : String = "docker-compose | cloud"
    }

    class FrontendSubsystem {
        <<block>>
        +captureInterval_ms : int = 500
        +alertCooldown_s : int = 5
        +vibrationEnabled : boolean = true
        +speechEnabled : boolean = true
    }

    class BackendSubsystem {
        <<block>>
        +port : int = 8080
        +inferenceMode : String = "remote | mock"
        +corsEnabled : boolean = true
    }

    class InferenceSubsystem {
        <<block>>
        +port : int = 9000
        +modelPath : String = "./best.pt"
        +confThreshold : float = 0.35
        +lazyLoad : boolean = true
    }

    class ProximityRiskEvaluator {
        <<block>>
        +safeMax : float = 0.25
        +warningMax : float = 0.45
        +metric : String = "height | area | hybrid"
        +evaluateOne(bbox) AlertState
        +evaluateMany(bboxes) AlertState
    }

    class DetectionModel {
        <<block>>
        +architecture : String = "YOLOv8n"
        +inputSize : int = 640
        +targetClass : String = "person"
        +trainedEpochs : int
        +mAP50 : float
    }

    class TrainingSubsystem {
        <<block>>
        +framework : String = "Ultralytics"
        +experimentTracker : String = "ClearML"
        +dataVersioning : String = "DVC"
        +device : String = "cuda:0 | cpu"
    }

    class DataPipeline {
        <<block>>
        +sourceDataset : String = "JRDB"
        +format : String = "YOLO"
        +trainRatio : float = 0.80
        +valRatio : float = 0.10
        +testRatio : float = 0.10
    }

    class AlertDispatcher {
        <<block>>
        <<future>>
        +audioEnabled : boolean
        +hapticEnabled : boolean
        +hudEnabled : boolean
        +dispatch(state) void
    }

    class DepthEstimator {
        <<block>>
        <<future>>
        +method : String = "monocular | stereo | LiDAR"
        +focalLength : float
        +knownPersonHeight_m : float = 1.75
        +estimate(bbox) float
    }

    class HardwareLayer {
        <<block>>
        <<future>>
        +platform : String = "Raspberry Pi | Jetson Nano"
        +camera : String = "USB | MIPI CSI"
        +speaker : boolean
        +hapticMotor : boolean
        +hud : boolean
    }

    %% Composition hierarchy
    CrowdNavSystem *-- FrontendSubsystem : contains
    CrowdNavSystem *-- BackendSubsystem : contains
    CrowdNavSystem *-- InferenceSubsystem : contains
    CrowdNavSystem *-- TrainingSubsystem : contains
    CrowdNavSystem *-- DataPipeline : contains

    InferenceSubsystem *-- ProximityRiskEvaluator : contains
    InferenceSubsystem *-- DetectionModel : uses
    InferenceSubsystem ..> AlertDispatcher : planned
    InferenceSubsystem ..> DepthEstimator : planned

    AlertDispatcher ..> HardwareLayer : drives (future)

    TrainingSubsystem --> DataPipeline : reads
    TrainingSubsystem --> DetectionModel : produces
```

---

## SysML Diagram 2 — Internal Block Diagram (IBD)

> Shows how blocks are wired together through ports and connectors at runtime.

```mermaid
flowchart LR
    subgraph CrowdNavSystem ["CrowdNav System (docker-compose)"]

        subgraph FE ["Frontend Subsystem\n(:3000 / :80)"]
            direction TB
            Camera["Camera\nMediaStream"]
            Capture["captureFrame()\nCanvas → base64"]
            Alert["Alert Engine\nSpeech + Vibrate"]
            UI["VideoFeed + StatPanel\nbbox overlay + metrics"]
        end

        subgraph BE ["Backend Subsystem\n(:8080)"]
            direction TB
            Controller["AnalyzeFrameController\nPOST /api/v1/analyze-frame"]
            Strategy{{"Service Strategy\n(mock | remote)"}}
            Mock["MockAnalyzeFrameService"]
            Remote["RemoteAnalyzeFrameService"]
        end

        subgraph INF ["Inference Subsystem\n(:9000)"]
            direction TB
            FastAPI["FastAPI App\nPOST /internal/infer"]
            YOLOModel["YOLOv8 Model\nbest.pt"]
            CA["CollisionAvoidance\nproximity scoring"]
            Depth["DepthEstimator\n<<future>>"]
            Dispatch["AlertDispatcher\n<<future>>"]
        end

        subgraph Training ["Training Subsystem (offline)"]
            direction TB
            Pipeline["TrainPipeline"]
            Tracker["ClearML\nexperiment tracker"]
            DVC_["DVC\ndata versioning"]
        end

        subgraph Storage ["Artifact Storage"]
            ModelFile[("best.pt\n/application/models")]
            Dataset[("JRDB Dataset\n/data/")]
        end
    end

    Camera -->|"live frames"| Capture
    Capture -->|"base64 JPEG"| Controller
    Controller --> Strategy
    Strategy -->|"APP_INFERENCE_MODE=mock"| Mock
    Strategy -->|"APP_INFERENCE_MODE=remote"| Remote
    Mock -->|"fixed JSON"| Controller
    Remote -->|"POST /internal/infer\nbase64"| FastAPI
    FastAPI -->|"decode → Mat"| YOLOModel
    YOLOModel -->|"bboxes + confs"| CA
    CA -->|"AlertState per box"| FastAPI
    CA -.->|"planned"| Depth
    FastAPI -.->|"planned"| Dispatch
    FastAPI -->|"JSON response"| Remote
    Remote -->|"AnalyzeFrameResponse"| Controller
    Controller -->|"JSON 200"| Capture

    Capture -->|"response data"| UI
    Capture -->|"max_proximity_risk"| Alert

    Pipeline -->|"best.pt"| ModelFile
    ModelFile -->|"model.load"| YOLOModel
    Pipeline --> Tracker
    Pipeline --> DVC_
    DVC_ --> Dataset
```

---

## SysML Diagram 3 — Use Case Diagram

```mermaid
flowchart LR
    subgraph Actors
        User(["👤 Wheelchair User"])
        MLOps(["👷 MLOps Engineer"])
        Admin(["🔧 System Admin"])
        ExtSensor(["📡 External Sensor\n<<future>>"])
    end

    subgraph CrowdNavSystem ["CrowdNav System"]
        UC1["Start Live Navigation\n(Camera + Analysis)"]
        UC2["Receive Proximity Alert\n(Audio + Haptic)"]
        UC3["View Crowd Statistics\n(Density + Risk panel)"]
        UC4["Stop Navigation Session"]

        UC5["Upload Training Data\n(DVC push)"]
        UC6["Run Training Pipeline\n(TrainPipeline.train)"]
        UC7["Track Experiment\n(ClearML)"]
        UC8["Deploy Updated Model\n(Docker build + push)"]

        UC9["Configure CORS / Ports"]
        UC10["Switch Inference Mode\n(mock ↔ remote)"]
        UC11["Monitor Health\n(GET /health)"]

        UC12["Depth-Aware Risk Fusion\n<<future>>"]
        UC13["Hardware Alert Dispatch\n<<future>>"]
    end

    User --> UC1
    UC1 --> UC2
    UC1 --> UC3
    User --> UC4

    MLOps --> UC5
    MLOps --> UC6
    UC6 --> UC7
    MLOps --> UC8

    Admin --> UC9
    Admin --> UC10
    Admin --> UC11

    ExtSensor -.->|"planned"| UC12
    UC12 -.->|"extends"| UC2
    UC12 -.->|"extends"| UC13
```

---

## SysML Diagram 4 — State Machine Diagram (Alert State)

> Models the lifecycle of the proximity alert state from the user's perspective,
> plus the concept-level hardware escalation path.

```mermaid
stateDiagram-v2
    [*] --> Idle : System starts

    Idle --> Scanning : User clicks START\ncamera stream active

    state Scanning {
        [*] --> SAFE

        SAFE --> WARNING : proximity_score ≥ 0.25\n(person approaching)
        WARNING --> SAFE : proximity_score < 0.25\n(person retreated)

        WARNING --> DANGER : proximity_score ≥ 0.45\n(imminent collision risk)
        DANGER --> WARNING : proximity_score < 0.45\n(risk reduced)
        DANGER --> SAFE : no persons detected

        state SAFE {
            [*] --> Monitor
            Monitor --> Monitor : capture every 500 ms
        }

        state WARNING {
            [*] --> PlayCaution
            PlayCaution --> Throttle : SpeechSynthesis +\nvibrate([200,100,200])
            Throttle --> Monitor_W : cooldown 5 s
            Monitor_W --> Monitor_W : continue scanning
        }

        state DANGER {
            [*] --> PlayWarning
            PlayWarning --> Throttle_D : SpeechSynthesis +\nvibrate([200,100,200,100,400])
            Throttle_D --> Monitor_D : cooldown 5 s
            Monitor_D --> Monitor_D : continue scanning

            note right of PlayWarning
                Concept: also trigger
                hardware AlertDispatcher
                → Speaker + Haptic motor
                + HUD overlay (future)
            end note
        }
    }

    Scanning --> Idle : User clicks STOP\nstream released

    state "Concept: Hardware Escalation (future)" as HW {
        [*] --> HW_SAFE
        HW_SAFE --> HW_WARN : WARNING state
        HW_WARN --> HW_DANGER : DANGER state
        HW_DANGER --> HW_BRAKING : Persistent DANGER\n> 2 s (auto-brake)
        HW_BRAKING --> HW_DANGER : Risk clears
        HW_DANGER --> HW_WARN : Risk reduces
        HW_WARN --> HW_SAFE : SAFE restored
    }

    Scanning ..> HW : planned integration
```

---

## SysML Diagrams Summary

| Diagram | SysML Type | Primary Audience | Current / Future |
|---------|-----------|-----------------|-----------------|
| BDD | Block Definition Diagram | System architect | Both |
| IBD | Internal Block Diagram | DevOps / integrator | Both |
| Use Case | Use Case Diagram | Stakeholders / PM | Both |
| State Machine | State Machine Diagram | Safety engineer | Both |

### Key SysML Properties Modelled

| Block | Value Properties |
|-------|-----------------|
| `InferenceSubsystem` | `confThreshold=0.35`, `port=9000`, `lazyLoad=true` |
| `ProximityRiskEvaluator` | `safeMax=0.25`, `warningMax=0.45`, `metric="height"` |
| `DetectionModel` | `architecture="YOLOv8n"`, `inputSize=640`, `targetClass="person"` |
| `FrontendSubsystem` | `captureInterval_ms=500`, `alertCooldown_s=5` |
| `TrainingSubsystem` | `framework="Ultralytics"`, `tracker="ClearML"`, `dvc="DVC"` |
| `DepthEstimator` `<<future>>` | `knownPersonHeight_m=1.75`, `method="monocular"` |
| `HardwareLayer` `<<future>>` | `platform="Jetson Nano"`, speaker, hapticMotor, hud |
