# PR: Design decisions — docs, train packaging, Docker webapp (`docs/design-decisions`)

## Summary

This branch lands the **design-decisions framework** (SKILL, DESIGN, LEGACY_CATALOG), records **five accepted ADRs** (0002, 0003, 0008, 0009, 0010), adds **architecture diagrams** (alert state machine, training pipeline sequences), **removes Keras skeletons**, **packages `train/` as `crowdnav-train`** per ADR-0010, and **implements ADR-0003** with a three-service Docker Compose stack (frontend, Spring backend, FastAPI inference). SageMaker remains training-only; `best.pt` is mounted into inference, not baked into the image.

## Commits (7)

| Order | Commit | Title |
|------:|--------|--------|
| 1 | `6085a35` | docs(crowdnav): scaffold design framework — SKILL, DESIGN, LEGACY_CATALOG |
| 2 | `c3ac947` | docs(adr): record 5 design decisions for legacy cleanup and deployment |
| 3 | `2ca6c74` | docs(architecture): add alert state machine + training pipeline sequence diagrams |
| 4 | `669dc49` | chore(infra,train): execute ADR-0009 — remove Keras skeletons |
| 5 | `7e3a595` | refactor(train): execute ADR-0010 — package via pyproject.toml, drop sys.path hacks |
| 6 | `2503f8a` | feat(infra,application): execute ADR-0003 — webapp multi-service Docker |
| 7 | — | docs(adr): propose ADR-0005–0007, PR body, inference CPU deps for Docker |

## Scope

- **Documentation**: `docs/skills/crowdnav-design/SKILL.md`, `docs/DESIGN.md`, `docs/architecture/LEGACY_CATALOG.md`, `docs/architecture/state_alerts.md`, `docs/architecture/sequence_training_pipeline.md`
- **ADRs**: `docs/decisions/ADR-0002`, `0003`, `0008`, `0009`, `0010`
- **Train / infra**: delete Keras stubs; `train/pyproject.toml` + editable install; `infra/setup.sh` conda env → PyTorch; remove `infra/docker/Dockerfile` (Jupyter); new per-service Dockerfiles + `infra/docker/docker-compose.yml`

## How to test / verify

- **Train package**: `pip install -e ./train` then run entry scripts from repo root without `sys.path` hacks (see ADR-0010 verification notes in commit `7e3a595`).
- **Lint**: Existing CI expectations — no TensorFlow/Keras references under `train/`, `application/`, `infra/` after ADR-0009.
- **Docker**: `cd infra/docker && docker compose build` — validated on this branch. Inference uses **CPU** PyTorch wheels via `--extra-index-url https://download.pytorch.org/whl/cpu` in `application/inference-service/requirements.txt` to keep the image lean (no full CUDA stack). Set `MODEL_DIR` to a directory containing `best.pt` for a full `up` test.

## Risks / follow-ups

- **`best.pt` handoff**: Manual path still possible; version tagging / registry remains a process concern (called out in ADR-0003).
- **PyTorch / ultralytics lock**: Training vs inference `requirements.txt` should stay aligned to avoid subtle inference drift.
- **Integration**: Spring remote inference defaults in compose; full E2E assumes inference service implements real `/internal/infer` behavior beyond stubs where applicable.

## Related ADRs

| ADR | Topic |
|-----|--------|
| [ADR-0002](../decisions/ADR-0002-backend-runtime-spring.md) | Spring backend + inference adapter in compose |
| [ADR-0003](../decisions/ADR-0003-deployment-split-docker-sagemaker.md) | Docker = webapp, SageMaker = training |
| [ADR-0008](../decisions/ADR-0008-clearml-secret-hygiene.md) | ClearML secrets hygiene |
| [ADR-0009](../decisions/ADR-0009-keras-skeleton-removal.md) | Keras skeleton removal |
| [ADR-0010](../decisions/ADR-0010-train-packaging-remove-syspath-hacks.md) | Editable `crowdnav-train` package |

**Deferred / next round (initial drafts in this repo iteration):** [ADR-0005](../decisions/ADR-0005-api-contract-openapi-single-source.md), [ADR-0006](../decisions/ADR-0006-legacy-weights-handling.md), [ADR-0007](../decisions/ADR-0007-auto-labels-provenance-hash-worker.md).

## Stash note (local workflow)

If you use the optional pre-flight stash named `plan G-J H: WIP stash before PR/ADR pipeline`, restore with `git stash list` / `git stash pop` when ready to continue local edits.
