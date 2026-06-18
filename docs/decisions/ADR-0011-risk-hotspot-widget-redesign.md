# ADR-0011: Risk Hotspot Map widget — rename/reshape vs real geo hotspot map

- **Status**: Accepted (Option B — geo hotspot map, 2026-06-19)
- **Date**: 2026-06-18
- **Deciders**: TBD (pending review)
- **Related**: FR-14, FR-17, [`analytics_hotspot_gap_analysis.md`](../reports/analytics_hotspot_gap_analysis.md), [`BACKEND_ERD.md`](../BACKEND_ERD.md)

## Context

The `/analytics` page includes a widget named **Risk Hotspot Map** (`widgets/risk-hotspot-map`). Users expect location-based risk visualization. The implementation:

- Ranks **sessions** by DANGER `max_proximity_risk` frame count (top 3).
- Places markers at **fixed CSS percentages** derived from rank index, not geographic coordinates.
- Exposes a field labeled `capacity` that is actually `danger_frame_count × 8`.

Full gap analysis: [`docs/reports/analytics_hotspot_gap_analysis.md`](../reports/analytics_hotspot_gap_analysis.md).

The data model (`analysis_session`) has `client_label` (free text) but no `lat`/`lng`/`zone_id`. `/live-map` uses separate hardcoded `ZONE_ANCHORS` (FR-17) with no link to analytics hotspots.

FR-14 is satisfied for API wiring and chart population; **semantic accuracy** of the hotspot widget is not.

## Decision

**Option B accepted (2026-06-19):** Real geographic hotspot map using `campus_zone` reference table, `analysis_session.zone_id`, zone-aggregated DANGER frames, and MapLibre markers on `/analytics`.

## Alternatives Considered

### Option A — Rename and reshape (session / place ranking UI)

Replace the decorative map with an honest ranking presentation:

- Widget name: e.g. **Top Risk Sessions** or **High-Risk Locations** (if grouped by normalized `client_label`).
- UI: ranked list, bar chart, or compact cards — not a faux map.
- Backend: optionally change `buildHotspots()` to `GROUP BY client_label` (or zone) instead of `session_id`; rename `capacity` to `danger_score` or show raw counts.
- Drill-down: link rows to `/archive` session detail.
- Empty state: explicit copy when no DANGER frames in window.

| Pros | Cons |
|------|------|
| Small FE + BE scope | Does not deliver geographic hotspot map |
| Fixes naming/UX debt quickly | `client_label` normalization still manual/inconsistent |
| Aligns widget with actual data | FR-14 response shape may change |

### Option B — Real hotspot map (geo / zone model)

Evolve toward a true location-based hotspot map:

- Schema: add `zone_id` and/or `lat`/`lng` on `analysis_session` (or junction table); normalize place names.
- Reuse or extend FR-17 `ZONE_ANCHORS` / MapLibre stack for `/analytics` or shared map component.
- Aggregate risk by zone/place with real coordinates; optional floor-plan layer.
- Integrate S3 (live-map) and S4 (analytics) on shared zone model.

| Pros | Cons |
|------|------|
| Matches product vision and widget name | Migration + FE/BE + S3/S4 integration |
| Actionable for facility managers | Requires place/zone authoring workflow |
| Strong FR-14 + FR-17 synergy | Larger test and documentation surface |

### Option C — Status quo

Keep current widget; document gaps only (already done in gap report).

| Pros | Cons |
|------|------|
| Zero implementation cost | UX debt remains; misleads users |
| FR-14 verification unchanged | Weak support for S4 travel-planning goal |

**Reject Option C** as a long-term state; acceptable only until A or B is scheduled.

## Consequences

### If Option A is accepted

- Rename widget slice; remove or simplify zoom/layer HUD.
- Update `HotspotItem` DTO and `API_SPEC.md`; migrate frontend types.
- Close G-7/G-8 in `REQUIREMENTS.md` when semantics match UI.
- `ui_design_audit.md` AH-1 resolved.

### If Option B is accepted

- Flyway migration for zone/geo columns or `zone` reference table.
- `AnalyticsService` aggregates by zone; map component shares live-map infrastructure.
- ADR may supersede parts of FR-17 zone-anchor hardcoding.
- New integration tests for zone aggregation.

### Until decided

- Track gaps **G-7**, **G-8** in `REQUIREMENTS.md` §6.1.
- S4 status: **Done (API wired)** — hotspot semantic gaps documented.
- No code changes required by this ADR alone.

## References

- Gap report: [`analytics_hotspot_gap_analysis.md`](../reports/analytics_hotspot_gap_analysis.md)
- Backend: `AnalyticsService.buildHotspots()`
- Frontend: `RiskHotspotMap.tsx`
- Live map anchors: `mapMarkerUtils.ts` `ZONE_ANCHORS`
