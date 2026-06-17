---
last_updated: 2026-06-17
document_type: requirements
feature: dashboard-button-interactions
---

# spec-judge Evaluation — UI Control Requirements

## Input documents

| Document | Role |
|----------|------|
| `docs/REQUIREMENTS.md` | FR-4, FR-5, NFR-2, NFR-7, NFR-10 |
| `application/frontend/DESIGN.md` | Button variant rules |
| `docs/DESIGN_RULES.md` | Glass layout, hit targets |
| `docs/diagrams/uml_activity_diagram.md` | START/STOP flow |
| `docs/diagrams/uml_sequence_diagram.md` | Click Start/Stop |
| `docs/diagrams/sysml_diagram.md` | UC1 Start, UC4 Stop |

## Scoring (aggregated across sources)

| Criterion | Score / 25 | Notes |
|-----------|------------|-------|
| Completeness | 14 | Start/Stop FSM documented in diagrams; no dedicated FR-UI IDs; session UI missing; layout safe zones unspecified |
| Clarity | 12 | "Start Detection" vs "Start Monitoring"; "Pause" label implies resume but code fully stops |
| Feasibility | 22 | FSD + `useCrowdDetection` align with activity diagram |
| Innovation | 18 | Glass overlay z-index strategy sound; overlap prevention not tokenized |
| **Total** | **66 / 100** | |

## Gaps (action items)

1. **FR-UI-2b** — "Pause Monitoring" label contradicts full-stop behavior
2. **FR-UI-3** — Stop controls use `ghost` instead of `danger`
3. **FR-5** — People count missing from `StatsSidebar`
4. **Layout** — `VideoStage` overlays lack bottom safe zone for control bar
5. **Traceability** — REQUIREMENTS cite legacy `VideoFeed.tsx` / `StatPanel.tsx`
6. **FR-11** — Frontend does not send `session_id` (Should — out of this UI fix scope)
7. **Placeholders** — Record/Export/Analytics disabled (intentional; document in DESIGN)
8. **View All** — Non-interactive label looks clickable

## Winner / synthesis

No competing requirement documents existed. Synthesized **FR-UI-1 … FR-UI-6** added to `docs/REQUIREMENTS.md` §2.1; design captured in `docs/DESIGN.md` §9.
