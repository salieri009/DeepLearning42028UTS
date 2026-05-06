# ADR-0006: Legacy model weights under `PROJECTS/CrowdNav/` — inventory, hashing, retention

- **Status**: Proposed
- **Date**: 2026-05-06
- **Deciders**: TBD (pending review)
- **Related**: ADR-0009 (Keras removal — weights are separate), `docs/architecture/LEGACY_CATALOG.md` §1.1, `docs/DESIGN.md` §4.7

## Context

`docs/architecture/LEGACY_CATALOG.md` lists large `.pt` files under `PROJECTS/CrowdNav/` (e.g. `yolo26n.pt`, `yolov8m.pt`, `yolov8n.pt`, `yolov8x.pt`) with **unknown or duplicate provenance**. The repo root may also contain `yolov8n.pt` duplicating `PROJECTS/CrowdNav/yolov8n.pt`. Binaries should not live in git without an explicit policy (size, LFS, reproducibility).

Keeping unidentified weights creates:

- Storage and clone cost.
- Risk of training/inference against the wrong checkpoint.

## Decision

**We will not keep unidentified duplicate weights in the working tree long-term.** For each file:

1. Compute **SHA-256** (and optionally compare to published Ultralytics stock hashes where applicable).
2. **Classify**: stock baseline / fine-tuned experiment / unknown.
3. **Act**:
   - **Duplicate of stock or repo duplicate** → keep a single canonical copy (path documented); remove the other.
   - **Unknown small stub (`yolo26n.pt` naming)** → archive outside repo or delete after owner confirmation.
   - **Large artifacts required for reproducibility** → store in **Git LFS**, **S3**, or **ClearML model registry**, not ordinary git blobs — reference paths only in docs.

Until classification finishes, **no new training scripts may hard-code** paths under `PROJECTS/CrowdNav/` without a documented mapping.

## Alternatives Considered

- **Option A — Keep all weights in repo for convenience**
  - pros: offline demos always work
  - cons: repo bloat, unclear lineage
  - reject: conflicts with hygiene goals post–ADR-0009

- **Option B — Delete everything without audit**
  - pros: instant cleanup
  - cons: may destroy one-of-a-kind fine-tunes
  - reject: too risky

- **Option C (selected) — Hash inventory + explicit retention rules**
  - pros: evidence-based cleanup; reproducibility preserved where needed
  - cons: requires one-time scripting + human sign-off for unknowns
  - selected

## Consequences

- **Positive**: Clear provenance; smaller canonical repo; fewer wrong-checkpoint mistakes.
- **Negative / risks**: Hash comparison needs a small utility script and runner time once per machine.
- **Follow-up actions**:
  1. Add a `train/` or `infra/` script to print SHA-256 for listed `.pt` paths and optional stock comparison.
  2. Update `LEGACY_CATALOG.md` table with hash results and final disposition.
  3. Enforce `.gitignore` / LFS policy for future weight drops.

## References

- `docs/architecture/LEGACY_CATALOG.md` §1.1
- `docs/DESIGN.md` §4.7, §5.1 (deferred 0006)
- `PROJECTS/CrowdNav/*.pt` (local paths; may be gitignored)
