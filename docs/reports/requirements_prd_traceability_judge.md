# Requirements ↔ PRD Traceability Judge Report

| Field | Value |
|-------|-------|
| **Date** | 2026-06-18 |
| **Ground Truth** | [`docs/PRD.md`](../PRD.md) (immutable; no PRD edits suggested) |
| **Candidate** | [`docs/REQUIREMENTS.md`](../REQUIREMENTS.md) (`last_updated: 2026-06-18`) |
| **Evaluator** | spec-judge (traceability review) |

---

## Executive Summary

`docs/REQUIREMENTS.md` provides strong, explicit PRD traceability with EARS-style UI requirements, a §1.1 coverage matrix, and honest **Known drift** disclosures. All five checklist items **PASS** after G-1/G-2 NFR formalization (2026-06-18).

**Overall verdict: PASS**

---

## Checklist Results

| # | Check | Verdict | Notes |
|---|-------|---------|-------|
| 1 | All PRD §5, §8 items map to ≥1 FR/NFR | **PASS** | Every §5/§8 row has a mapped ID; see §5.1 gap on test mAP *target* formalization |
| 2 | PRD §9 Won't items reflected in REQUIREMENTS §4 | **PASS** | All four §9 removals present; drift for re-introduced audio/haptic documented in §4 |
| 3 | FR-14…17 marked Extension without contradicting PRD | **PASS** | All four labelled `*(Extension)*`; FR-15 `audible_alerts` drift cross-referenced, not hidden |
| 4 | FR-2 density PRD §8 vs implementation drift explicitly flagged | **PASS** | Flagged in §1.1 matrix, FR-2 body, FR-2 Implementation note, and §8 row |
| 5 | Verification columns are testable | **PASS** | G-1/G-2 resolved: NFR-3 test target, NFR-2 FPS gate |

---

## Check 1 — PRD §5 & §8 → FR/NFR Mapping

### §5 Key Features

| PRD §5 item | Mapped FR/NFR | Coverage |
|-------------|---------------|----------|
| §5.1 Real-time person detection (YOLOv8m, JRDB) | FR-1, NFR-3 | Full |
| §5.1 Crowd density LOW / MEDIUM / HIGH | FR-2 | Drift flagged (see Check 4) |
| §5.1 Proximity SAFE / WARNING / DANGER (bbox height) | FR-3 | Full |
| §5.1 SageMaker training + FastAPI `/internal/infer` + Spring backend | FR-6, FR-7, FR-9, FR-10, NFR-4, NFR-5 | Full (training via SageMaker implied by NFR-4 portability, not a standalone FR) |
| §5.2 Color-coded bounding boxes | FR-4, NFR-10 | Full |
| §5.2 Stats panel (density, risk, recommendation) | FR-5 | Full |
| §5.3 2 FPS capture, &lt; 500 ms latency | NFR-1, NFR-2, FR-UI-1 | Partial (latency benchmark TBD) |
| §5.3 mAP@0.5 = 0.4475 (val) | NFR-3 | Full |

### §8 Success Metrics

| PRD §8 metric | Target | Mapped FR/NFR | Coverage |
|---------------|--------|---------------|----------|
| mAP@0.5 (val) | &gt; 0.40 | NFR-3 | Full — target and achieved value aligned |
| mAP@0.5 (test) | &gt; 0.50 | NFR-3 (notes only) | **Gap** — achieved 0.6361 cited in Verification column but **not** in NFR-3 Target column |
| Inference latency | &lt; 500 ms | NFR-1 | Partial — criterion defined; benchmark TBD |
| Proximity alert correctness | Qualitative | FR-3 | Full — upgraded to quantitative unit tests (acceptable) |
| Crowd density classification | Qualitative (n≤2 / n≤5 rule) | FR-2 | Drift flagged — normative PRD rule in FR-2 text |

**Check 1 verdict: PASS** — all items map to at least one ID. One formalization gap remains (test mAP target).

---

## Check 2 — PRD §9 → REQUIREMENTS §4

| PRD §9 removed item | REQUIREMENTS §4 entry | Match |
|---------------------|----------------------|-------|
| Audio / haptic alerts | §4 row 1 + Known drift table | Yes |
| Screen reader / WCAG / ARIA | §4 row 2 | Yes |
| Route selection / path-clearance markers | §4 row 3 | Yes |
| Visually impaired audio feedback | §4 row 4 | Yes |

The §4 **Known drift** table correctly documents that `audible_alerts` / `useRiskAlerts` and haptic vibration exceed PRD §9 scope (opt-in, default off). PRD is not edited; disposition is explicit.

**Check 2 verdict: PASS**

---

## Check 3 — FR-14…17 Extension Classification

