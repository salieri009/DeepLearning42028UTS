import { describe, expect, it } from "vitest";
import { formatLatencyBadge } from "./formatStatValue";

describe("formatLatencyBadge", () => {
  it("returns null when latency is unknown", () => {
    expect(formatLatencyBadge(null)).toBeNull();
  });

  it("labels optimal latency at or below 500ms", () => {
    expect(formatLatencyBadge(500)).toEqual({ label: "OPTIMAL", variant: "safe" });
    expect(formatLatencyBadge(120)).toEqual({ label: "OPTIMAL", variant: "safe" });
  });

  it("labels slow latency between 501ms and 800ms", () => {
    expect(formatLatencyBadge(501)).toEqual({ label: "SLOW", variant: "warning" });
    expect(formatLatencyBadge(800)).toEqual({ label: "SLOW", variant: "warning" });
  });

  it("labels high latency above 800ms", () => {
    expect(formatLatencyBadge(801)).toEqual({ label: "HIGH", variant: "danger" });
  });
});
