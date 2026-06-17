import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ArchiveFilters } from "./ArchiveFilters";

describe("ArchiveFilters buttons", () => {
  const baseProps = {
    dateRange: "7d" as const,
    riskFilter: "ALL" as const,
    sourceFilter: "ALL" as const,
    onDateRangeChange: vi.fn(),
    onRiskFilterChange: vi.fn(),
    onSourceFilterChange: vi.fn(),
    onClear: vi.fn(),
  };

  it("toggles risk filter buttons", async () => {
    const user = userEvent.setup();
    const onRiskFilterChange = vi.fn();

    renderWithProviders(
      <ArchiveFilters {...baseProps} onRiskFilterChange={onRiskFilterChange} />,
    );

    await user.click(screen.getByRole("button", { name: "SAFE" }));
    expect(onRiskFilterChange).toHaveBeenCalledWith("SAFE");

    await user.click(screen.getByRole("button", { name: "WARNING" }));
    expect(onRiskFilterChange).toHaveBeenCalledWith("WARNING");

    await user.click(screen.getByRole("button", { name: "DANGER" }));
    expect(onRiskFilterChange).toHaveBeenCalledWith("DANGER");
  });

  it("calls onClear from Clear Filters", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    renderWithProviders(<ArchiveFilters {...baseProps} onClear={onClear} />);

    await user.click(screen.getByRole("button", { name: /Clear Filters/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
