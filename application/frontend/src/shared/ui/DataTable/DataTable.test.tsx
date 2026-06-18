import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { DataTable } from "./DataTable";

type Row = { id: string; name: string };

const columns = [
  { key: "name", header: "Name", render: (row: Row) => row.name },
] as const;

const rows: Row[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
];

describe("DataTable keyboard", () => {
  it("selects a row with Enter and Space", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();

    renderWithProviders(
      <DataTable
        columns={[...columns]}
        rows={rows}
        rowKey={(row) => row.id}
        selectedKey="a"
        onRowClick={onRowClick}
      />,
    );

    const alphaRow = screen.getByRole("row", { name: /Alpha/i });
    alphaRow.focus();
    await user.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);

    await user.keyboard(" ");
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });
});
