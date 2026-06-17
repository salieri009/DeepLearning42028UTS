import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SettingsActions } from "./SettingsActions";

describe("SettingsActions buttons", () => {
  it("disables save and discard when not dirty", () => {
    renderWithProviders(<SettingsActions dirty={false} onSave={vi.fn()} onDiscard={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Discard Changes/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Save Changes/i })).toBeDisabled();
  });

  it("calls save and discard when dirty", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onDiscard = vi.fn();

    renderWithProviders(<SettingsActions dirty onSave={onSave} onDiscard={onDiscard} />);

    await user.click(screen.getByRole("button", { name: /Save Changes/i }));
    await user.click(screen.getByRole("button", { name: /Discard Changes/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});
