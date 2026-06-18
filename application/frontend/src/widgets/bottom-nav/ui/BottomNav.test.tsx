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
  it("links to all five primary pages", () => {
    renderBottomNav("/analytics");

    expect(screen.getByRole("link", { name: /Dashboard/i, hidden: true })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Analytics/i, hidden: true })).toHaveAttribute("href", "/analytics");
    expect(screen.getByRole("link", { name: /Live Map/i, hidden: true })).toHaveAttribute("href", "/live-map");
    expect(screen.getByRole("link", { name: /Archive/i, hidden: true })).toHaveAttribute("href", "/archive");
    expect(screen.getByRole("link", { name: /Settings/i, hidden: true })).toHaveAttribute("href", "/settings");
  });
});
