import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers/AppProviders";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ControlBar } from "./ControlBar";

describe("ControlBar", () => {
  it("shows Start Monitoring when idle", () => {
    renderWithProviders(<ControlBar running={false} onStart={vi.fn()} onStop={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Start Monitoring/i })).toBeEnabled();
  });

  it("shows Stop Monitoring when running", () => {
    renderWithProviders(<ControlBar running onStart={vi.fn()} onStop={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Stop Monitoring/i })).toBeEnabled();
  });

  it("calls onStart and onStop handlers", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const onStop = vi.fn();

    const view = renderWithProviders(
      <ControlBar running={false} onStart={onStart} onStop={onStop} />,
    );

    await user.click(screen.getByRole("button", { name: /Start Monitoring/i }));
    expect(onStart).toHaveBeenCalledTimes(1);

    view.rerender(
      <AppProviders>
        <ControlBar running onStart={onStart} onStop={onStop} />
      </AppProviders>,
    );

    await user.click(screen.getByRole("button", { name: /Stop Monitoring/i }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("keeps Record and Export disabled", () => {
    renderWithProviders(<ControlBar running={false} onStart={vi.fn()} onStop={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Record/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Export/i })).toBeDisabled();
  });
});
