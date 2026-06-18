import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { HotspotMarker } from "@/entities/analytics";
import { renderWithProviders } from "@/test/renderWithProviders";
import { RiskHotspotMap } from "./RiskHotspotMap";

vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div data-testid="geo-map">{children}</div>,
  Marker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

const hotspots: HotspotMarker[] = [
  {
    id: "zone-a4",
    label: "Zone A-4 Congestion",
    metricLabel: "12 danger frames",
    risk: "DANGER",
    lat: -33.8842,
    lng: 151.2018,
  },
];

describe("RiskHotspotMap", () => {
  it("renders geographic hotspot legend and map", () => {
    renderWithProviders(<RiskHotspotMap hotspots={hotspots} />);

    expect(screen.getByText("Risk Hotspot Map")).toBeInTheDocument();
    expect(screen.getByTestId("geo-map")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Zone A-4 Congestion, DANGER risk, 12 danger frames/i }),
    ).toBeInTheDocument();
  });
});
