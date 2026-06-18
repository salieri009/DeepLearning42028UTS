import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SessionDetailResponse } from "@/entities/session";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SessionTable } from "./SessionTable";

const session: SessionDetailResponse = {
  id: 9,
  source_type: "WEBCAM",
  client_label: "Dashboard",
  started_at: "2026-06-18T08:00:00Z",
  ended_at: "2026-06-18T08:05:00Z",
  frame_count: 12,
  avg_latency_ms: 42,
  worst_risk: "WARNING",
};

describe("SessionTable", () => {
  it("calls onSelect when VIEW DETAIL is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderWithProviders(
      <SessionTable
        sessions={[session]}
        selectedId={null}
        loading={false}
        error={null}
        currentPage={1}
        pageCount={1}
        onSelect={onSelect}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /View detail for session 9/i }));
    expect(onSelect).toHaveBeenCalledWith(9);
  });
});
