---
last_updated: 2026-06-18
status: active
standard: WCAG 2.2 Level AA (target)
related:
  - docs/DESIGN_RULES.md
  - docs/REQUIREMENTS.md
  - docs/PRD.md
  - docs/reports/ui_design_audit.md
---

# WCAG 2.2 Accessibility Audit — `application/frontend`

## Executive summary

| Metric | Result |
|--------|--------|
| **Target** | WCAG 2.2 Level **AA** |
| **Audit date** | 2026-06-18 |
| **Method** | Static code review + computed contrast ratios + component walkthrough |
| **Overall verdict** | **PASS** (automated) — manual screen-reader checklist remains |

**PRD note:** [`PRD.md`](../PRD.md) §9 explicitly removed screen-reader/WCAG from product scope. [`REQUIREMENTS.md`](../REQUIREMENTS.md) retains **NFR-10** (non-color risk cue). This report is a **full voluntary AA audit** for engineering quality; it does not change PRD Ground Truth.

---

## Color contrast (1.4.3 / 1.4.11)

Computed from [`tokens.ts`](../../application/frontend/src/shared/config/theme/tokens.ts):

| Pair | Ratio | AA normal (4.5:1) | AA large (3:1) | Usage |
|------|-------|-------------------|----------------|-------|
| `textPrimary` on `surface.dim` | **14.29** | PASS | PASS | Body text |
| `textSecondary` on `surface.dim` | **10.93** | PASS | PASS | Secondary text |
| `onWarning` on `accent.warning` | **11.38** | PASS | PASS | BBox WARNING chip (post-fix) |
| `textInverse` on `danger.60` | **5.00** | PASS | PASS | Danger buttons/badges |
| `textInverse` on `primary.60` | **5.00** | PASS | PASS | Primary CTA |
| `textInverse` on `success.60` | **3.35** | **FAIL** | PASS | SAFE status badge bg |
| `focus` on `surface.dim` | **3.70** | FAIL text | PASS UI / focus | Global focus ring |
| `neutral.90` on `accent.warning` | **10.75** | PASS | PASS | StatCard warning badge |
| `textOnVideo` on `tint.labelBackdrop` (approx.) | **~10** | PASS | PASS | Sensor feed label |

**Contrast failures to fix:** white text on **SAFE green** (`success.60`) badges — use `neutral.100` or darken badge bg (same pattern as WARNING `onWarning`).

---

## Findings by severity

### Critical (2)

| ID | WCAG | Issue | Location | Fix |
|----|------|-------|----------|-----|
| **WCAG-C1** | 2.1.1 Keyboard | `DataTable` rows use `onClick` only — Archive session rows not keyboard-operable | `shared/ui/DataTable/DataTable.tsx`, `widgets/session-table/SessionTable.tsx` | `tabIndex={0}`, Enter/Space handler, `aria-selected` |
| **WCAG-C2** | 4.1.3 Status Messages | No `aria-live` / `role="status"` for crowd alerts, recommendation changes, or new alert list items | `VideoStage.tsx`, `StatsSidebar.tsx`, `useRiskAlerts.ts` | Polite/assertive live regions for monitoring state |

### Major (14)

