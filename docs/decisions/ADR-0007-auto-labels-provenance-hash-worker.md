# ADR-0007: `auto_labels_08` vs ground-truth labels — provenance audit via hash/content worker

- **Status**: Proposed
- **Date**: 2026-05-06
- **Deciders**: TBD (pending review)
- **Related**: `docs/DESIGN.md` §5.1 (deferred 0007), `docs/architecture/LEGACY_CATALOG.md` §1.2

## Context

`PROJECTS/CrowdNav/data/processed/auto_labels_08/` holds a very large set of YOLO `.txt` labels (~446k files per catalog). Separately, processed ground-truth or alternate label trees (e.g. under `data/processed/labels_gt/` or JRDB-provided paths) may describe overlapping imagery. It is **not yet proven** whether `auto_labels_08` is entirely pseudo-generated, entirely vendor-provided, or a mix — `DESIGN.md` records that at least one source is likely **direct JRDB** material.

Training or merging datasets without resolving overlap risks:

- Double-counting frames.
- Silent label contradictions.

Pure filename intersection is insufficient when directory layout differs; **content comparison** (per-file hash or normalized line hash) is required at scale.

## Decision

**We will run a dedicated offline worker (batch job) that compares `auto_labels_08` against candidate reference trees** (starting with `labels_gt` or equivalent) using deterministic rules:

1. **Keying**: Map each label file to a canonical key (e.g. image stem + sequence id) shared across both trees after normalization.
2. **Equality**: For matched keys, compare **normalized line content** (strip whitespace, stable class order if needed) and record **match / mismatch / missing**.
3. **Dispatch policy**: Mismatch or ambiguous keys are **not auto-merged** — they are emitted to a **report** (CSV/JSON) for human triage. Only **byte-identical** or policy-approved subsets participate in automated merges.

The worker is **idempotent** and safe to re-run when paths change; it does not mutate inputs by default (read-only + report output).

Implementation detail (library, multiprocessing, Spark, etc.) is left open; this ADR mandates **behavior and safety**, not a specific framework.

## Alternatives Considered

- **Option A — Assume disjoint sets; union in preprocessing**
  - pros: fastest path to larger dataset
  - cons: can poison labels if overlap exists
  - reject

- **Option B — Manual spot-check only**
  - pros: no code
  - cons: not credible at 446k scale
  - reject

- **Option C (selected) — Hash/content worker + explicit merge gate**
  - pros: evidence-backed provenance; automation without silent merges
  - cons: CPU/disk time for first pass
  - selected

## Consequences

- **Positive**: Clear answer whether `auto_labels_08` duplicates GT; merge decisions become auditable.
- **Negative / risks**: Large I/O; worker must stream or batch to avoid RAM blowups; Windows vs POSIX path normalization must be explicit.
- **Follow-up actions**:
  1. Implement worker CLI under `train/scripts/` or `train/src/data/prepare/` with configurable roots.
  2. Record summary metrics in `docs/reports/` or ClearML for traceability.
  3. Update `LEGACY_CATALOG.md` §1.2 with findings and final dataset policy.

## References

- `docs/DESIGN.md` §5.1
- `docs/architecture/LEGACY_CATALOG.md` §1.2
- `train/src/data/prepare/reporting.py` (inventory helpers — may extend or complement)
