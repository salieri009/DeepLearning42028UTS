import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SideNav } from "./SideNav";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    getBackendHealth: vi.fn().mockResolvedValue({ status: "UP" }),
    getBackendReadiness: vi.fn().mockResolvedValue({ status: "UP", components: { db: { status: "UP" } } }),
    getSettingsModelLabel: vi.fn().mockResolvedValue("yolov8-precise"),
  };
});

function renderSideNav(
  path = "/analytics",
  activeItem: "analytics" | "traffic" | "logs" | "sensors" = "analytics",
) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <SideNav activeItem={activeItem} />
    </MemoryRouter>,
  );
}

describe("SideNav", () => {
  it("links Security to dashboard", () => {
    renderSideNav("/analytics", "analytics");

    expect(screen.getByRole("link", { name: /Security/i, hidden: true })).toHaveAttribute("href", "/");
  });

  it("links Analytics, Traffic, Sensors, and Archive to their routes", () => {
    renderSideNav("/analytics", "analytics");

    expect(screen.getByRole("link", { name: /Analytics/i, hidden: true })).toHaveAttribute("href", "/analytics");
    expect(screen.getByRole("link", { name: /Traffic/i, hidden: true })).toHaveAttribute("href", "/live-map");
    expect(screen.getByRole("link", { name: /Sensors/i, hidden: true })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: /Archive/i, hidden: true })).toHaveAttribute("href", "/archive");
  });

  it("opens Health and Assets panels", async () => {
    const user = userEvent.setup();
    renderSideNav("/analytics", "analytics");

    await user.click(screen.getByRole("button", { name: /Health/i, hidden: true }));
    expect(screen.getByRole("dialog", { name: /System Health/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Close dialog/i }));
    await user.click(screen.getByRole("button", { name: /Assets/i, hidden: true }));
    expect(screen.getByRole("dialog", { name: /Deployed Assets/i })).toBeInTheDocument();
  });

  it("opens Help and clears local data on Logout", async () => {
    const user = userEvent.setup();
    localStorage.setItem("crowdnav.sensor-settings.v1", "{}");
    renderSideNav("/analytics", "analytics");

    await user.click(screen.getByRole("button", { name: /Help/i, hidden: true }));
    expect(screen.getByRole("dialog", { name: /CrowdNav Help/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Close dialog/i }));
    await user.click(screen.getByRole("button", { name: /Logout/i, hidden: true }));
    expect(localStorage.getItem("crowdnav.sensor-settings.v1")).toBeNull();
  });
});
