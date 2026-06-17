import { describe, expect, it } from "vitest";
import { DEFAULT_CAPTURE_INTERVAL_MS } from "./useCrowdDetection";

describe("useCrowdDetection defaults", () => {
  it("defaults capture interval to 500 ms (NFR-2)", () => {
    expect(DEFAULT_CAPTURE_INTERVAL_MS).toBe(500);
  });
});
