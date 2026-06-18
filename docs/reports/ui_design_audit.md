---
last_updated: 2026-06-18
status: active
related:
  - docs/DESIGN_RULES.md
  - docs/DESIGN.md
  - docs/REQUIREMENTS.md
  - application/frontend/DESIGN.md
---

# UI/UX Design Audit — `application/frontend`

## Executive summary

Audit date: **2026-06-18**. Ground truth: [`DESIGN_RULES.md`](../DESIGN_RULES.md), [`DESIGN.md`](../DESIGN.md) §9, [`REQUIREMENTS.md`](../REQUIREMENTS.md) FR-UI-1…6, [`application/frontend/DESIGN.md`](../../application/frontend/DESIGN.md).

**Overall:** Dashboard monitoring UX (**PASS**). Multi-page shell (**PASS**). Token discipline (**PASS** — P1/P2 hardcodes remediated; decorative VideoStage textures only).

PRD is **not** edited. PRD §9 removes audio/WCAG; code is text-only alerts (aligned).

---

## Design sources

| Document | Scope |
|----------|--------|
| `DESIGN_RULES.md` | Glass × Y2K tokens, Button/Card/Glass, risk colors, a11y |
| `DESIGN.md` §9 | Dashboard layout, safe zones, control FSM, FSD routing |
| `REQUIREMENTS.md` §2.1 | FR-UI-1…6 EARS |
| `frontend/DESIGN.md` | FSD layers, 5-route shell |
| `user_scenarios.md` | S1–S5 journeys |

Excluded from scoring: `DESIGN.md` §1–8 `<TBD>` placeholders.

---

## Compliance matrix

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| FR-UI-1 | Start → camera + 500 ms loop | **PASS** | `useCrowdDetection.ts`, `ControlBar.tsx` |
| FR-UI-2 | Stop releases resources | **PASS** | `useCrowdDetection.stop()` |
| FR-UI-3 | Stop = danger variant | **PASS** | `ControlBar.tsx` |
| FR-UI-4 | Overlay safe zones | **PASS** | `tokens.layout.*`, `VideoStage` `OverlayLayer` |
| FR-UI-5 | Placeholders disabled | **PASS** | ControlBar Record/Export; SideNav Health/Assets Won't |
| FR-UI-6 | "Stop Monitoring" label | **PASS** | `ControlBar.tsx` |
| DR §3.1 | Button primary/danger/ghost/glass | **PASS** | `Button.tsx` |
| DR §3.2 | Card opaque/glass | **PASS** | `Card.tsx` |
| DR §4 | Risk color semantics | **PASS** | `theme.color.risk`, `getRiskColor.ts` |
| DR §5 | No VideoFeed hardcode | **PASS** | `VideoFeed.tsx` removed |
| DR §6 | focus-visible + reduced motion | **PASS** | `GlobalStyle.ts`, `Button.tsx` |
| DR §6 | Scrim over video text | **PASS** (post-fix) | `VideoStage` AlertChip; `PersonBBox` chip scrim |
| DR §3.5 | BBox label chip | **PASS** (post-fix) | `PersonBBox.tsx` dark text on WARNING |
| §9.8 | Five routes | **PASS** (post-fix) | `AppRouter`; `BottomNav` includes `/settings` |
| NFR-7 | Token-first styling | **PASS** | P1/P2 rgba migrated; judge matrix published |

---

## Per-route walkthrough

| Route | Scenario | Chrome | Status |
|-------|----------|--------|--------|
| `/` | S1 Dashboard | `DashboardShell`, `TopNav`, `StatsSidebar`, `ControlBar` | **PASS** |
| `/analytics` | S4 | `AppShell`, `SideNav`, charts | **PASS** (visual) / **PARTIAL** (RiskHotspotMap semantics — AH-1) |
| `/live-map` | S3 | `LiveMapStage`, GPS legend | **PASS** |
| `/archive` | S2 | Export JSON enabled | **PASS** |
| `/settings` | S5 | Threshold panels | **PASS** (mobile via BottomNav post-fix) |

---

## P1 remediation (2026-06-18)

| ID | Issue | Resolution |
|----|-------|------------|
| P1-1 | BottomNav missing `/settings` | Added Sensors → `/settings` nav item |
| P1-2 | `VideoStage` IconWrap hardcoded rgba | `theme.color.riskTint.*` tokens |
| P1-3 | Duplicate `app-top-nav` widget | Removed unused slice |
| P1-4 | SideNav Health/Assets stubs | Documented as FR-UI-5 Won't placeholders |
| P1-5 | `overlayBorderSubtle` hardcoded in theme | Moved to `tokens.color.overlayBorderSubtle` |
| P1-6 | StatsSidebar scrollbar rgba | `theme.color.scrollbarThumb` token |

---

## P2 remediation (2026-06-18)

| ID | Issue | Resolution |
|----|-------|------------|
| P2-1 | `StatCard` badge rgba | `theme.color.tint.success` / `tint.info` |
| P2-2 | `SensorCard` feed overlay rgba | `tint.scanlineBand`, `tint.labelBackdrop`, `textOnVideo` |
| P2-3 | `RadioGroup` option bg rgba | `theme.color.tint.overlay` |
| P2-4 | Missing judge reports | `ui_spec_judge_evaluation.md`, `ui_implementation_evaluate_matrix.md` |
| P2-5 | `PersonBBox` test coverage | `PersonBBox.test.tsx` WARNING contrast |
| P2-6 | Analytics gauge/map textures | `gaugeTrack`, `texture.*`, `tint.scanlineBand` in gauges + VideoStage |

## Residual backlog

- ~~Full WCAG contrast audit~~ → see [`wcag_audit.md`](wcag_audit.md) (2026-06-18)
- WCAG remediation: 2 Critical, 14 Major (keyboard table, live regions, headings, forms)
- **AH-1** — `RiskHotspotMap`: name/behavior mismatch (session ranking vs geo map), misleading `capacity`, no empty state, no drill-down → [`analytics_hotspot_gap_analysis.md`](analytics_hotspot_gap_analysis.md), [ADR-0011](../decisions/ADR-0011-risk-hotspot-widget-redesign.md)

---

## Manual verification checklist

- [ ] 1280×720: bbox labels do not overlap header/sidebar/control bar
- [ ] Mobile &lt;768px: BottomNav shows 5 routes including Settings
- [ ] Start/Stop cycle: camera + stats clear correctly
- [ ] WARNING bbox label readable on bright video background
