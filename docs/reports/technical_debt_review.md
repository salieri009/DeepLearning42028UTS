---
last_updated: 2026-06-18
remediation_sets: 13
review_type: Technical Debt Discovery (Due Diligence)
scope: CrowdNav full stack (Spring API, React FE, FastAPI inference, train, CI, docs)
---

# CrowdNav Technical Debt Review

Brutally objective due-diligence review. Assumes current design is **not** automatically correct.

**Out of scope for remediation recommendations:** audio/haptic alerts, full WCAG audit, FR-13 3-class detection, pause/resume monitoring, removing `MockAnalyzeFrameService` (required for CI).

---

## 1. Architecture

| Issue | Why debt | Current impact | Future impact | Severity |
|-------|----------|----------------|---------------|----------|
| Fragile inference delegate wiring (`List<AnalyzeFrameService>` + `findFirst`) | Order-dependent bean selection; breaks when wrappers multiply | Works today with 2 beans | New decorator/metrics layer picks wrong delegate | **Medium** |
| `app.persistence.enabled=false` leaves no `@Primary` inference bean | Ambiguous startup when persistence off | Dev/test edge case | Silent misconfiguration in split deployments | **Medium** |
| Duplicate session-gate (`requireSessionOpen` in controller + persisting service) | Violates DRY; doubles DB reads | 2× session lookup per framed request | Latency compounds at 2 FPS | **Medium** |
| Duplicated RestClient HTTP/1.1 bootstrap | Copy-paste infra workaround | Maintenance friction | Divergent timeout/retry behavior | **Low** |
| Policy logic triplicated (Python train, Python inference, Java) | Single source of truth violated | Contract test catches drift | Risk classification bugs in production | **High** |
| `SessionService` mixes CRUD, native-query mapping, validation | SRP erosion | 293-line service still manageable | Becomes god-class as filters grow | **Low** |
| FE settings dual persistence (API + localStorage) | Unclear ownership boundary | Stale local state on API failure | Multi-device inconsistency | **High** |
| Compose stack duplication (`application/` vs `infra/docker`) | Two deployment truths | Wrong stack = no DB persistence | On-call confusion | **Medium** |

**Positive:** `AnalyzeFrameService` mock/remote abstraction; `PersistingAnalyzeFrameService` decorator; FSD frontend layout; Flyway migrations.

---

## 2. Code Quality

| Issue | Maintainability | Refactoring effort |
|-------|-----------------|-------------------|
| No `@ControllerAdvice` — inconsistent error JSON | High | Low (1–2 days) |
| Dead code: `MockAnalyzeFrameService` unused `List<PersonDetection> raw` | Low | Trivial |
| Dead code: `FrameRepository.findRecentWithSession()` uncalled | Low | Trivial |
| Dead code: `collision_avoidance.py` in inference-service (~267 LOC) | Medium | Low (delete + verify) |
| `Object[]` native-query row mapping in `SessionService` | High | Medium (projection DTO) |
| Zero structured logging in backend `src/main/java` | High | Medium |
| `reportError(err)` single-arg calls (signature expects context + error) | Medium | Low (grep fix) |
| Settings toggles stored but not consumed (`visualOverlays`, `logErrors`, `webrtcAccess`) | High | Medium |
| Widget alias re-export layer (6+ widgets) | Low | Low |
| ESLint `no-unused-vars` off; `@typescript-eslint` not wired | Medium | Low |

---

## 3. Scalability

| Bottleneck | Failure scenario | Mitigation |
|------------|------------------|------------|
| Session list aggregates **all frames** (`GROUP BY session_id` subquery) | List API slows linearly with frame table growth | Filter frames in subquery by `started_after`; materialized session stats |
| Settings DB read on every remote inference call | 2 FPS × N clients = hot `app_settings` row | Cache with TTL; inject at session start |
| `getSession` = 4 sequential queries | Detail view latency under load | Single aggregate query (like list endpoint) |
| Analytics summary ~8 sequential COUNTs | Dashboard timeout with large history | Consolidated SQL or read replica |
| Async `sequence_no` read-max + insert (single retry) | Multi-client burst loses frames | DB sequence or advisory lock |
| Async pool queue 50 + default `AbortPolicy` | Saturation drops persistence silently | Custom rejection handler + metrics |
| No inference HTTP read timeout | Hung YOLO blocks servlet threads | RestClient timeout + circuit breaker |
| `useCrowdDetection` 500ms interval, no in-flight guard | Overlapping analyze requests, race on overlay | AbortController / mutex |

