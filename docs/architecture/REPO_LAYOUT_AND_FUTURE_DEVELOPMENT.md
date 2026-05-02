# Repository layout change — implications for future development

## What changed

The codebase was reorganised from a single **`PROJECTS/CrowdNav`** tree into four top-level concerns:

| Area | Path | Purpose |
|------|------|---------|
| Application | [`application/`](../../application/) | Spring API, RN sample client (YOLO inference: ONNX in `crowdnav-api`) |
| Training / ML | [`train/`](../../train/) | YOLO pipeline, `src/`, scripts, notebooks |
| Infrastructure | [`infra/`](../../infra/) | Docker, SageMaker launcher + training entrypoint |
| Documentation | [`docs/`](../) | TechSpec, PRD, diagrams, runbooks, SysML |

**Dataset files** live at the **repository root** under **`data/`**, not under `train/`. Python defaults resolve via [`train/src/repo_paths.py`](../../train/src/repo_paths.py).

This was a **structural change**, not only a folder rename: **CI** (`working-directory: train`), **Docker build context**, **import paths**, and **documentation links** were updated to match.

## Why it matters for ongoing work

1. **Old paths are obsolete** — Any bookmark, script, or wiki pointing at `PROJECTS/CrowdNav/...` or `deploy/...` must be updated. Use the [migration table in the root README](../../README.md#path-migration-old--new).
2. **Diagrams may lag code** — [`System_Architecture_Documentation.md`](System_Architecture_Documentation.md) and related SysML/diagrams describe behaviour and layering; **module paths inside diagrams** should be read as conceptual (`train/src/...`) unless explicitly refreshed.
3. **New features should respect boundaries** — Put runtime/API code under **`application/`**, training and data prep under **`train/`**, deployment and cloud glue under **`infra/`**, and prose under **`docs/`**.
4. **Monolith folder** — `PROJECTS/CrowdNav/` may still exist **locally** as empty or legacy data; it is **gitignored** and is **not** the canonical layout.

## Single source of truth for layout

- Root [`README.md`](../../README.md) — directory tree + path migration table  
- [`docs/DATA.md`](../DATA.md) — `data/` and DVC  
- This file — **architecture / layout evolution** for contributors planning future milestones  

_Last updated: 2026-05-02 — aligned with the repository restructure described above._
