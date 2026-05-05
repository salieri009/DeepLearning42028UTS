# ADR-0002: Backend runtime = Spring Boot

- **Status**: Accepted
- **Date**: 2026-05-05
- **Deciders**: Jungwook (사용자), Claude (Cowork mode)
- **Branch**: `docs/design-decisions`

## Context

DESIGN.md §4.1 에 미해결로 등록된 문제. 워커 분석(W2) 결과:

- `application/backend/crowdnav-api/` — Spring Boot 3.5.6, 단일 엔드포인트 `POST /api/v1/analyze-frame`, 빌드 도구 Gradle
- `application/inference-service/main.py` — FastAPI 0.115 stub, `/health` + `/internal/infer` 만 존재, 모델 로드 미구현
- `RemoteAnalyzeFrameService` 가 **`NOT_IMPLEMENTED` throw** 상태
- `application.yml` 에 `app.inference.mode=mock` — 현재 mock 만 동작, FastAPI 는 호출되지 않음

backend 의 정체성(Spring? FastAPI? sidecar?)을 확정하지 않으면 frontend 통합·배포·모델 호스팅 결정이 모두 막힘.

## Decision

**We will keep Spring Boot as the single backend of record. The Python `inference-service` 는 별도 마이크로서비스가 아닌, Spring 이 호출하는 _내부 추론 어댑터_ 로만 존재하며 Docker 패키지 안에 함께 번들된다.**

## Alternatives Considered

- **Option A — FastAPI 단일화 (Spring 폐기)**
  - pros: ML 생태계와 동일 언어, YOLO/torch 직접 호출, latency 단순
  - cons: 학생 팀이 Spring 코드를 이미 작성·테스트 완료. 기존 Spring 컨트롤러·DTO·테스트 코드 폐기 손실 큼
  - reject: 작업물 보존 + Java/Spring 학습 가치 + 사용자 명시 결정 ("backend 는 Spring 으로")
- **Option B — Spring sidecar 안에 Python 임베드 (Jython/GraalPy)**
  - pros: 단일 프로세스, 네트워크 호출 제거
  - cons: torch + ultralytics 가 Jython/GraalPy 호환 불확실, 디버깅 난이도 폭증
  - reject: 학기 단위 프로젝트에 비현실적
- **Option C (선택됨) — Spring + FastAPI inference-service 어댑터, Docker 한 컴포즈로 패키징**
  - pros: 각 언어가 강점만 사용 (Spring=웹 API/검증, Python=YOLO 추론), 명확한 HTTP 계약
  - cons: 두 컨테이너 관리 비용, latency 한 hop 증가
  - selected

## Consequences

- **Positive**:
  - Spring 컨트롤러·DTO·테스트 모두 보존
  - inference-service 가 "stub 만 있는 미완성 서비스" 가 아니라 "Spring 의 내부 추론 어댑터" 라는 명확한 역할을 가짐
  - YOLO 모델 교체 시 Spring 코드 변경 없이 inference-service 만 갱신
- **Negative / risks**:
  - Docker compose 가 두 서비스 (api + inference-service) 를 띄워야 함 → ADR-0003 와 결합
  - 500ms 폴링 × 두 hop = latency 합산 모니터링 필요
  - inference-service 컨테이너 health check 필요 (Spring 이 startup probe)
- **Follow-up actions**:
  1. `application/inference-service/main.py` 의 `/internal/infer` 실제 구현 (best.pt 로드 + ultralytics predict)
  2. `RemoteAnalyzeFrameService` 의 `NOT_IMPLEMENTED` 제거하고 WebClient 로 inference-service 호출
  3. `application.yml` 에 `app.inference.mode=remote` 옵션 활성화 + `app.inference.url` 설정
  4. inference-service `/health` 를 Spring readiness check 에 연결
  5. ADR-0003 (Docker 패키징) 와 묶어서 진행

## References

- Related code:
  - `application/backend/crowdnav-api/src/main/java/com/crowdnav/api/service/RemoteAnalyzeFrameService.java`
  - `application/backend/crowdnav-api/src/main/resources/application.yml`
  - `application/inference-service/main.py`
- Related docs:
  - `docs/DESIGN.md` §2.2, §4.1
  - `docs/architecture/LEGACY_CATALOG.md` §4
- Cookbooks pattern used: 해당 없음 (코드 분석 패턴은 W2 워커가 이미 사용)
