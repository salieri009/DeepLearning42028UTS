import type { ReactNode } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppRouter } from "@/app";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children }: { children?: ReactNode }) => <div data-testid="mock-map">{children}</div>,
  Marker: () => null,
  NavigationControl: () => null,
}));

vi.mock("@/features/crowd-detection", () => ({
  useCrowdDetection: () => ({
    running: false,
    data: null,
    latencyMs: null,
    videoRef: { current: null },
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

vi.mock("@/features/risk-alerts", () => ({
  useRiskAlerts: () => ({
    triggerAlert: vi.fn(),
    reset: vi.fn(),
    cancel: vi.fn(),
  }),
}));

vi.mock("@/features/alert-history", () => ({
  useAlertHistory: () => ({
    alerts: [],
    pushFromRisk: vi.fn(),
    reset: vi.fn(),
    formatAlertMeta: () => "",
  }),
}));

vi.mock("@/features/session-archive", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/session-archive")>();
  return {
    ...actual,
    useSessionArchive: () => ({
      dateRange: "7d",
      riskFilter: "ALL",
      sourceFilter: "ALL",
      sessions: [],
      selectedId: null,
      selectedDetail: null,
      loading: false,
      error: null,
      currentPage: 1,
      pageCount: 1,
      emptyMessage: "No sessions found.",
      setDateRange: vi.fn(),
      setRiskFilter: vi.fn(),
      setSourceFilter: vi.fn(),
      clearFilters: vi.fn(),
      setSelectedId: vi.fn(),
      goPrev: vi.fn(),
      goNext: vi.fn(),
    }),
    useSessionPreview: () => ({
      loading: false,
      stats: null,
      error: null,
    }),
  };
});

function renderApp(initialPath: string) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppRouter />
    </MemoryRouter>,
  );
}

describe("Four-page TopNav routing", () => {
  it("renders dashboard controls on /", () => {
    renderApp("/");
    expect(screen.getByRole("button", { name: /Start Monitoring/i })).toBeInTheDocument();
  });

  it("navigates to Analytics", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await user.click(screen.getByRole("link", { name: "Analytics", hidden: true }));
    expect(screen.getByText(/Risk Hotspot Map/i)).toBeInTheDocument();
  });

  it("navigates to Live Map", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await user.click(screen.getByRole("link", { name: "Live Map", hidden: true }));
    expect(screen.getByText(/Live Risk Map/i)).toBeInTheDocument();
  });

  it("navigates to Archive", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await user.click(screen.getByRole("link", { name: "Archive", hidden: true }));
    expect(screen.getByText(/Analysis Archive/i)).toBeInTheDocument();
  });
});
