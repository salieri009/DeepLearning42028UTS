import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { describe, expect, it } from "vitest";
import type { PersonDetection } from "../model/types";
import { theme } from "@/shared/config/theme";
import { PersonBBox } from "./PersonBBox";

function renderBBox(person: PersonDetection) {
  return render(
    <ThemeProvider theme={theme}>
      <div style={{ position: "relative", width: 640, height: 360 }}>
        <PersonBBox person={person} />
      </div>
    </ThemeProvider>,
  );
}

const basePerson: PersonDetection = {
  class: "person",
  bbox: { x_center: 0.5, y_center: 0.5, width: 0.2, height: 0.3 },
  confidence: 0.92,
  proximity_risk: "SAFE",
};

describe("PersonBBox label chip", () => {
  it("uses dark text on WARNING chips per DESIGN_RULES §3.5", () => {
    renderBBox({ ...basePerson, proximity_risk: "WARNING" });

    const chip = screen.getByText(/WARNING 92%/i);
    expect(chip).toHaveStyle({ color: theme.color.onWarning });
  });

  it("uses inverse text on SAFE and DANGER chips", () => {
    renderBBox({ ...basePerson, proximity_risk: "DANGER" });

    const chip = screen.getByText(/DANGER 92%/i);
    expect(chip).toHaveStyle({ color: theme.color.textInverse });
  });
});
