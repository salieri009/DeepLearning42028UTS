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

  it("marks dirty and persists visual overlay toggle on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    const overlayToggle = screen.getByRole("checkbox", { name: /Visual UI Overlays/i });
    expect(overlayToggle).toBeChecked();

    await user.click(overlayToggle);
    expect(screen.getByRole("button", { name: /Save Changes/i })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("crowdnav.sensor-settings.v1") ?? "{}");
      expect(stored.visualOverlays).toBe(false);
    });
  });

  it("opens Add Source modal and persists custom source", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Add source/i }));
    await user.type(screen.getByLabelText(/^Name$/i), "Lobby Cam");
    const submitButtons = screen.getAllByRole("button", { name: /^Add Source$/i });
    await user.click(submitButtons[submitButtons.length - 1]!);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("crowdnav.custom-sources.v1") ?? "[]");
      expect(stored[0]?.name).toBe("Lobby Cam");
    });
  });
});
