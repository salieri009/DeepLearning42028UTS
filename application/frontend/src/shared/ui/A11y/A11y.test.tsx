import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SkipLink } from "./A11y";

describe("SkipLink", () => {
  it("links to the main content landmark", () => {
    renderWithProviders(<SkipLink targetId="main-content" />);

    const link = screen.getByRole("link", { name: /Skip to main content/i });
    expect(link).toHaveAttribute("href", "#main-content");
  });
});