| ID | Extension label | PRD ref | Contradiction risk |
|----|-----------------|---------|-------------------|
| FR-14 | `*(Extension)*` | §3 Vision | None — analytics API beyond PRD §5 |
| FR-15 | `*(Extension)*` | §3 Vision | Low — `audible_alerts` field contradicts §9 but drift disclosed in §4; does not re-scope PRD |
| FR-16 | `*(Extension of FR-11)*` | — (persistence) | None |
| FR-17 | `*(Extension)*` | §3 Vision | None — telemetry map, not PRD-deferred route selection |

§1.1 matrix row correctly classifies FR-14…17 as **Extension** derived from product vision, not PRD §5.

**Check 3 verdict: PASS**

---

## Check 4 — FR-2 Density Drift Disclosure

Drift is documented in four places:

1. **§1.1 matrix** — §5.1 crowd density row: `**Drift**` with `density_limit` reference
2. **§1.1 matrix** — §8 row: `**Partial**` — density rule same drift
3. **FR-2 requirement text** — normative PRD rule (`n≤2` / `n≤5`) stated explicitly
4. **FR-2 Implementation note (v2.2)** — shipped `_crowd_density()` logic with `density_limit` default 64; states PRD remains normative

Confirmed against `application/inference-service/main.py` (`_crowd_density` uses `density_limit`, not PRD n≤2/n≤5 thresholds).

**Check 4 verdict: PASS**

---

## Check 5 — Verification Column Testability

### Functional requirements (FR-1…FR-17, FR-UI-1…6)

| Assessment | Count | Detail |
|------------|-------|--------|
| Unit / integration with explicit pass criteria | 14 | e.g. FR-2 table `{0,1,2,3,5,6}`, FR-3 heights, FR-6–9 HTTP codes |
| Manual with observable outcome | 6 | e.g. FR-4 colors, FR-17 map markers — acceptable for UI |
| Extension FRs with named test classes | 4 | FR-14–16 cite `*ControllerTest`; FR-15 adds integration test |

All FR verification columns name a method and an observable pass condition.

### Non-functional requirements — flagged weaknesses

| ID | Issue | Severity |
|----|-------|----------|
| **NFR-1** | Benchmark TBD in `evaluation_metrics.md` | Low — criterion (&lt; 500 ms) is clear; execution pending |
| **NFR-2** | Verification says "capture interval + round-trip timing" without stating **≥ 2 FPS** pass threshold | Medium — measurable but underspecified |
| **NFR-7** | "Token coverage" lacks audit procedure | Low — reviewable against `DESIGN_RULES.md` |
| **NFR-8** | Load test referenced to ERD §6; may not yet exist | Low — method stated |

**Check 5 verdict: CONDITIONAL PASS** — no row is untestable; NFR-2 should add an explicit FPS gate to match PRD §5.3/§8.

---

## Gaps List

| ID | Severity | Gap | Recommended action (REQUIREMENTS only) |
|----|----------|-----|--------------------------------------|
| G-1 | Medium | PRD §8 test-split mAP target (&gt; 0.50) not in NFR-3 **Target** column | **Resolved 2026-06-18** — NFR-3 Target now includes test &gt; 0.50 |
| G-2 | Medium | NFR-2 Verification lacks numeric pass criterion (≥ 2 FPS) | **Resolved 2026-06-18** — explicit FPS gate added to NFR-2 Verification |
| G-3 | Low | NFR-1 latency benchmark still TBD | Complete `evaluation_metrics.md` §4.2 benchmark |
| G-4 | Low | FR-2 Verification tests PRD rule, not shipped `density_limit` rule | Add parallel verification row or note that integration tests must cover both until code aligned |
| G-5 | Low | SageMaker training path has no dedicated FR (only NFR-4 portability) | Optional — add FR-TRAIN-1 or accept NFR-4 as sufficient for a shipped model |
| G-6 | Advisory | FR-15 Extension includes `audible_alerts` setting field | Already in Known drift; consider scoping FR-15 text to "settings except audio/haptic" or mark field as drift-only |
| G-7 | Advisory | FR-14 `RiskHotspotMap` — session ranking disguised as geographic hotspot map | Documented 2026-06-18 — [`analytics_hotspot_gap_analysis.md`](analytics_hotspot_gap_analysis.md); resolve via [ADR-0011](../decisions/ADR-0011-risk-hotspot-widget-redesign.md) |
| G-8 | Advisory | FR-14 `hotspots[].capacity` mislabels danger-frame-derived score | Same as G-7; rename metric when ADR-0011 implemented |

---

## Overall Verdict

| Result | **PASS** (was CONDITIONAL PASS; G-1, G-2 resolved in REQUIREMENTS 2026-06-18) |
|--------|----------------------|
| Rationale | Traceability structure is mature: §1.1 matrix, §4 Won't list, Extension labelling, and FR-2 drift disclosure meet expectations. NFR-2/NFR-3 targets now align with PRD §8. No PRD edits required. |

---

## Document Metadata

- Review scope: traceability only (not code correctness, not TechSpec/API_SPEC depth)
- PRD version: `last_updated: 2026-05-11`
- REQUIREMENTS version: `last_updated: 2026-06-18`, `status: draft`
