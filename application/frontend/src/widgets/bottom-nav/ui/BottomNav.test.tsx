import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { BottomNav } from "./BottomNav";

function renderBottomNav(path = "/analytics") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav />
    </MemoryRouter>,
  );
}

describe("BottomNav mobile routes", () => {
  it("links to the four primary pages", () => {
    renderBottomNav("/analytics");

    expect(screen.getByRole("link", { name: /Home/i, hidden: true })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Stats/i, hidden: true })).toHaveAttribute("href", "/analytics");
    expect(screen.getByRole("link", { name: /Map/i, hidden: true })).toHaveAttribute("href", "/live-map");
    expect(screen.getByRole("link", { name: /Logs/i, hidden: true })).toHaveAttribute("href", "/archive");
  });
});
