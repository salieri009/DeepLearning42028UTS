import styled from "styled-components";
import { formatSessionDuration, formatSessionStart, type SessionDetailResponse } from "@/entities/session";
import { RiskBadge } from "@/entities/analytics";
import { AquaPillButton, DataTable, type DataTableColumn, GlassPanel, Icon } from "@/shared/ui";

type SessionTableProps = {
  sessions: SessionDetailResponse[];
  selectedId: number | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageCount: number;
  emptyMessage?: string;
  onSelect: (id: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

const StateMessage = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
  font-family: ${({ theme }) => theme.typography.family.mono};
  color: ${({ theme }) => theme.color.textSecondary};
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.glass.scrim};
`;

const PageInfo = styled.span`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.textSecondary};
`;

const PageButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const PageButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: ${({ theme }) => theme.color.textPrimary};
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const columns: DataTableColumn<SessionDetailResponse>[] = [
  {
    key: "start",
    header: "Session Start",
    render: (s) => formatSessionStart(s.started_at),
  },
  {
    key: "duration",
    header: "Duration",
    render: (s) => formatSessionDuration(s.started_at, s.ended_at),
  },
  {
    key: "risk",
    header: "Max Risk",
    render: (s) => <RiskBadge risk={s.worst_risk} />,
  },
  {
    key: "detections",
    header: "Detections",
    render: (s) => s.frame_count,
  },
  {
    key: "action",
    header: "Action",
    align: "right",
    render: () => (
      <AquaPillButton type="button" $size="sm" disabled title="Coming soon" aria-label="View detail (coming soon)">
        VIEW DETAIL
      </AquaPillButton>
    ),
  },
];

export function SessionTable({
  sessions,
  selectedId,
  loading,
  error,
  currentPage,
  pageCount,
  emptyMessage = "No sessions found.",
  onSelect,
  onPrev,
  onNext,
}: SessionTableProps) {
  if (loading) {
    return (
      <GlassPanel>
        <StateMessage>Loading sessions...</StateMessage>
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel>
        <StateMessage>{error}</StateMessage>
      </GlassPanel>
    );
  }

  return (
    <DataTable
      columns={columns}
      rows={sessions}
      rowKey={(s) => s.id}
      selectedKey={selectedId}
      onRowClick={(s) => onSelect(s.id)}
      emptyMessage={emptyMessage}
      footer={
        <Footer>
          <PageInfo>
            Page {currentPage} of {pageCount}
            {sessions.length === 0 ? "" : ` · ${sessions.length} shown`}
          </PageInfo>
          <PageButtons>
            <PageButton type="button" onClick={onPrev} disabled={currentPage <= 1} aria-label="Previous page">
              <Icon name="chevron_left" size={16} />
            </PageButton>
            <PageButton
              type="button"
              onClick={onNext}
              disabled={currentPage >= pageCount}
              aria-label="Next page"
            >
              <Icon name="chevron_right" size={16} />
            </PageButton>
          </PageButtons>
        </Footer>
      }
    />
  );
}
