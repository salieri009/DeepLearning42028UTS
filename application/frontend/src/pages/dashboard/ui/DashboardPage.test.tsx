import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalyzeFrameResponse } from "@/entities/detection";
import { renderWithProviders } from "@/test/renderWithProviders";
import { DashboardPage } from "./DashboardPage";

const mockStart = vi.fn();
const mockStop = vi.fn();
const mockExport = vi.fn().mockResolvedValue(true);

const sampleResponse: AnalyzeFrameResponse = {
  persons: [
    {
      class: "person",
      confidence: 0.9,
      bbox: { x_center: 0.5, y_center: 0.5, width: 0.1, height: 0.2 },
      proximity_risk: "WARNING",
    },
  ],
  crowd_density: "LOW",
  max_proximity_risk: "WARNING",
  recommendation: "CAUTION",
};

vi.mock("@/features/session-export", () => ({
  exportLiveSession: (...args: unknown[]) => mockExport(...args),
}));

vi.mock("@/features/crowd-detection", () => ({
  useCrowdDetection: ({ onAnalyzed }: { onAnalyzed?: (d: AnalyzeFrameResponse) => void }) => {
    const [running, setRunning] = React.useState(false);
    const [data, setData] = React.useState<AnalyzeFrameResponse | null>(null);
    const [sessionId, setSessionId] = React.useState<number | null>(null);

    return {
      running,
      data,
      latencyMs: data ? 120 : null,
      sessionId,
      lastSessionId: sessionId,
      videoRef: { current: null },
      getStream: () => null,
      start: async () => {
        setRunning(true);
        setSessionId(42);
        setData(sampleResponse);
        onAnalyzed?.(sampleResponse);
        mockStart();
      },
      stop: () => {
        setRunning(false);
        setData(null);
        mockStop();
      },
    };
  },
}));

describe("DashboardPage manual checklist (automated)", () => {
  beforeEach(() => {
    mockStart.mockClear();
    mockStop.mockClear();
    mockExport.mockClear();
  });

  it("Start Monitoring invokes detection start and shows stats", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Start Monitoring/i }));
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/People Count/i)).toBeInTheDocument();
  });

  it("Stop Monitoring clears stats and calls stop", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Start Monitoring/i }));
    await user.click(screen.getByRole("button", { name: /Stop Monitoring/i }));

    expect(mockStop).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Start monitoring to view live statistics/i)).toBeInTheDocument();
  });

  it("enables Record, Export, and Generate Report while running with session data", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Start Monitoring/i }));

    expect(screen.getByRole("button", { name: /Start recording/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Export session data/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Generate live session report/i })).toBeEnabled();
  });

  it("exports session JSON when Export is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Start Monitoring/i }));
    await user.click(screen.getByRole("button", { name: /Export session data/i }));

    expect(mockExport).toHaveBeenCalledWith(42);
  });
});
