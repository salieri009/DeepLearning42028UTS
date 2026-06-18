import { describe, expect, it } from "vitest";
import { mapAnalyticsSummary } from "@/shared/api/analytics";

describe("mapAnalyticsSummary", () => {
  it("maps snake_case API payload to UI shape", () => {
    const mapped = mapAnalyticsSummary({
      safety_score: 82,
      safety_label: "Nominal",
      trend_percent: 4.2,
      event_count: 3,
      busiest_window: "14:00",
      peak_hours: [{ label: "14:00", height_percent: 100, peak: true }],
      zone_risks: [{ name: "Webcam sessions (source type)", level: "LOW RISK", percent: 12, synthetic: true }],
      hotspots: [
        {
          id: "session-1",
          label: "demo (illustrative layout)",
          capacity: "3 danger frames",
          risk: "DANGER",
          top: "20%",
          left: "25%",
          synthetic: true,
        },
      ],
      frame_count: 10,
      session_count: 2,
    });

    expect(mapped.safetyScore).toBe(82);
    expect(mapped.peakHours[0]?.heightPercent).toBe(100);
    expect(mapped.zoneRisks[0]?.name).toBe("Webcam sessions (source type)");
    expect(mapped.zoneRisks[0]?.synthetic).toBe(true);
    expect(mapped.hotspots[0]?.risk).toBe("DANGER");
    expect(mapped.hotspots[0]?.synthetic).toBe(true);
    expect(mapped.frameCount).toBe(10);
  });
});