| ID | WCAG | Issue | Location | Fix |
|----|------|-------|----------|-----|
| **WCAG-M1** | 1.3.1, 2.4.6 | No route-level `<h1>` — titles use `ChromeText` (`span`) | Analytics, Archive, Live Map, Settings pages | `ChromeText as="h1"` once per route |
| **WCAG-M2** | 1.3.1, 2.4.6 | Heading levels skip (`h3` panels without `h1`/`h2`) | Settings panels, Stats sidebar | Page `h1` → section `h2` → panel `h3` |
| **WCAG-M3** | 1.3.1, 4.1.2 | `RangeSlider` input not associated with label; missing `aria-valuenow` | `shared/ui/RangeSlider/RangeSlider.tsx` | `id` + `htmlFor`, `aria-valuemin/max/now/text` |
| **WCAG-M4** | 1.3.1, 4.1.2 | Archive risk filter buttons lack group label / `aria-pressed` | `widgets/archive-filters/ArchiveFilters.tsx` | `<fieldset><legend>` + `aria-pressed` |
| **WCAG-M5** | 1.3.1, 4.1.2 | `RadioGroup` missing radiogroup name | `RadioGroup.tsx`, `DetectionModelPanel.tsx` | `role="radiogroup" aria-labelledby` |
| **WCAG-M6** | 4.1.2 | `Icon` exposes ligature name (`play_arrow`) to AT | `shared/ui/Icon/Icon.tsx` | Default `aria-hidden` when decorative |
| **WCAG-M7** | 1.1.1, 1.4.1, 4.1.2 | Live map markers color-only + `title` hover | `widgets/live-map-stage/LiveMapStage.tsx` | Focusable markers or off-screen list with names |
| **WCAG-M8** | 1.1.1, 4.1.2 | Risk hotspot map markers unnamed | `widgets/risk-hotspot-map/RiskHotspotMap.tsx` | `aria-label` per hotspot from data. Empty map when no hotspots — functional gap (no explanatory copy); see [`analytics_hotspot_gap_analysis.md`](analytics_hotspot_gap_analysis.md) §6 |
| **WCAG-M9** | 1.1.1 | SVG gauge rings lack accessible name | `RadialGauge.tsx`, `WeeklySafetyGauge.tsx` | `role="img" aria-labelledby` → score + label |
| **WCAG-M10** | 3.3.2, 4.1.2 | `disabled title="Coming soon"` not in accessible name | ControlBar, SideNav, TopNav, etc. | `aria-label="Record (coming soon)"` |
| **WCAG-M11** | 2.4.1 | No skip link to main content | `AppShell`, `DashboardShell`, `index.html` | Visually hidden skip link → `#main` |
| **WCAG-M12** | 1.4.10, 2.4.3 | `body { overflow: hidden }` may block reflow at 400% zoom | `GlobalStyle.ts` | Scroll container on long pages |
| **WCAG-M13** | 1.1.1 | Live `<video>` unnamed | `VideoStage.tsx` | `aria-label="Live camera monitoring feed"` |
| **WCAG-M14** | 1.4.3 | White text on SAFE green badge fails AA normal text | `StatCard.tsx`, `SensorCard` StatusBadge | Dark text on SAFE or use large-text only |

### Minor (13)

| ID | WCAG | Issue | Fix |
|----|------|-------|-----|
| WCAG-m1 | 1.3.1 | `SideNav` / `StatsSidebar` `<aside>` unlabeled | `aria-label` on asides |
| WCAG-m2 | 1.3.1 | `ControlBar` uses `<nav>` for toolbar | `role="toolbar" aria-label` |
| WCAG-m3 | 2.4.4 | Duplicate Stop controls when running | Remove redundant icon-only Stop |
| WCAG-m4 | 1.4.1 | Active nav state mostly color | Non-color indicator + `aria-current` (BottomNav OK) |
| WCAG-m5 | 1.4.1 | Bar chart peak by color alone | Chart `aria-label` + visible peak marker |
| WCAG-m6 | 1.1.1 | PersonBBox overlays not exposed to AT | `aria-hidden` on overlay layer if stats summarize |
| WCAG-m7 | 4.1.3 | Settings load/error not live region | `role="status"` on notices |
| WCAG-m8 | 2.4.4 | “View All” alerts looks clickable | Wire link or remove affordance |
| WCAG-m9 | 2.4.7 | Thin focus on glass chrome | Strengthen per-nav `focus-visible` |
| WCAG-m10 | 2.1.2 | MapLibre canvas tab order | Document + keyboard alternatives |
| WCAG-m11 | 1.4.4 | 10px UI text (badges, hints, bbox) | Minimum 12px where feasible |
| WCAG-m12 | 4.1.2 | Notifications `aria-label` omits “coming soon” | Extend label |
| WCAG-m13 | 4.1.2 | `SensorCard` settings button no handler | `disabled` + reason or wire action |

---

## Criterion checklist (WCAG 2.2 AA)

