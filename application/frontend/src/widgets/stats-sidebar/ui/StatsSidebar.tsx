import styled from "styled-components";
import type { AnalyzeFrameResponse } from "@/entities/detection";
import {
  StatCard,
  formatDensityLabel,
  formatLatencyBadge,
  formatRecommendation,
  formatRiskLabel,
  getDensityBadgeVariant,
  getRiskBadgeVariant,
} from "@/entities/crowd-stats";
import type { AlertEntry } from "@/features/alert-history";
import { Button, Icon, Label, LiveStatusDot, SectionTitle, Text } from "@/shared/ui";

type StatsSidebarProps = {
  data: AnalyzeFrameResponse | null;
  latencyMs: number | null;
  alerts: AlertEntry[];
  formatAlertMeta: (entry: AlertEntry) => string;
  onGenerateReport?: () => void;
  reportDisabled?: boolean;
};

const Aside = styled.aside`
  position: fixed;
  top: ${({ theme }) => theme.layout.headerHeight};
  right: 0;
  z-index: ${({ theme }) => theme.layout.zIndex.sidebar};
  width: ${({ theme }) => theme.layout.sidebarWidth};
  height: calc(100vh - ${({ theme }) => theme.layout.headerHeight});
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.color.glass.scrim};
  backdrop-filter: blur(${({ theme }) => theme.effects.glassBlur}) saturate(${({ theme }) => theme.effects.glassSaturation});
  border-left: 1px solid ${({ theme }) => theme.color.glass.border};
  box-shadow: ${({ theme }) => theme.shadow.glow};

  @media (max-width: ${({ theme }) => theme.layout.gridBreakpointLg}) {
    display: none;
  }
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

const Subtitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: ${({ theme }) => theme.spacing[2]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};

  &::-webkit-scrollbar {
    width: ${({ theme }) => theme.spacing[1]};
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.color.scrollbarThumb};
    border-radius: ${({ theme }) => theme.radius.full};
  }
`;

const AlertsTitle = styled(Label)`
  font-size: ${({ theme }) => theme.typography.size[2]};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.textPrimary};
`;

const AlertsSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const AlertsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const AlertItem = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid transparent;
  transition: background 120ms ease, border-color 120ms ease;

  &:hover {
    background: ${({ theme }) => theme.color.glass.fill};
    border-color: ${({ theme }) => theme.color.glass.border};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const AlertBar = styled.div<{ $risk: string }>`
  width: ${({ theme }) => theme.spacing[1]};
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $risk }) =>
    $risk === "DANGER"
      ? theme.color.danger
      : $risk === "WARNING"
        ? theme.color.warning
        : theme.color.textSecondary};
`;

const FooterAction = styled.div`
  margin-top: ${({ theme }) => theme.spacing[4]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.color.glass.border};
`;

const ReportButton = styled(Button)`
  width: 100%;
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.textSecondary};
`;

const PanelHeading = styled(SectionTitle)`
  font-size: ${({ theme }) => theme.typography.size[3]};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export function StatsSidebar({
  data,
  latencyMs,
  alerts,
  formatAlertMeta,
  onGenerateReport,
  reportDisabled = true,
}: StatsSidebarProps) {
  const density = formatDensityLabel(data?.crowd_density);
  const risk = formatRiskLabel(data?.max_proximity_risk);
  const recommendation = formatRecommendation(data?.recommendation);
  const latencyBadge = formatLatencyBadge(latencyMs);

  return (
    <Aside aria-label="Crowd statistics and alerts">
      <Header>
        <PanelHeading>Crowd Tracking Statistics</PanelHeading>
        <Subtitle>
          <LiveStatusDot $tone="primary" aria-hidden="true" />
          <Label $tone="secondary">Precision Mode Active</Label>
        </Subtitle>
      </Header>

      <ScrollArea>
        {data ? (
          <>
            <StatCard
              compact
              icon="person"
              label="People Count"
              value={String(data.persons?.length ?? 0)}
            />
            <StatCard
              compact
              icon="groups"
              label="Crowd Density"
              value={density}
              badge={density !== "—" ? density : undefined}
              badgeVariant={getDensityBadgeVariant(data.crowd_density)}
              valueTone={getDensityBadgeVariant(data.crowd_density)}
            />
            <StatCard
              compact
              icon="distance"
              label="Max Proximity Risk"
              value={String(risk)}
              badge={risk !== "—" ? String(risk) : undefined}
              badgeVariant={getRiskBadgeVariant(data.max_proximity_risk)}
              valueTone={getRiskBadgeVariant(data.max_proximity_risk)}
              accent={data.max_proximity_risk === "WARNING" || data.max_proximity_risk === "DANGER"}
            />
            <StatCard
              compact
              icon="speed"
              label="Session Latency"
              value={latencyMs !== null ? String(latencyMs) : "—"}
              unit="ms"
              badge={latencyBadge?.label}
              badgeVariant={latencyBadge?.variant ?? "neutral"}
            />
            <StatCard
              compact
              icon="summarize"
              label="Recommendation"
              value={recommendation}
              badge={recommendation !== "—" ? recommendation : undefined}
              badgeVariant={getRiskBadgeVariant(data.max_proximity_risk)}
              valueTone={getRiskBadgeVariant(data.max_proximity_risk)}
            />
          </>
        ) : (
          <EmptyText>Start monitoring to view live statistics.</EmptyText>
        )}

        <AlertsSection aria-labelledby="stats-alerts-heading">
          <AlertsHeader>
            <AlertsTitle as="h3" id="stats-alerts-heading">
              Recent Alerts
            </AlertsTitle>
          </AlertsHeader>
          {alerts.length === 0 ? (
            <EmptyText>No alerts yet.</EmptyText>
          ) : (
            alerts.map((alert) => (
              <AlertItem key={alert.id}>
                <AlertBar $risk={alert.risk} />
                <div>
                  <Text>{alert.message}</Text>
                  <Label $tone="secondary">{formatAlertMeta(alert)}</Label>
                </div>
              </AlertItem>
            ))
          )}
        </AlertsSection>
      </ScrollArea>

      <FooterAction>
        <ReportButton
          type="button"
          $variant="primary"
          disabled={reportDisabled}
          onClick={onGenerateReport}
          aria-label="Generate live session report"
          title={reportDisabled ? "Start monitoring to generate a report" : "Download HTML report"}
        >
          <Icon name="summarize" size={18} />
          Generate Report
        </ReportButton>
      </FooterAction>
    </Aside>
  );
}