**Remediated (set 1, 2026-06-18):**
- `SettingsService` 5s in-memory cache on `getSettings()` — reduces per-inference DB reads
- `app.upload.max-frame-bytes` + multipart 5MB cap — mitigates upload DoS (see gap set 1)

**Remediated (cycle 2 sets 9–13, 2026-06-18):**
- Session list frame aggregate scoped by `started_after` / `source_type` filter
- `getSession` single aggregate query (replaces 4 round-trips)

---

## 4. Cloud & Infrastructure

| Gap | Risk |
|-----|------|
| No auth, no encryption in transit enforcement beyond defaults | Demo-only posture |
| Postgres password `crowdnav` committed in compose/yml | Credential leak if deployed as-is |
| GHCR image `ghcr.io/salieri009/...` hardcoded | Vendor/owner lock-in for forks |
| `infra/docker` stack has no Postgres | Session API breaks if used unknowingly |
| Health probes configured; no metrics/tracing (Prometheus, OTel) | Blind spots in production |
| `best.pt` runtime mount required — image not self-contained | SageMaker/Docker deploy coupling (ADR-0003 intentional) |
| No backup/DR runbook for Postgres | Data loss on volume failure |
| Dockerfile `gradle bootJar -x test` | Broken builds ship to containers |
| Version label drift (2.5.0 vs 2.5.1) | Release traceability confusion |

**Remediated (set 2, 2026-06-18):**
- Backend Dockerfile: `gradle build` replaces `bootJar -x test`
- CI: `npm run lint` + inference `pytest` job in `build-check.yml`
- **Remaining:** `tsc --noEmit` blocked by pre-existing type errors (FrameItem exports, test fixtures)

**Positive:** Multi-stage Dockerfiles, non-root user, healthchecks, nginx API proxy, conditional mock inference for CI.

---

## 5. Security Debt

| Finding | Business risk | Exploitability |
|---------|---------------|----------------|
| **No authentication on any `/api/v1/*` endpoint** | Full data exposure; settings tampering | **Critical** — trivial |
| IDOR on session IDs (numeric, enumerable) | Read any session's detections/frames | **High** — trivial |
| Unbounded base64/multipart frame upload | DoS via memory exhaustion | **High** — easy |
| `PUT /settings` globally writable | Model/threshold manipulation for all users | **Medium** |
| Default DB creds in VCS | Credential reuse attacks | **Medium** (if exposed) |
| CORS on `/actuator/**` | Widened browser surface if more endpoints exposed | **Low** today |
| Base64 validated for syntax only, not image bounds | Malformed payload to inference | **Low** |

**Remediated (set 3, 2026-06-18):**
- Upload size limits reduce unbounded payload risk (partial — auth/IDOR still open)
- `reportError` call sites fixed; `logErrors` setting gates production console output

---

## 6. DevOps & Delivery

| Gap | Release risk |
|-----|--------------|
| CI: no `npm run lint`, no `tsc --noEmit` | Type/lint regressions reach main |
| CI: inference-service `pytest` not run | Policy contract breaks undetected |
| CI: `python-lint.yml` only lints `train/`, not `application/inference-service` | Inference code quality drift |
| All `@SpringBootTest` use `app.inference.mode=mock` | Remote inference path untested in CI |
| H2 tests may miss PostgreSQL SQL edge cases | Production-only query failures |
| Async tests use `Thread.sleep(200–300ms)` | Flaky CI on slow agents |
| No E2E test (FE + BE + inference) | Integration regressions |
| No JaCoCo / dependency-check in Gradle | Coverage and CVE blind spots |
| `docker-publish.yml` only on main push | PR image build not validated |

