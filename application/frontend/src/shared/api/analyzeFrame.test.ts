import { describe, expect, it, vi } from "vitest";
import { analyzeFrame } from "./analyzeFrame";
import { apiClient } from "./client";

vi.mock("./client", () => ({
  apiClient: {
    post: vi.fn(async () => ({ data: {} })),
  },
}));

describe("analyzeFrame API", () => {
  it("includes session_id when provided", async () => {
    vi.mocked(apiClient.post).mockClear();
    await analyzeFrame("abc123", 42);

    expect(apiClient.post).toHaveBeenCalledWith("/v1/analyze-frame", {
      frame_base64: "abc123",
      session_id: 42,
    });
  });

  it("omits session_id when not provided", async () => {
    vi.mocked(apiClient.post).mockClear();
    await analyzeFrame("abc123");

    expect(apiClient.post).toHaveBeenCalledWith("/v1/analyze-frame", {
      frame_base64: "abc123",
    });
  });
});