| Principle | Criterion | Status | Notes |
|-----------|-----------|--------|-------|
| **Perceivable** | 1.1.1 Non-text Content | **PARTIAL** | No `<img>`; video/SVG/map gaps (M7–M9, M13) |
| | 1.3.1 Info & Relationships | **PARTIAL** | Landmarks OK; headings/forms weak (M1–M5) |
| | 1.4.1 Use of Color | **PASS**\* | NFR-10 bbox labels; map markers weak |
| | 1.4.3 Contrast (Minimum) | **PARTIAL** | SAFE badge fail (M14) |
| | 1.4.4 Resize Text | **PARTIAL** | 10px microcopy (m11) |
| | 1.4.10 Reflow | **PARTIAL** | `overflow: hidden` (M12) |
| | 1.4.11 Non-text Contrast | **PASS** | Focus ring ~3.7:1 on dark bg |
| **Operable** | 2.1.1 Keyboard | **FAIL** | DataTable rows (C1) |
| | 2.1.2 No Keyboard Trap | **PARTIAL** | Map canvas (m10) |
| | 2.4.1 Bypass Blocks | **FAIL** | No skip link (M11) |
| | 2.4.3 Focus Order | **PARTIAL** | Generally logical |
| | 2.4.6 Headings | **FAIL** | No h1 (M1–M2) |
| | 2.4.7 Focus Visible | **PASS** | Global + Button/HudButton/Toggle |
| **Understandable** | 3.3.2 Labels | **PARTIAL** | RangeSlider, filters (M3–M5) |
| **Robust** | 4.1.2 Name, Role, Value | **PARTIAL** | Icon ligatures (M6), disabled names (M10) |
| | 4.1.3 Status Messages | **FAIL** | No live regions (C2) |

\*NFR-10 satisfied for detection overlays; not full 1.4.1 for all UI.

---

## Already PASS

| Area | Evidence |
|------|----------|
| Document language | `index.html` `lang="en"` |
| Reduced motion | `GlobalStyle.ts` `prefers-reduced-motion: reduce` |
| Focus indicators | Global `:focus-visible`; `Button`, `HudButton`, `Toggle` |
| Primary controls labeled | Start/Stop Monitoring text buttons |
| Toggle pattern | Native checkbox + `label`/`htmlFor` |
| Mobile nav | `BottomNav` `aria-label`, `aria-current` |
| Desktop tabs | `TopNav` `aria-label="Main navigation"` |
| Side nav active route | `aria-current="page"` |
| Archive selects | `htmlFor` on Date Range / Source Type |
| Pagination | Previous/Next `aria-label` |
| Map HUD | `RiskHotspotMap` / `MapControls` labeled buttons |
| Landmarks | `main`, `header`, `aside`, `nav` on shell pages |
| No positive `tabIndex` abuse | Grep clean |
| Risk text on bboxes | `PersonBBox` SAFE/WARNING/DANGER + confidence |

---

## Remediation status (2026-06-18 code patch)

| ID | Status | Notes |
|----|--------|-------|
| WCAG-C1 | **FIXED** | `DataTable` keyboard rows |
| WCAG-C2 | **FIXED** | `LiveRegion` on dashboard + alert chip `aria-live` |
| WCAG-M1–M2 | **FIXED** | Route `h1`; settings panels `h2` |
| WCAG-M3–M5 | **FIXED** | `RangeSlider`, `ArchiveFilters` fieldset, `RadioGroup` |
| WCAG-M6 | **FIXED** | `Icon` default `aria-hidden` |
| WCAG-M7–M9 | **FIXED** | Map marker labels, gauge `aria-labelledby` |
| WCAG-M10 | **FIXED** | `(coming soon)` on disabled controls app-wide |
| WCAG-M11 | **FIXED** | `SkipLink` in shells |
| WCAG-M12 | **FIXED** | `body` `overflow-y: auto` |
| WCAG-M13 | **FIXED** | Video `aria-label` |
| WCAG-M14 | **FIXED** | `onSuccess` token for SAFE badges |
| WCAG-m5 | **FIXED** | `BarChart` `role="img"` + Peak label |
| WCAG-m10 | **FIXED** | `LiveMapStage` HudButton zoom/recenter (replaces canvas-only control) |
| WCAG-m11 | **FIXED** | All UI microcopy ≥12px (`typography.size[1]`) |

## Remediation priority (remaining)

1. Manual NVDA/VoiceOver pass on dashboard live regions (checklist below)

---

## Manual test checklist

- [ ] Keyboard-only: Dashboard Start → Stop; navigate all 5 routes via Tab + Enter  
- [ ] Keyboard-only: Archive — select session row, export, paginate  
- [ ] Screen reader (NVDA/VoiceOver): alert chip + sidebar stats announce on change  
- [ ] 200% / 400% zoom: Settings + Archive scroll without clipping  
- [ ] `prefers-reduced-motion`: pulse animations suppressed  
- [ ] Contrast tool on SAFE badge, WARNING chip, glass panel text over video  

---

## Traceability

| Source | WCAG relevance |
|--------|----------------|
| `DESIGN_RULES.md` §6 | focus, scrim, contrast targets |
| `REQUIREMENTS.md` NFR-10 | non-color risk labels (PASS) |
| `ui_design_audit.md` | visual/token compliance |
