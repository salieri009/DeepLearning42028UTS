---
name: crowdnav-design
description: |
  Use whenever the user wants to make design decisions, document architecture,
  draw diagrams, or untangle legacy code in the CrowdNav (UTS 42028 DL A3) repo.
  Triggers include: "레거시 정리", "디자인 결정", "ADR", "architecture diagram",
  "sequence diagram", "flow diagram", "PROJECTS/CrowdNav", "design doc".
  Encodes the cookbooks Tool-use + Orchestrator-Workers + Evaluator-Optimizer
  patterns so docs/diagrams stay grounded in the actual code, not hallucinated.
last_updated: 2026-05-05
related_code:
  - train/src/
  - application/
  - infra/
  - PROJECTS/CrowdNav/
related_diagram:
  - docs/architecture/System_Architecture_Documentation.md
  - docs/architecture/data_pipeline_diagram.md
---

# CrowdNav 디자인·문서화 SKILL

## 1. Purpose (왜 이 skill이 있냐)

이 레포는 의도적으로 **레거시가 섞여있음**:

- `PROJECTS/CrowdNav/` — 옛 monolith. gitignored 라고 README엔 써있지만 로컬엔 남아있음. 잔여 스크립트(`scratch/test_track.py`)·잔여 데이터(`data/raw/*.jpg`)·잔여 가중치(`yolo26n.pt`) 존재.
- `train/` — 현재 canonical Python 트리. `src/data/`, `src/inference/`, `src/training/`, `scripts/`.
- `application/` — Spring API + React frontend + Python inference stub. 서로 다른 빌드 시스템.
- `infra/` — Docker + SageMaker. 두 갈래의 배포 경로.
- `docs/` — 이미 PRD, TechSpec, System_Architecture, data_pipeline_diagram 등 존재.

새 문서·다이어그램 만들 땐 **이미 있는 문서와 충돌·중복 없도록** 먼저 읽어보고 보강하는 게 원칙임. 새로 만들지 말고 갱신할 수 있으면 갱신.

## 2. When to invoke (언제 발동)

- 사용자가 "디자인 결정", "ADR", "레거시 정리", "아키텍처/시퀀스/플로우 다이어그램" 언급
- 사용자가 두 개 이상 레이어(예: Spring↔Inference, train↔infra)에 걸친 변경을 고민할 때
- `docs/architecture/`·`docs/runbooks/`·`docs/reports/` 안의 파일을 만들거나 수정해달라고 할 때
- `PROJECTS/CrowdNav` 의 파일을 옮기거나 지우자고 할 때 → **반드시 ADR 기록 후 진행**

## 3. Workflow (cookbooks 패턴 기반)

### Step A — Orchestrator pass (한 번만, 분석 시작 전)

먼저 4개 레이어를 **fan-out 으로 병렬 분석**. 각 sub-agent는 prose 가 아닌 **structured artifact**(컴포넌트 목록·진입점·외부 의존성 JSON)만 반환해야 함.

권장 분담:

| Worker | 담당 경로 | 산출물 |
|---|---|---|
| W1 | `train/src/`, `train/scripts/` | YOLO 파이프라인 모듈 그래프, entry points |
| W2 | `application/backend/crowdnav-api/`, `application/inference-service/` | API 엔드포인트 목록, 의존성 |
| W3 | `application/frontend/src/` | 컴포넌트 트리, API 호출 표 |
| W4 | `infra/docker/`, `infra/sagemaker/` | 배포 경로 2개 비교, 환경변수 차이 |
| W5 | `PROJECTS/CrowdNav/` | 잔여 파일 카탈로그 + train/과의 중복 매핑 |

`Agent` 도구의 `general-purpose` subagent_type 으로 위 워커 5개를 **single message 로 병렬** 디스패치. 각 prompt 끝에 "return JSON only, under 200 words" 명시.

### Step B — Synthesis (orchestrator)

워커 JSON 합쳐서 다음 산출물에 매핑:

- **System Architecture 갱신** → `docs/architecture/System_Architecture_Documentation.md` (already exists; **갱신**)
- **Sequence diagram** (런타임 호출 흐름) → `docs/architecture/sequence_<feature>.md` (Mermaid `sequenceDiagram`)
- **Data/training flow** → `docs/architecture/data_pipeline_diagram.md` (already exists; **갱신**)
- **Legacy 카탈로그** → `docs/architecture/LEGACY_CATALOG.md` (W5 결과)
- **ADR** → `docs/decisions/ADR-NNNN-<title>.md` (새 디렉토리, 새 파일)

