import { describe, expect, it } from "vitest";
import { formatAlertMetaLine } from "./formatAlertMeta";
import type { AlertEntry } from "../model/useAlertHistory";

describe("formatAlertMetaLine", () => {
  it("shows timestamp and risk level without fabricated percent", () => {
    const entry: AlertEntry = {
      id: "1",
      message: "Critical proximity: STOP",
      risk: "DANGER",
      timestamp: new Date("2026-06-18T10:15:30"),
    };

    expect(formatAlertMetaLine(entry)).toMatch(/DANGER$/);
    expect(formatAlertMetaLine(entry)).not.toContain("%");
  });
});
