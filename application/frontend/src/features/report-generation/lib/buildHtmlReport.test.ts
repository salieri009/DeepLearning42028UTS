import { describe, expect, it } from "vitest";
import { buildHtmlReport } from "./buildHtmlReport";

describe("buildHtmlReport", () => {
  it("renders live report sections", () => {
    const html = buildHtmlReport({
      kind: "live",
      generatedAt: "2026-06-18T00:00:00.000Z",
      sessionId: 7,
      data: {
        persons: [],
        crowd_density: "LOW",
        max_proximity_risk: "SAFE",
        recommendation: "PROCEED",
      },
      latencyMs: 120,
      alerts: [],
    });

    expect(html).toContain("CrowdNav Live Report");
    expect(html).toContain("Session ID");
    expect(html).toContain("PROCEED");
  });

  it("renders archive report with frame trail", () => {
    const html = buildHtmlReport({
      kind: "archive",
      generatedAt: "2026-06-18T00:00:00.000Z",
      session: {
        id: 3,
        source_type: "WEBCAM",
        client_label: "Test",
        started_at: "2026-06-18T00:00:00Z",
        ended_at: "2026-06-18T00:05:00Z",
        frame_count: 1,
        worst_risk: "WARNING",
      },
      frames: [
        {
          id: 1,
          sequence_no: 1,
          person_count: 2,
          crowd_density: "LOW",
          max_proximity_risk: "WARNING",
          captured_at: "2026-06-18T00:01:00Z",
        },
      ],
      stats: { threat: { safe: 80, warn: 20, danger: 0 } },
    });

    expect(html).toContain("Archive Session Report");
    expect(html).toContain("Frame Trail");
    expect(html).toContain("WARNING");
  });
});
