import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SideNav } from "./SideNav";

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

  it("links Analytics, Traffic, Sensors, and Logs to their routes", () => {
    renderSideNav("/analytics", "analytics");

    expect(screen.getByRole("link", { name: /Analytics/i, hidden: true })).toHaveAttribute("href", "/analytics");
    expect(screen.getByRole("link", { name: /Traffic/i, hidden: true })).toHaveAttribute("href", "/live-map");
    expect(screen.getByRole("link", { name: /Sensors/i, hidden: true })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: /Logs/i, hidden: true })).toHaveAttribute("href", "/archive");
  });

  it("keeps Health and Assets disabled", () => {
    renderSideNav("/analytics", "analytics");

    expect(screen.getByRole("button", { name: /Health/i, hidden: true })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Assets/i, hidden: true })).toBeDisabled();
  });

  it("keeps Help and Logout disabled", () => {
    renderSideNav("/analytics", "analytics");

    expect(screen.getByRole("button", { name: /Help/i, hidden: true })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Logout/i, hidden: true })).toBeDisabled();
  });
});
