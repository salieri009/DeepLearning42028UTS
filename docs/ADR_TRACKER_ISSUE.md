# ADR Decision Log (single tracker)

One issue to track **why** each architecture decision was made and **what changed** in the repo. Full text lives under `docs/decisions/`.

Released with **v2.0.0** — see commit range `v0.1.0..v2.0.0`.

---

## Summary table

| ADR | Title | Status | Outcome in v2.0.0 |
|-----|-------|--------|-------------------|
| [0002](docs/decisions/ADR-0002-backend-runtime-spring.md) | Spring Boot backend of record | **Accepted** | Spring owns public API; FastAPI is internal `/internal/infer` adapter only |
| [0003](docs/decisions/ADR-0003-deployment-split-docker-sagemaker.md) | Docker serve / SageMaker train | **Accepted** | `application/docker-compose.yml` for webapp; SageMaker for `best.pt` training |
| [0005](docs/decisions/ADR-0005-api-contract-openapi-single-source.md) | OpenAPI single source of truth | **Proposed** | Manual `API_SPEC.md` + TS clients; springdoc/codegen not yet wired |
| [0006](docs/decisions/ADR-0006-legacy-weights-handling.md) | Legacy `.pt` inventory & retention | **Proposed** | Weights gitignored; hash audit script not yet added |
| [0007](docs/decisions/ADR-0007-auto-labels-provenance-hash-worker.md) | `auto_labels_08` provenance worker | **Proposed** | Content-hash compare worker not yet implemented |
| [0008](docs/decisions/ADR-0008-clearml-secret-hygiene.md) | No plaintext ClearML secrets | **Accepted** | `.env` gitignored; `train/.env.example` + `clearml-init` pattern |
| [0009](docs/decisions/ADR-0009-keras-skeleton-removal.md) | Remove Keras skeleton | **Accepted** | `infra/train_*_skeleton.py` and `train/src/data/keras/` deleted |
| [0010](docs/decisions/ADR-0010-train-packaging-remove-syspath-hacks.md) | Editable `crowdnav-train` package | **Accepted** | `train/pyproject.toml` v2.0.0; `sys.path.insert` hacks removed |
| [0011](docs/decisions/ADR-0011-risk-hotspot-widget-redesign.md) | Risk Hotspot Map redesign fork | **Proposed** | Gap documented; Option A (rename/rank UI) vs Option B (geo map) — no implementation yet |

---

## Per-ADR notes

### ADR-0002 — Spring backend
- **Why:** Preserve existing Spring controllers/tests; Python only for YOLO.
- **Changed:** `RemoteAnalyzeFrameService` calls inference-service; mock + remote modes; health indicators.

### ADR-0003 — Deployment split
- **Why:** Docker for student demo; SageMaker for GPU training without endpoint cost.
- **Changed:** Compose stacks frontend + Spring + inference; artifact handoff is `best.pt` only.

### ADR-0005 — OpenAPI contract
- **Why:** Prevent FE/BE drift without compile-time link.
- **Changed:** `docs/API_SPEC.md` is canonical doc; frontend `shared/api/*` hand-written — codegen TBD.

### ADR-0006 — Legacy weights
- **Why:** Duplicate/unidentified `.pt` files bloat repo and risk wrong checkpoint.
- **Changed:** `*.pt` gitignored; LEGACY_CATALOG documents paths — hash inventory still open.

### ADR-0007 — Auto-label provenance
- **Why:** ~446k pseudo labels may overlap GT; blind merge poisons training.
- **Changed:** Policy documented; offline hash worker not shipped yet.

### ADR-0008 — ClearML hygiene
- **Why:** Plaintext keys in working tree violate team policy.
- **Changed:** No tracked `.env`; credentials via `~/.clearml.conf` or CI secrets.

### ADR-0009 — Keras removal
- **Why:** Orphan Keras code conflicted with YOLO/Ultralytics line; tensorflow not in requirements.
- **Changed:** Keras skeletons removed; `infra/` is Docker + SageMaker only.

### ADR-0010 — Train packaging
- **Why:** `sys.path.insert` broke IDE/mypy depending on cwd.
- **Changed:** `pip install -e ./train` exposes `src` package; CI mypy uses `pyproject.toml`.

### ADR-0011 — Risk Hotspot Map redesign
- **Why:** Widget name implies geo hotspots; implementation is session ranking on fixed CSS positions (`analytics_hotspot_gap_analysis.md`).
- **Changed:** Gaps G-7/G-8 in REQUIREMENTS; API_SPEC semantics; S4 status nuance — implementation pending Option A or B.

---

## Follow-up checklist

- [ ] ADR-0005: springdoc-openapi or committed `openapi.yaml` + TS codegen in CI
- [ ] ADR-0006: SHA-256 inventory script + LEGACY_CATALOG update
- [ ] ADR-0007: label provenance worker CLI + merge gate report
- [ ] ADR-0011: accept Option A (rename/rank UI) or Option B (geo hotspot map) and implement
- [ ] Session API auth hardening (demo IDOR noted in security review)

---

*Update this issue when an ADR moves from Proposed → Accepted or when follow-ups close.*
