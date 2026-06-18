import { describe, expect, it } from "vitest";
import type { SessionDetailResponse } from "@/entities/session";
import {
  aggregateSessionMetrics,
  buildZoneMarkers,
  isNearCampus,
  maxProximityRisk,
  pickActiveSession,
  ZONE_ANCHORS,
} from "./mapMarkerUtils";

function session(partial: Partial<SessionDetailResponse>): SessionDetailResponse {
  return {
    id: 1,
    started_at: new Date().toISOString(),
    ended_at: null,
    client_label: "test",
    source_type: "WEBCAM",
    frame_count: 0,
    avg_latency_ms: null,
    worst_risk: null,
    ...partial,
  };
}

describe("mapMarkerUtils", () => {
  it("maxProximityRisk picks the highest severity", () => {
    expect(maxProximityRisk(["SAFE", "WARNING", "DANGER"])).toBe("DANGER");
    expect(maxProximityRisk(["SAFE", null])).toBe("SAFE");
  });

  it("aggregateSessionMetrics returns safe defaults without frame data", () => {
    const metrics = aggregateSessionMetrics([session({ frame_count: 0 })]);
    expect(metrics.worstRisk).toBe("SAFE");
    expect(metrics.capacityPct).toBe(18);
    expect(metrics.activeCount).toBe(0);
  });

  it("aggregateSessionMetrics elevates risk from active sessions", () => {
    const metrics = aggregateSessionMetrics([
      session({ id: 1, frame_count: 40, worst_risk: "DANGER", ended_at: null }),
      session({ id: 2, frame_count: 20, worst_risk: "WARNING", ended_at: "2026-06-18T00:00:00Z" }),
    ]);

    expect(metrics.worstRisk).toBe("DANGER");
    expect(metrics.activeCount).toBe(1);
    expect(metrics.capacityPct).toBeGreaterThan(50);
  });

  it("buildZoneMarkers scales congestion by anchor factor", () => {
    const metrics = aggregateSessionMetrics([
      session({ frame_count: 30, worst_risk: "WARNING", ended_at: null }),
    ]);
    const markers = buildZoneMarkers(metrics, ZONE_ANCHORS);
    const zoneA4 = markers.find((marker) => marker.id === "zone-a4");

    expect(markers).toHaveLength(3);
    expect(zoneA4?.risk).not.toBe("SAFE");
    expect(zoneA4?.capacity).toMatch(/% CAPACITY$/);
  });

  it("isNearCampus is true at campus center and false far away", () => {
    expect(isNearCampus(-33.8834, 151.2005)).toBe(true);
    expect(isNearCampus(0, 0)).toBe(false);
  });

  it("pickActiveSession chooses the highest-risk active session", () => {
    const picked = pickActiveSession([
      session({ id: 1, frame_count: 10, worst_risk: "SAFE", ended_at: null }),
      session({ id: 2, frame_count: 10, worst_risk: "DANGER", ended_at: null }),
    ]);
    expect(picked?.id).toBe(2);
  });
});
