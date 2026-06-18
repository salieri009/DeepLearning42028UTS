import { describe, expect, it, vi } from "vitest";
import type { DetectionItem, FrameItem, SessionDetailResponse } from "@/entities/session";
import {
  buildPreviewStats,
  computeMaxCrowdDensity,
  computeMaxPersonCountFromFrames,
  computeThreatDistribution,
  computeThreatDistributionFromFrames,
  confirmTruncatedExport,
  countAnomalies,
  countDangerFrames,
  dateRangeToDays,
  detectPreviewTruncation,
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

describe("frame stats (backend aggregates)", () => {
  const frames: FrameItem[] = [
    {
      id: 1,
      sequence_no: 0,
      captured_at: "2026-06-17T00:00:00Z",
      latency_ms: 120,
      crowd_density: "LOW",
      max_proximity_risk: "SAFE",
      recommendation: "PROCEED",
      person_count: 1,
    },
    {
      id: 2,
      sequence_no: 1,
      captured_at: "2026-06-17T00:00:01Z",
      latency_ms: 130,
      crowd_density: "MEDIUM",
      max_proximity_risk: "DANGER",
      recommendation: "STOP",
      person_count: 3,
    },
    {
      id: 3,
      sequence_no: 2,
      captured_at: "2026-06-17T00:00:02Z",
      latency_ms: 110,
      crowd_density: "LOW",
      max_proximity_risk: "WARNING",
      recommendation: "CAUTION",
      person_count: 2,
    },
  ];

  it("computes threat distribution from frame max_proximity_risk", () => {
    expect(computeThreatDistributionFromFrames(frames)).toEqual({
      safe: 33,
      warn: 33,
      danger: 33,
    });
  });

  it("computes max person count from frame aggregates", () => {
    expect(computeMaxPersonCountFromFrames(frames)).toBe(3);
  });

  it("counts danger frames", () => {
    expect(countDangerFrames(frames)).toBe(1);
  });
});

describe("preview truncation", () => {
  it("flags when limits are reached", () => {
    expect(detectPreviewTruncation(500, 100, 150)).toEqual({
      detections: true,
      frames: true,
    });
    expect(detectPreviewTruncation(10, 5, 5)).toEqual({
      detections: false,
      frames: false,
    });
    expect(detectPreviewTruncation(10, 100, 50)).toEqual({
      detections: false,
      frames: false,
    });
  });
});

describe("buildPreviewStats", () => {
  const frames: FrameItem[] = [
    {
      id: 1,
      sequence_no: 0,
      captured_at: "2026-06-17T00:00:00Z",
      latency_ms: 120,
      crowd_density: "LOW",
      max_proximity_risk: "SAFE",
      recommendation: "PROCEED",
      person_count: 1,
    },
    {
      id: 2,
      sequence_no: 1,
      captured_at: "2026-06-17T00:00:01Z",
      latency_ms: 130,
      crowd_density: "MEDIUM",
      max_proximity_risk: "DANGER",
      recommendation: "STOP",
      person_count: 3,
    },
  ];

  it("marks stats partial when loaded frames are fewer than session frame_count", () => {
    const stats = buildPreviewStats(frames, baseSession({ frame_count: 50, worst_risk: "DANGER" }));
    expect(stats.statsPartial).toBe(true);
    expect(stats.sessionWorstRisk).toBe("DANGER");
    expect(stats.anomalies).toBe(1);
  });

  it("marks stats complete when all frames are loaded", () => {
    const stats = buildPreviewStats(frames, baseSession({ frame_count: 2, worst_risk: "DANGER" }));
    expect(stats.statsPartial).toBe(false);
    expect(stats.sessionWorstRisk).toBe("DANGER");
  });
});

describe("dateRangeToDays", () => {
  it("maps archive presets to API days", () => {
    expect(dateRangeToDays("24h")).toBe(1);
    expect(dateRangeToDays("7d")).toBe(7);
    expect(dateRangeToDays("30d")).toBe(30);
    expect(dateRangeToDays("custom")).toBeUndefined();
  });
});

describe("confirmTruncatedExport", () => {
  it("returns true without confirm when export is complete", () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    expect(confirmTruncatedExport(baseSession({ frame_count: 10 }), 10, 10)).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("prompts when frame export is truncated", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    expect(confirmTruncatedExport(baseSession({ frame_count: 200 }), 10, 100)).toBe(false);
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining("frames capped at 100 of 200"),
    );
    confirmSpy.mockRestore();
  });
});
