import { describe, expect, it } from "vitest";
import type { DetectionItem, SessionDetailResponse } from "@/entities/session";
import {
  computeMaxCrowdDensity,
  computeThreatDistribution,
  countAnomalies,
  filterSessions,
  withinDateRange,
} from "./sessionArchiveUtils";

const baseSession = (overrides: Partial<SessionDetailResponse> = {}): SessionDetailResponse => ({
  id: 1,
  started_at: new Date().toISOString(),
  ended_at: null,
  client_label: "demo",
  source_type: "WEBCAM",
  frame_count: 10,
  avg_latency_ms: 120,
  worst_risk: "SAFE",
  ...overrides,
});

describe("withinDateRange", () => {
  it("includes recent sessions for 24h filter", () => {
    const recent = new Date().toISOString();
    expect(withinDateRange(recent, "24h")).toBe(true);
  });

  it("excludes old sessions for 24h filter", () => {
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    expect(withinDateRange(old, "24h")).toBe(false);
  });
});

describe("filterSessions", () => {
  it("filters by risk and source", () => {
    const sessions = [
      baseSession({ id: 1, worst_risk: "DANGER", source_type: "WEBCAM" }),
      baseSession({ id: 2, worst_risk: "SAFE", source_type: "MOCK" }),
    ];

    const filtered = filterSessions(sessions, "30d", "DANGER", "WEBCAM");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe(1);
  });
});

describe("detection stats", () => {
  const detections: DetectionItem[] = [
    {
      frame_id: 1,
      sequence_no: 1,
      captured_at: "2026-06-17T00:00:00Z",
      class: "person",
      confidence: 0.9,
      proximity_risk: "SAFE",
      x_center: 0.5,
      y_center: 0.5,
      width: 0.1,
      height: 0.2,
    },
    {
      frame_id: 1,
      sequence_no: 2,
      captured_at: "2026-06-17T00:00:00Z",
      class: "person",
      confidence: 0.8,
      proximity_risk: "DANGER",
      x_center: 0.4,
      y_center: 0.4,
      width: 0.1,
      height: 0.2,
    },
    {
      frame_id: 2,
      sequence_no: 3,
      captured_at: "2026-06-17T00:00:01Z",
      class: "person",
      confidence: 0.7,
      proximity_risk: "WARNING",
      x_center: 0.3,
      y_center: 0.3,
      width: 0.1,
      height: 0.2,
    },
  ];

  it("computes threat distribution from detections", () => {
    expect(computeThreatDistribution(detections)).toEqual({
      safe: 33,
      warn: 33,
      danger: 33,
    });
  });

  it("computes max crowd density per frame", () => {
    expect(computeMaxCrowdDensity(detections)).toBe(2);
  });

  it("counts danger anomalies", () => {
    expect(countAnomalies(detections)).toBe(1);
  });
});