**Positive:** Gradle test suite (14 classes), Vitest (37 files), Flyway versioned migrations, policy contract test Java↔Python.

**Remediated (loop sets 4–5, 2026-06-18):**
- `build-check.yml`: frontend lint + inference pytest
- `python-lint.yml`: dedicated `inference-lint` job for `application/inference-service`
- Backend Dockerfile runs `gradle build` (tests included)

---

## 7. Knowledge Debt

| Gap | Bus factor / onboarding |
|-----|-------------------------|
| `System_Architecture_Documentation.md` train-centric; app runtime underdocumented | New devs miss Spring/React/FastAPI topology |
| `API_SPEC.md` still **draft**; ADR-0005 OpenAPI codegen not done | FE types hand-maintained, drift risk |
| Risk Hotspot Map semantic gap (G-7/G-8) documented but unresolved | Product/engineering misalignment |
| `visual_overlays` / `webrtc_access` in API schema imply features that don't run | False confidence in capabilities |
| Session auth/IDOR tracked only in `ADR_TRACKER_ISSUE.md` | Security posture unclear from API_SPEC alone |
| `REPO_LAYOUT` last_updated 2026-05-02 | Stale layout guidance |
| Tribal knowledge: inference reads settings from DB, not request body | FE devs assume wrong contract |

**Positive:** ADR series (0002–0011), `user_scenarios.md`, `REQUIREMENTS.md` gap table, honest hotspot gap analysis.

**Remediated (loop set 5, 2026-06-18):**
- `API_SPEC.md` §1: IDOR risk note, upload limits (5 MB / 413), auth follow-up pointer
- `entities/session/index.ts`: exports `FrameItem`, `FrameListResponse` (tsc prep)

---

## 8. Prioritization Table

| Debt Item | Category | Severity | Business Impact | Refactoring Effort | Priority |
|-----------|----------|----------|-----------------|-------------------|----------|
| No API authentication | Security | Critical | Data breach, settings sabotage | High | **P1** |
| IDOR on sessions | Security | High | Privacy violation | Medium | **P1** |
| Unbounded upload size | Security | High | Outage via DoS | Low | **P1** |
| Policy triplication (Py/Java) | Architecture | High | Wrong risk alerts | Medium | **P1** |
| Session list full-table frame scan | Scalability | High | API degradation at scale | Medium | ~~P1~~ **Done** (filtered aggregate) |
| CI missing lint/tsc/inference pytest | DevOps | High | Regressions to production | Low | **P1** |
| Settings toggles not wired to runtime | Code Quality | High | User trust erosion | Medium | **P2** |
| `reportError` wrong call signature | Code Quality | High | Broken error telemetry | Low | **P2** |
| FE dual persistence (API + localStorage) | Architecture | High | Split-brain settings | Medium | **P2** |
| Risk Hotspot semantic gap (G-7/G-8) | Knowledge | Critical* | Misleading analytics UX | Medium–High | **P2** |
| Settings DB read per inference | Scalability | High | Throughput ceiling | Low | **P2** |
| Docker build skips tests | DevOps | High | Broken images shipped | Low | **P2** |
| Remote inference untested in CI | DevOps | Medium | 502 paths undetected | Medium | **P2** |
| No global exception handler | Code Quality | Medium | Inconsistent API errors | Low | **P3** |
| Duplicate session-gate queries | Architecture | Medium | Latency waste | Low | **P3** |
| Inference delegate `findFirst` | Architecture | Medium | Bean wiring fragility | Low | **P3** |
| Compose/registry hardcoding | Infrastructure | Medium | Fork portability | Low | **P3** |
| `densityLimit` no UI | Code Quality | Medium | Hidden capability | Low | ~~P3~~ **Done** |
| ADR-0005 OpenAPI codegen | Knowledge | Medium | Manual type drift | Medium | **P3** |
| Widget alias layer | Code Quality | Low | Navigation friction | Low | **P3** |
| Dockerfile version label drift | DevOps | Low | Metadata confusion | Trivial | **P3** |

