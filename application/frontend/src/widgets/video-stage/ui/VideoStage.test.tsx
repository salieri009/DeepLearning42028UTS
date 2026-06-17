import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { describe, expect, it } from "vitest";
import type { AnalyzeFrameResponse } from "@/entities/detection";
import { theme } from "@/shared/config/theme";
import { VideoStage } from "./VideoStage";

function renderStage(data: AnalyzeFrameResponse | null, running = true) {
  return render(
    <ThemeProvider theme={theme}>
      <VideoStage running={running} data={data} videoRef={{ current: null }} />
    </ThemeProvider>,
  );
}

describe("VideoStage manual checklist (automated)", () => {
  it("uses FR-UI-4 safe-zone bottom inset token", () => {
    expect(theme.layout.videoSafeInsetBottom).toBe("96px");
    expect(theme.layout.sidebarWidth).toBe("320px");
  });

  it("shows crowd density alert chip when recommendation is CAUTION", () => {
    renderStage({
      persons: [],
      crowd_density: "LOW",
      max_proximity_risk: "WARNING",
      recommendation: "CAUTION",
    });

    expect(screen.getByText(/Crowd Density Alert/i)).toBeInTheDocument();
    expect(screen.getByText(/CAUTION/i)).toBeInTheDocument();
  });

  it("shows camera placeholder when not running", () => {
    renderStage(null, false);
    expect(screen.getByText(/Camera Off/i)).toBeInTheDocument();
  });
});
