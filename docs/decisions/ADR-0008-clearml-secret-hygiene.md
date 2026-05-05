# ADR-0008: ClearML secret hygiene — no plaintext on disk

- **Status**: Accepted
- **Date**: 2026-05-05
- **Deciders**: Jungwook (사용자), Claude (Cowork mode)
- **Branch**: `docs/design-decisions`

## Context

워커(W5) 분석 결과, `PROJECTS/CrowdNav/.env` 파일에 ClearML 인증정보 5개가 평문으로 존재:

- `CLEARML_WEB_HOST`
- `CLEARML_API_HOST`
- `CLEARML_FILES_HOST`
- `CLEARML_API_ACCESS_KEY`
- `CLEARML_API_SECRET_KEY`

**Git 히스토리 검증**: `git log --all --full-history --diff-filter=A -- "**/.env"` 결과 — `.env` 파일은 **한 번도 커밋된 적 없음**. 추적되는 secret 관련 파일은 `train/.env.example` 뿐. `.gitignore` 의 line 10 에 `.env` 등록 확인.

→ **외부 노출 위험은 낮음** (로컬 디스크에만 존재). 하지만 사용자 정책: "ClearML 는 평문 노출 되서는 안됨" — 평문 disk 보관도 금지 대상.

## Decision

**We will eliminate plaintext ClearML credentials from the working tree. Real keys live only in OS-level secret stores (clearml-init managed config, env vars, or CI secret manager). The repo only ships `.env.example` files documenting which keys are needed.**

## Alternatives Considered

- **Option A — `.env` 그대로 두되 .gitignore 만 신뢰**
  - pros: 변경 없음
  - cons: 사용자 정책 위반, accidental `git add -f` 시 노출 위험, IDE 검색에 평문 노출
  - reject: 사용자 명시 거부
- **Option B — Vault/AWS Secrets Manager 도입**
  - pros: 엔터프라이즈급
  - cons: 학기 단위 프로젝트에 과도, 학생 셋업 마찰
  - reject: scope creep
- **Option C (선택됨) — `clearml-init` 의 `~/.clearml.conf` + `.env.example` 만 repo 에 둠**
  - pros: ClearML 권장 방식, 사용자별 머신에 분리, 평문 disk 노출 zero (홈 디렉토리는 대상 외)
  - cons: 신규 컨트리뷰터가 `clearml-init` 한 번 돌려야 함 (이미 README 에 있음)
  - selected

## Consequences

- **Positive**:
  - 워킹트리에 평문 ClearML 키 0
  - 신규 멤버 셋업 절차가 README ↔ 코드 일치 (이미 README 에 `clearml-init` 안내 있음)
  - CI 환경에서는 GitHub Actions secrets 로 주입 (이미 `.github/workflows/train-pipeline.yml` 가 secrets 사용 중일 것 — 검증 필요)
- **Negative / risks**:
  - 기존 `PROJECTS/CrowdNav/.env` 를 단순 `rm` 하면 사용자 로컬 환경 깨짐 → **삭제 전 키를 `~/.clearml.conf` 또는 keyring 으로 이전 필수**
  - 다른 멤버 머신에도 같은 평문 .env 있을 수 있음 → 팀 공지 필요
- **Follow-up actions** (사용자 직접 실행 항목 ⚠️):
  1. **(사용자)** `clearml-init` 또는 ClearML 웹 UI 에서 현재 키가 살아있는지 확인
  2. **(사용자)** 키를 `~/.clearml.conf` 로 이전 (`clearml-init` 대화형 입력 또는 직접 편집)
  3. **(사용자)** 외부 노출 의심되면 ClearML 웹 UI 에서 key rotate
  4. **(사용자)** `PROJECTS/CrowdNav/.env` 삭제 — git tracked 아니므로 working tree rm 만:
     ```bash
     rm "PROJECTS/CrowdNav/.env"
     ```
  5. **(Claude/repo)** `.gitignore` 의 `.env` 패턴이 모든 하위 폴더에 적용되는지 확인 (현재 `.env` 만 → 충분)
  6. **(Claude/repo)** `train/.env.example` 가 ClearML 키 5개를 모두 문서화하는지 확인하고 보강
  7. **(팀)** 같은 평문 .env 가 다른 머신에 있는지 확인 후 동일 절차 적용
- **Verification**:
  - `git log --all --full-history -- "**/.env"` 가 빈 결과여야 함 (이미 검증됨, 2026-05-05)
  - 작업 후 `rg -i "clearml.*api.*(access|secret)" --hidden -g '!*.example' -g '!docs/decisions/'` 로 평문 키 잔존 검색

## References

- Related code:
  - `PROJECTS/CrowdNav/.env` (제거 대상)
  - `train/.env.example`
  - `train/src/utils/clearml_setup.py`
- Related docs:
  - `docs/DESIGN.md` §3, §4 (간접)
  - `docs/architecture/LEGACY_CATALOG.md` §1.3
- ClearML 문서: https://clear.ml/docs/latest/docs/configs/clearml_conf
- Cookbooks pattern used: 해당 없음
