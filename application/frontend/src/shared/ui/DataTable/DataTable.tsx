import type { KeyboardEvent, ReactNode } from "react";
import styled from "styled-components";
import { GlassPanel } from "../GlassPanel";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  selectedKey?: string | number | null;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  footer?: ReactNode;
};

function handleRowKeyDown<T>(
  event: KeyboardEvent<HTMLTableRowElement>,
  row: T,
  onRowClick: (row: T) => void,
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onRowClick(row);
  }
}

const Panel = styled(GlassPanel)`
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th<{ $align?: string }>`
  padding: ${({ theme }) => `${theme.spacing[4]} ${theme.spacing[6]}`};
  text-align: ${({ $align }) => $align ?? "left"};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.color.textPrimary};
  border-bottom: 1px solid ${({ theme }) => theme.color.glass.border};
`;

const Tr = styled.tr<{ $selected?: boolean }>`
  cursor: ${({ onClick }) => (onClick ? "pointer" : "default")};
  background: ${({ theme, $selected }) =>
    $selected ? `${theme.color.primary}1a` : "transparent"};
  transition: background 120ms ease;

  &:hover {
    background: ${({ theme }) => theme.color.glass.border};
  }
`;

const Td = styled.td<{ $align?: string }>`
  padding: ${({ theme }) => `${theme.spacing[4]} ${theme.spacing[6]}`};
  text-align: ${({ $align }) => $align ?? "left"};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.textPrimary};
  border-bottom: 1px solid ${({ theme }) => theme.color.glass.border};
`;

const Empty = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
  color: ${({ theme }) => theme.color.textSecondary};
  font-family: ${({ theme }) => theme.typography.family.mono};
`;

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  selectedKey,
  onRowClick,
  emptyMessage = "No data.",
  footer,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <Panel>
        <Empty>{emptyMessage}</Empty>
        {footer}
      </Panel>
    );
  }

  return (
    <Panel>
      <Table>
        <thead>
          <tr>
            {columns.map((col) => (
              <Th key={col.key} $align={col.align}>
                {col.header}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            return (
              <Tr
                key={key}
                $selected={selectedKey === key}
                tabIndex={onRowClick ? 0 : undefined}
                aria-selected={onRowClick && selectedKey === key ? true : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick ? (event) => handleRowKeyDown(event, row, onRowClick) : undefined
                }
              >
                {columns.map((col) => (
                  <Td key={col.key} $align={col.align}>
                    {col.render(row)}
                  </Td>
                ))}
              </Tr>
            );
          })}
        </tbody>
      </Table>
      {footer}
    </Panel>
  );
}
