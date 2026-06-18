import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { HotspotMarker } from "@/entities/analytics";
import { renderWithProviders } from "@/test/renderWithProviders";
import { RiskHotspotMap } from "./RiskHotspotMap";

const hotspots: HotspotMarker[] = [
  {
    id: "a1",
    label: "Zone A",
    metricLabel: "80 danger frames",
    risk: "DANGER",
    top: "30%",
    left: "40%",
  },
];

describe("RiskHotspotMap HUD buttons", () => {
  it("toggles layers visibility", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RiskHotspotMap hotspots={hotspots} />);

    expect(screen.getByText("Session Danger Hotspots")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Layers" }));
    expect(screen.queryByText("Session Danger Hotspots")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Layers" }));
    expect(screen.getByText("Session Danger Hotspots")).toBeInTheDocument();
  });

  it("disables zoom in at max zoom", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RiskHotspotMap hotspots={hotspots} />);

    const zoomIn = screen.getByRole("button", { name: "Zoom in" });
    await user.click(zoomIn);
    await user.click(zoomIn);
    await user.click(zoomIn);
    await user.click(zoomIn);

    expect(zoomIn).toBeDisabled();
  });

  it("resets view with my location", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RiskHotspotMap hotspots={hotspots} />);

    const zoomIn = screen.getByRole("button", { name: "Zoom in" });
    const reset = screen.getByRole("button", { name: "My location" });

    await user.click(zoomIn);
    expect(reset).toBeEnabled();

    await user.click(reset);
    expect(zoomIn).toBeEnabled();
    expect(reset).toBeDisabled();
  });
});
