import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionRecording } from "./useSessionRecording";

class MockMediaRecorder {
  static isTypeSupported = vi.fn(() => true);
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  state: RecordingState = "inactive";
  mimeType = "video/webm";

  constructor(_stream: MediaStream, _options?: MediaRecorderOptions) {}

  start() {
    this.state = "recording";
    this.ondataavailable?.({ data: new Blob(["chunk"], { type: "video/webm" }) });
  }

  stop() {
    this.state = "inactive";
    this.onstop?.();
  }
}

describe("useSessionRecording", () => {
  beforeEach(() => {
    vi.stubGlobal("MediaRecorder", MockMediaRecorder as unknown as typeof MediaRecorder);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return { click: vi.fn(), href: "", download: "" } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts and stops recording on a media stream", () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const { result } = renderHook(() => useSessionRecording());

    act(() => {
      result.current.startRecording(stream);
    });
    expect(result.current.recording).toBe(true);

    act(() => {
      result.current.stopRecording(false);
    });
    expect(result.current.recording).toBe(false);
  });

  it("toggles recording off when already recording", () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const { result } = renderHook(() => useSessionRecording());

    act(() => {
      result.current.toggleRecording(stream);
    });
    expect(result.current.recording).toBe(true);

    act(() => {
      result.current.toggleRecording(stream);
    });
    expect(result.current.recording).toBe(false);
  });
});
