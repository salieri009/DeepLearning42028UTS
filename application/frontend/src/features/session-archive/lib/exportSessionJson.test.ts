import { describe, expect, it } from "vitest";
import type { DetectionItem, FrameItem, SessionDetailResponse } from "@/entities/session";
import { buildSessionExportBundle } from "./exportSessionJson";

const session: SessionDetailResponse = {
  id: 42,
  started_at: "2026-06-18T00:00:00Z",
  ended_at: "2026-06-18T01:00:00Z",
  client_label: "demo",
  source_type: "WEBCAM",
  frame_count: 2,
  avg_latency_ms: 120,
  worst_risk: "WARNING",
};

describe("buildSessionExportBundle", () => {
  it("includes session, frames, and detections for archive export", () => {
    const frames: FrameItem[] = [
      {
        id: 1,
        sequence_no: 1,
        captured_at: "2026-06-18T00:01:00Z",
        latency_ms: 110,
        crowd_density: "LOW",
        max_proximity_risk: "SAFE",
        recommendation: "PROCEED",
        person_count: 1,
      },
    ];
    const detections: DetectionItem[] = [
      {
        frame_id: 1,
        sequence_no: 1,
        captured_at: "2026-06-18T00:01:00Z",
        class: "person",
        confidence: 0.9,
        proximity_risk: "SAFE",
        x_center: 0.5,
        y_center: 0.5,
        width: 0.1,
        height: 0.2,
      },
    ];

    const bundle = buildSessionExportBundle(session, frames, detections);

    expect(bundle.session.id).toBe(42);
    expect(bundle.frames).toHaveLength(1);
    expect(bundle.detections).toHaveLength(1);
    expect(bundle.exported_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
