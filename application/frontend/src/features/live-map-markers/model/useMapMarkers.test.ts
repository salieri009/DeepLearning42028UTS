import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SessionDetailResponse, SessionListResponse } from "@/entities/session";
import { useMapMarkers } from "./useMapMarkers";

vi.mock("@/features/geolocation", () => ({
  useGeolocation: () => ({
    position: { lat: -33.885, lng: 151.201 },
    status: "ready",
    error: null,
  }),
}));

vi.mock("@/shared/api", () => ({
  listSessions: vi.fn(),
  getSession: vi.fn(),
}));

import { getSession, listSessions } from "@/shared/api";

const listSessionsMock = vi.mocked(listSessions);
const getSessionMock = vi.mocked(getSession);

function detail(id: number, worst: SessionDetailResponse["worst_risk"]): SessionDetailResponse {
  return {
    id,
    started_at: new Date().toISOString(),
    ended_at: null,
    client_label: "CrowdNav Dashboard",
    source_type: "WEBCAM",
    frame_count: 25,
    avg_latency_ms: 120,
    worst_risk: worst,
  };
}

describe("useMapMarkers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSessionsMock.mockResolvedValue({
      items: [{ id: 9, started_at: new Date().toISOString(), ended_at: null, client_label: "x", source_type: "WEBCAM" }],
      total: 1,
    } satisfies SessionListResponse);
    getSessionMock.mockResolvedValue(detail(9, "WARNING"));
  });

  it("builds user and zone markers from session telemetry", async () => {
    const { result } = renderHook(() => useMapMarkers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.markers.some((marker) => marker.kind === "user")).toBe(true);
    expect(result.current.markers.some((marker) => marker.id === "zone-a4")).toBe(true);
    expect(result.current.center).toEqual([-33.885, 151.201]);
    expect(result.current.isLive).toBe(true);
    expect(result.current.nearCampus).toBe(true);
  });

  it("survives a single getSession failure via fallback", async () => {
    getSessionMock.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => useMapMarkers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.markers.some((marker) => marker.id === "zone-a4")).toBe(true);
  });
});
