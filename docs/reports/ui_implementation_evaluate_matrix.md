---
last_updated: 2026-06-18
status: active
related:
  - docs/DESIGN.md
  - docs/reports/ui_design_audit.md
  - docs/reports/ui_spec_judge_evaluation.md
---

# UI Implementation Evaluate Matrix (post-fix)

Re-evaluation after P1 remediation and P2 token cleanup (2026-06-18).

| Req ID | Spec | Implementation | Status |
|--------|------|----------------|--------|
| FR-UI-1 | Start → camera + 500 ms loop | `useCrowdDetection.start()` | PASS |
| FR-UI-2 | Stop releases resources | `stop()` + dashboard reset | PASS |
| FR-UI-3 | Stop = danger variant | `ControlBar` danger styling | PASS |
| FR-UI-4 | Overlay safe zones | `OverlayLayer` + `layout.videoSafeInsetBottom` | PASS |
| FR-UI-5 | Record/Export/Report/notifications | Implemented 2026-06-18 | PASS |
| FR-UI-6 | "Stop Monitoring" label | `ControlBar` | PASS |
| FR-UI-7 | Session video record | `useSessionRecording` | PASS |
| FR-UI-8 | Dashboard JSON export | `exportLiveSession` | PASS |
| FR-UI-9 | HTML reports | `buildHtmlReport` | PASS |
| FR-UI-10 | Notification dropdown | `TopNav` + `AlertHistoryProvider` | PASS |
| FR-UI-11 | Custom sensor sources | `customSourcesStorage` | PASS |
| FR-UI-12 | Health/Assets/Help/Logout | `SideNav` modals | PASS |
| FR-5 | People count in panel | `StatsSidebar` / `StatCard` | PASS |
| FR-11 | `session_id` on analyze | `useCrowdDetection` | PASS |
| NFR-7 | Token-based styling | `tokens.ts` — P1/P2 hardcodes removed | PASS |
| DR §3.5 | BBox label contrast | `PersonBBox` `onWarning` + scrim | PASS |
| DR §6 | Scrim over video text | `AlertChip`, `PersonBBox` chip | PASS |
| §9.8 | Five-route mobile nav | `BottomNav` Sensors → `/settings` | PASS |

Judge report: [`ui_spec_judge_evaluation.md`](ui_spec_judge_evaluation.md)
