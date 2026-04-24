# Next Update Queue

Date: 2026-04-22

## Priority 1
- Finalize frontend/API contract doc once runtime endpoint schema is fixed.
- Add deployment view and runtime sequence for `deploy/docker-compose.yml` flow.
- Add tested example outputs to `src/inference/README.md` for deterministic alert behavior verification.

## Priority 2
- Add dataset version manifest documentation tied to DVC tags/commits.
- Add explicit model artifact naming policy with traceability fields.
- Add integration test runbook covering preprocessing -> split -> train -> export.

## Priority 3
- Add bilingual consistency review pass (English/Korean sections where applicable).
- Add doc linting/checklist step in CI for required metadata fields.
- Add architecture delta checklist for every PR touching `src/data`, `src/inference`, or `src/mlops`.
