import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

const getUserMediaMock = vi.fn(async () => ({
  getTracks: () => [{ stop: () => undefined }],
}));

Object.defineProperty(globalThis.navigator, "mediaDevices", {
  configurable: true,
  value: {
    getUserMedia: getUserMediaMock,
  },
});

export { getUserMediaMock };