\*Critical for product honesty / demo credibility, not outage risk.

---

## 9. Technical Debt Heatmap

### Critical Debt
- **No authentication** on any API endpoint
- **Risk Hotspot Map** presents session ranking as geographic map (G-7/G-8) — documented product deception risk

### High Debt
- IDOR on session resources
- Policy logic triplicated across 3 runtimes
- Session list query scans entire frame table
- CI `tsc --noEmit` gate enabled in `build-check.yml`
- FE settings partially wired (`webrtcAccess` disabled with honest label)
- FE API + localStorage dual persistence

### Medium Debt
- `getSession` 4-query pattern
- Analytics 8-query summary
- Async persistence race on `sequence_no`
- Compose stack duplication
- GHCR owner hardcoded
- `API_SPEC` draft + no codegen
- Architecture docs train-centric
- H2 vs PostgreSQL test gap
- Flaky async `Thread.sleep` tests

### Low Debt
- Dead code (mock raw list, unused repo method, `collision_avoidance.py`)
- No structured logging
- Widget alias re-exports
- ESLint config gaps
- Version label drift (2.5.0 vs 2.5.1)
- `DEFAULT_SENSOR_SOURCES` unused export
- CORS on actuator

---

## 10. Executive Summary

### Top 5 Risks

1. **Zero authentication** — Any client can read all sessions, detections, and rewrite global inference settings. In a public deployment this is an immediate security incident.
2. **Policy triplication** — Proximity/risk logic lives in `train/`, `inference-service/`, and Java independently. Contract tests help but do not eliminate divergence under change.
3. **Scalability cliffs** — Session list aggregates all frames; settings fetched per inference frame. Both degrade predictably with usage.
4. **CI false confidence** — `tsc --noEmit` still blocked by legacy type errors; remote inference path untested in CI.
5. **UI/runtime honesty gap** — Settings toggles and Risk Hotspot widget imply capabilities that are not implemented. Erodes trust in a safety-oriented product narrative.

### Consequences if Ignored (12–18 months)

| Risk | Consequence |
|------|-------------|
| No auth | Mandatory retrofit blocks feature work; possible data incident |
| Policy drift | Incorrect DANGER/WARNING alerts — liability in real deployment |
| Query debt | Archive/analytics unusable beyond ~100k frames |
| CI gaps | Rising bug fix cost; remote mode breaks silently |
| UX dishonesty | Stakeholder/demo failure when capabilities are questioned |

### Remediation Roadmap

#### 30 days (P1 — immediate)
- Add upload size limits (`spring.servlet.multipart`, base64 cap)
- Wire CI: `npm run lint`, `tsc --noEmit`, `pytest` in inference-service
- Fix `reportError` call sites; wire `logErrors` toggle or remove from UI
- Stop Docker build from skipping tests (`-x test` → run tests or separate stage)
- Document auth posture in API_SPEC; add session-scoped token stub if full auth deferred

#### 90 days (P2 — next quarter)
- Resolve ADR-0011 (Risk Hotspot rename vs geo map)
- Cache inference settings; rewrite session-list aggregate SQL
- Consolidate policy into shared package; inference imports from train wheel
- Wire `visualOverlays` to `VideoStage` or deprecate in API/UI
- Add WireMock tests for `remote` inference mode
- Environment-variable Compose images and registry owner

#### 180 days (P3 — future)
- Authentication + authorization (session ownership model)
- OpenAPI codegen for FE types (ADR-0005)
- PostgreSQL Testcontainers for native SQL
- Observability: structured logging, metrics, inference latency dashboards
- E2E smoke test (create session → analyze → archive)
- Refresh `System_Architecture_Documentation.md` for application runtime

---

*Generated by Technical Debt Discovery Prompt — CrowdNav v2.5.x baseline.*