### Step C — Evaluator-Optimizer (ADR 한정)

ADR 초안 생성 후, **별도의 evaluator 호출**로 다음 5개 항목 critique:

1. Context 가 비전문 reader 도 이해할 수준인가
2. Decision 이 단일 문장으로 명확한가
3. Consequences 에 trade-off (비용·복잡도·리스크) 포함됐는가
4. Alternatives considered 가 최소 2개 있고 reject 사유가 명시됐는가
5. 코드/문서 참조 링크가 살아있는가 (broken 검증)

evaluator 가 fail 표시한 항목은 optimizer 가 한 번 더 갱신. 통과 시에만 사용자에게 리뷰 요청.

## 4. Output structure & 표준 템플릿

### 4.1 ADR 표준 템플릿
```markdown
# ADR-NNNN: <짧은 결정 한 줄>

- Status: Proposed | Accepted | Superseded by ADR-MMMM
- Date: YYYY-MM-DD
- Deciders: <names>

## Context
무엇이 문제였나, 왜 지금 결정해야 하나.

## Decision
한 문장. "We will ___."

## Alternatives Considered
- Option A — pros / cons / reject 사유
- Option B — pros / cons / reject 사유

## Consequences
- Positive: …
- Negative / risks: …
- Follow-up actions / migration steps: …

## References
- Related code: `path/to/file.py:LN`
- Related docs: `docs/...`
- Cookbooks pattern used: <name>
```

### 4.2 Mermaid 다이어그램 종류 가이드
- **Architecture/구조** → `classDiagram` (BDD 스타일, `System_Architecture_Documentation.md` 와 동일 컨벤션)
- **호출 흐름** → `sequenceDiagram` (actor 명시, 비동기 호출은 `-->>`)
- **데이터 처리 단계** → `flowchart LR` (`data_pipeline_diagram.md` 컨벤션)
- **상태 머신**(예: alert 상태) → `stateDiagram-v2`

## 5. Hard rules (금지·강제)

- **금지**: 어떤 파일도 "지움/이동/덮어쓰기" 작업을 ADR 없이 진행 금지. 특히 `PROJECTS/CrowdNav/` 정리는 반드시 ADR 선행.
- **금지**: 다이어그램에 "현재 코드와 다른" 모듈 경로를 그리는 것. 다이어그램은 코드 grep 결과로만 그릴 것.
- **강제**: 모든 새 문서 frontmatter 에 `last_updated`, `related_code`, `related_diagram` 3개 필드 (기존 `docs/PRD.md` 컨벤션 따름).
- **강제**: 5개 이상 모듈을 분석해야 하면 무조건 Orchestrator-Workers 패턴(병렬). 단일 LLM call 로 처리 금지 — 누락·환각 위험.

## 6. 참고 cookbooks 노트북

출처: [anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks)

- `patterns/agents/basic_workflows.ipynb` — Prompt Chaining, Routing, Parallelization
- `patterns/agents/orchestrator_workers.ipynb` — 동적 fan-out / merge (이 skill 의 메인 패턴)
- `patterns/agents/evaluator_optimizer.ipynb` — ADR 품질 review-revise 루프
- `multimodal/using_sub_agents.ipynb` — Haiku worker / Opus orchestrator 비용 분리
- `tool_use/customer_service_agent.ipynb` — canonical tool-use 루프
- `tool_use/calculator_tool.ipynb` — 최소 tool-schema 예제
- 동반 블로그: anthropic.com/research/building-effective-agents (Schluntz & Zhang)

cookbooks README 발췌 (citation 용):

> "minimal implementations of common agent workflows" — `patterns/agents/README.md`

> "Reference implementation for Building Effective Agents" — `patterns/agents/README.md`

> "Learn how to use Haiku as a sub-agent in combination with Opus." — repo root `README.md`

## 7. 처음 발동 시 체크리스트

1. `docs/` 트리 ls → 이미 있는 문서 파악, 중복 생성 회피
2. 사용자에게 "갱신 vs 신규" 의사 확인 (불확실 시)
3. Step A 병렬 분석 dispatch
4. Step B synthesis → 초안 파일 생성
5. ADR 인 경우 Step C evaluator 통과 후 사용자 리뷰 요청
6. 모든 파일 경로는 `D:\UTS\2026-01\Deep Learning\Assignment 3\` 기준 절대경로로 사용자에게 link 제공
