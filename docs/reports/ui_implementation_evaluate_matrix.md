---
last_updated: 2026-06-17
related:
  - docs/REQUIREMENTS.md
  - docs/DESIGN.md
  - docs/reports/ui_spec_judge_evaluation.md
---

# UI Implementation Evaluate Matrix (Post-Fix)

Re-evaluation after FR-UI code and layout changes (2026-06-17).

| Req ID | Spec | Implementation | Status |
|--------|------|----------------|--------|
| FR-UI-1 | Start → camera + 500 ms loop + reset alerts | `useCrowdDetection.start()`, `handleStart` | **PASS** |
| FR-UI-2 | Stop releases camera, interval, stats | `stop()`, `handleStop` | **PASS** |
| FR-UI-3 | Stop controls use `danger` variant | `ControlBar.tsx` primary + icon | **PASS** |
| FR-UI-4 | Overlays within safe zones | `layout.videoSafeInsetBottom`, `OverlayLayer` padding | **PASS** |
| FR-UI-5 | Placeholders disabled with tooltip | Record/Export/Analytics/Generate Report | **PASS** |
| FR-UI-6 | Label "Stop Monitoring" (not Pause) | `ControlBar.tsx` | **PASS** |
| FR-4 | Color-coded bboxes | `PersonBBox` + risk tokens | **PASS** |
| FR-5 | People count in stats panel | `StatsSidebar` People Count card | **PASS** |
| FR-11 | `session_id` on analyze-frame | Not wired in frontend | **GAP** (Should, deferred) |
| NFR-2 | 500 ms capture interval | `useCrowdDetection` default `intervalMs=500` | **PASS** |
| NFR-7 | Token-based layout styling | `tokens.layout.controlBarHeight`, etc. | **PASS** |

## Manual verification checklist

- [ ] Click **Start Monitoring** → camera on, stats populate within ~1 s
- [ ] Bounding boxes visible and not hidden behind control bar
- [ ] Alert chip visible above sidebar zone (desktop) / below header (mobile)
- [ ] Click **Stop Monitoring** or Stop icon → camera off, stats cleared
- [ ] Record/Export buttons remain disabled

## CI

- `npm run build` — required
- `npm run lint` — required
