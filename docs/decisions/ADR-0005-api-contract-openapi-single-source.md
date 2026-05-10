# ADR-0005: Frontend ↔ Backend API contract — OpenAPI as single source of truth

- **Status**: Proposed
- **Date**: 2026-05-06
- **Deciders**: TBD (pending review)
- **Related**: ADR-0002 (Spring backend runtime), `docs/DESIGN.md` §4.4

## Context

The React frontend and Spring Boot backend share no compile-time link today. Contract drift (path, field names, enums) shows up only at runtime or in manual code review. `docs/DESIGN.md` §4.4 lists an open decision: whether OpenAPI should be generated from Spring, maintained by hand, and how TypeScript types stay in sync.

Without a single source:

- Duplicate DTO definitions diverge.
- CI cannot cheaply verify FE↔BE compatibility.

## Decision

**We will treat the OpenAPI description as the canonical API contract.** The Spring Boot application owns the HTTP surface; the OpenAPI artifact is either:

1. **Generated from Spring** (e.g. springdoc-openapi or equivalent) and committed or emitted in CI as `openapi.yaml` / JSON, **or**
2. **Authored once** under version control and enforced via codegen/tests on both sides,

with one explicit rule: **the frontend MUST NOT duplicate undocumented endpoints** — generated or validated TS clients (or contract tests) consume that artifact.

Exact toolchain (springdoc vs manual, codegen target, CI gate) is a follow-up task once this ADR is accepted; this ADR only fixes **single-source-of-truth** and **direction of truth** (server-owned contract).

## Alternatives Considered

- **Option A — Frontend drives types (hand-written TSleads)**
  - pros: fast iteration in small teams
  - cons: backend can ship breaking changes silently
  - reject: contradicts ADR-0002 (Spring as API authority)

- **Option B — No OpenAPI; integration tests only**
  - pros: less scaffolding
  - cons: expensive feedback loop; no IDE/docs for consumers
  - reject: poor fit for multi-component repo

- **Option C (selected) — OpenAPI canonical, server-owned**
  - pros: one artifact for docs, codegen, and CI diff gates
  - cons: requires discipline to regenerate/commit or validate in pipeline
  - selected

## Consequences

- **Positive**: Clear ownership of breaking changes; path to automated client stubs and contract tests.
- **Negative / risks**: Boot/plugin upgrades can change generated shape — CI must pin versions or snapshot tests will flap.
- **Follow-up actions**:
  1. Choose generator vs hand-maintained OpenAPI and document in README.
  2. Add CI step: validate OpenAPI schema + optional TS compile against generated types.
  3. Align existing frontend API modules with generated or validated shapes.

## References

- `docs/DESIGN.md` §4.4
- `application/backend/crowdnav-api/` (Spring controllers)
- `application/frontend/` (API client modules)
