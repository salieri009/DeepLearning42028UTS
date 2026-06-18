import type { ReactNode } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { MapMarker } from "@/features/live-map-markers";
import { UTS_SYDNEY_CENTER } from "@/features/live-map-markers";
import { LiveMapStage } from "./LiveMapStage";

vi.mock("react-map-gl/maplibre", () => ({
  default: ({
    initialViewState,
    children,
  }: {
    initialViewState: { longitude: number; latitude: number; zoom: number };
    children?: ReactNode;
  }) => (
    <div
      data-testid="mock-map"
      data-longitude={initialViewState.longitude}
      data-latitude={initialViewState.latitude}
      data-zoom={initialViewState.zoom}
    >
      {children}
    </div>
  ),
  Marker: () => null,
  NavigationControl: () => null,
}));

const zoneMarker: MapMarker = {
  id: "zone-a4",
  label: "Zone A-4 Congestion",
  lat: -33.8842,
  lng: 151.2018,
  risk: "DANGER",
  capacity: "88% CAPACITY",
  kind: "zone",
};

describe("LiveMapStage", () => {
  it("maps [lat, lng] center tuple to valid maplibre coordinates", () => {
    const [lat, lng] = UTS_SYDNEY_CENTER;

    renderWithProviders(
      <LiveMapStage center={UTS_SYDNEY_CENTER} zoom={16} markers={[zoneMarker]} />,
    );

    const map = screen.getByTestId("mock-map");
    expect(Number(map.getAttribute("data-latitude"))).toBe(lat);
    expect(Number(map.getAttribute("data-longitude"))).toBe(lng);
    expect(Number(map.getAttribute("data-latitude"))).toBeGreaterThanOrEqual(-90);
    expect(Number(map.getAttribute("data-latitude"))).toBeLessThanOrEqual(90);
  });

  it("mentions GPS legend when a user marker is present", () => {
    renderWithProviders(
      <LiveMapStage
        center={[-33.88, 151.2]}
        zoom={17}
        markers={[
          zoneMarker,
          {
            id: "user-position",
            label: "Your location",
            lat: -33.88,
            lng: 151.2,
            risk: "SAFE",
            kind: "user",
          },
        ]}
      />,
    );

    expect(screen.getByText(/Blue pulse = your GPS position/i)).toBeInTheDocument();
  });
});
