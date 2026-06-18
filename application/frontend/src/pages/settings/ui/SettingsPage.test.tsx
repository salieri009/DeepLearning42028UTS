import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "@/entities/sensor";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SettingsPage } from "./SettingsPage";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    getSettings: vi.fn().mockResolvedValue(DEFAULT_SETTINGS),
    updateSettings: vi.fn().mockImplementation(async (settings) => settings),
    listSessions: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  };
});

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

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("crowdnav.sensor-settings.v1") ?? "{}");
      expect(stored.audibleAlerts).toBe(true);
    });
    const stored = JSON.parse(localStorage.getItem("crowdnav.sensor-settings.v1") ?? "{}");
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
