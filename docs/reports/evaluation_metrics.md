---
last_updated: 2026-06-18
related:
  - docs/REQUIREMENTS.md
  - application/backend/crowdnav-api/src/test/java/com/crowdnav/api/NfrLatencyMockTest.java
---

# Evaluation Metrics

## 4. Runtime performance (NFR-1 / NFR-2)

### 4.1 Targets

| ID | Metric | Target | PRD ref |
|----|--------|--------|---------|
| NFR-1 | End-to-end `analyze-frame` latency | **< 500 ms** per frame | PRD §5.3, §8 |
| NFR-2 | Sustained capture throughput | **≥ 2 FPS** (500 ms interval) | PRD §5.3 |

### 4.2 Mock-mode latency benchmark (NFR-1)

Automated gate: [`NfrLatencyMockTest.java`](../../application/backend/crowdnav-api/src/test/java/com/crowdnav/api/NfrLatencyMockTest.java)

- **Mode:** Spring Boot `app.inference.mode=mock` (no GPU)
- **Method:** 5 warmup + 50 timed `POST /api/v1/analyze-frame` JSON requests
- **Pass criterion:** average round-trip **< 500 ms**
- **Purpose:** Validates backend + serialization overhead stays within budget so the frontend 500 ms loop (NFR-2) can keep pace.

> **Note:** Remote-mode latency (Spring → FastAPI → YOLO on GPU) should be measured separately on the Docker stack with `application/models/best.pt` present. Record p50/p95 in this section when hardware benchmark is run.

### 4.3 Frontend latency display

`useCrowdDetection` records client-measured round-trip (`latencyMs`) and `StatsSidebar` displays it during live monitoring.

## 5. Detection accuracy (NFR-3)

See [`Final_Training_Report.md`](Final_Training_Report.md) — val mAP@0.5 **0.4475**, test **0.6361** (person class, Phase C).
