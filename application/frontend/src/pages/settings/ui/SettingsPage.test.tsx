import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@/entities/sensor";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SettingsPage } from "./SettingsPage";

describe("SettingsPage UX", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders save actions disabled until a setting changes", () => {
    renderWithProviders(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /Save Changes/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Discard Changes/i })).toBeDisabled();
  });

  it("marks dirty and persists audible alerts opt-in on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    const audibleToggle = screen.getByRole("checkbox", { name: /Audible Risk Alerts/i });
    expect(audibleToggle).not.toBeChecked();

    await user.click(audibleToggle);
    expect(screen.getByRole("button", { name: /Save Changes/i })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    const stored = JSON.parse(localStorage.getItem("crowdnav.sensor-settings.v1") ?? "{}");
    expect(stored.audibleAlerts).toBe(true);
    expect(stored.audibleAlerts).not.toBe(DEFAULT_SETTINGS.audibleAlerts);
  });

  it("keeps Add Source disabled as placeholder", () => {
    renderWithProviders(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /Add Source/i })).toBeDisabled();
  });
});
