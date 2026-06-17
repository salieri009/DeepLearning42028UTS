import styled from "styled-components";
import type { AnalyzeFrameResponse } from "@/entities/detection";
import {
  StatCard,
  formatDensityLabel,
  formatRecommendation,
  formatRiskLabel,
  getDensityBadgeVariant,
  getRiskBadgeVariant,
} from "@/entities/crowd-stats";
import type { AlertEntry } from "@/features/alert-history";
import { Button, ChromeText, Icon, Label, Text } from "@/shared/ui";

type StatsSidebarProps = {
  data: AnalyzeFrameResponse | null;
  latencyMs: number | null;
  alerts: AlertEntry[];
  formatAlertMeta: (entry: AlertEntry) => string;
};

const Aside = styled.aside`
  position: fixed;
  top: ${({ theme }) => theme.layout.headerHeight};
  right: 0;
  z-index: 40;
  width: ${({ theme }) => theme.layout.sidebarWidth};
  height: calc(100vh - ${({ theme }) => theme.layout.headerHeight});
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.color.glass.scrim};
  backdrop-filter: blur(20px);
  border-left: 1px solid ${({ theme }) => theme.color.glass.border};
  box-shadow: ${({ theme }) => theme.shadow.glow};

  @media (max-width: 1024px) {
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

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.primary};
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: ${({ theme }) => theme.spacing[2]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
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
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: background 120ms ease;

  &:hover {
    background: ${({ theme }) => theme.color.glass.fill};
  }
`;

const AlertBar = styled.div<{ $risk: string }>`
  width: 4px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $risk }) =>
    $risk === "DANGER"
      ? theme.color.danger
      : $risk === "WARNING"
        ? theme.color.warning
        : theme.color.textSecondary};
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.textSecondary};
`;

export function StatsSidebar({ data, latencyMs, alerts, formatAlertMeta }: StatsSidebarProps) {
  const density = formatDensityLabel(data?.crowd_density);
  const risk = formatRiskLabel(data?.max_proximity_risk);
  const recommendation = formatRecommendation(data?.recommendation);

  return (
    <Aside>
      <Header>
        <ChromeText as="h2" style={{ fontSize: "20px" }}>
          Crowd Tracking Statistics
        </ChromeText>
        <Subtitle>
          <Dot />
          <Label $tone="secondary">Precision Mode Active</Label>
        </Subtitle>
      </Header>

      <ScrollArea>
        {data ? (
          <>
            <StatCard
              icon="person"
              label="People Count"
              value={String(data.persons?.length ?? 0)}
            />
            <StatCard
              icon="groups"
              label="Crowd Density"
              value={density}
              badge={density !== "—" ? density : undefined}
              badgeVariant={getDensityBadgeVariant(data.crowd_density)}
            />
            <StatCard
              icon="distance"
              label="Max Proximity Risk"
              value={String(risk)}
              badge={risk !== "—" ? String(risk) : undefined}
              badgeVariant={getRiskBadgeVariant(data.max_proximity_risk)}
              accent={data.max_proximity_risk === "WARNING" || data.max_proximity_risk === "DANGER"}
            />
            <StatCard
              icon="speed"
              label="Session Latency"
              value={latencyMs !== null ? String(latencyMs) : "—"}
              unit="ms"
              badge="OPTIMAL"
              badgeVariant="safe"
            />
            <StatCard
              icon="summarize"
              label="Recommendation"
              value={recommendation}
              badge={recommendation !== "—" ? recommendation : undefined}
              badgeVariant={getRiskBadgeVariant(data.max_proximity_risk)}
            />
          </>
        ) : (
          <EmptyText>Start monitoring to view live statistics.</EmptyText>
        )}

        <AlertsSection>
          <AlertsHeader>
            <Label>Recent Alerts</Label>
            <Label $tone="secondary">View All</Label>
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

      <Button $variant="primary" $fullWidth disabled title="Coming soon" style={{ marginTop: 24 }}>
        <Icon name="summarize" size={18} />
        Generate Report
      </Button>
    </Aside>
  );
}
