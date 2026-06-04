# CrowdNav — System Diagrams

All diagrams use **Mermaid** syntax and render natively on GitHub, GitLab, and most Markdown viewers.

| File | Type | Diagrams inside |
|------|------|----------------|
| [uml_class_diagram.md](uml_class_diagram.md) | UML Class Diagram | Full class hierarchy across all 5 layers (Frontend, Backend, Inference, Training, Data Domain) |
| [uml_sequence_diagram.md](uml_sequence_diagram.md) | UML Sequence Diagrams | (1) Live frame analysis, (2) Training pipeline, (3) Auto-labelling, (4) Depth-aware alert dispatch `<<future>>` |
| [uml_activity_diagram.md](uml_activity_diagram.md) | UML Activity Diagrams | (1) Runtime frame analysis, (2) Data prep + training, (3) Adaptive alert workflow `<<future>>` |
| [sysml_diagram.md](sysml_diagram.md) | SysML Diagrams | BDD, IBD, Use Case, State Machine |

## Scope Convention

- **Current** — reflects implemented code in this repository.
- **`<<future>>`** / concept-level — stubs or architectural ideas not yet implemented (`DepthEstimator`, `AlertDispatcher`, hardware layer, auto-brake).

## Quick System Summary

```
Camera → React (base64) → Spring Boot → FastAPI → YOLOv8 → CollisionAvoidance
                                    ↑ mock mode available for dev
FastAPI → JSON response → Spring Boot → React (bbox overlay + stats + speech/vibrate)
```

### Layers

| Layer | Technology | Port |
|-------|-----------|------|
| Frontend | React 19 + TypeScript + Vite | 3000 (dev) / 80 (prod) |
| Backend | Spring Boot 3.5.6 / Java 21 | 8080 |
| Inference | FastAPI + Ultralytics YOLOv8 | 9000 |
| Training | Python + ClearML + DVC | offline |
