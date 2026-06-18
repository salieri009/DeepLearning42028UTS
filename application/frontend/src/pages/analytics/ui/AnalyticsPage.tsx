import styled from "styled-components";
import { useAnalyticsData } from "@/features/analytics-data";
import { AnalyticsHeader } from "@/widgets/analytics-header";
import { AppShell } from "@/widgets/app-shell";
import { BottomNav } from "@/widgets/bottom-nav";
import { PeakDensityChart } from "@/widgets/peak-density-chart";
import { RiskHotspotMap } from "@/widgets/risk-hotspot-map";
import { SideNav } from "@/widgets/side-nav";
import { TopNav } from "@/widgets/top-nav";
import { WeeklySafetyScore } from "@/widgets/weekly-safety-score";
import { ZoneRiskDistribution } from "@/widgets/zone-risk-distribution";

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[6]};

  @media (min-width: ${({ theme }) => theme.layout.gridBreakpointLg}) {
    grid-template-columns: repeat(12, 1fr);
  }
`;

const Span8 = styled.div`
  @media (min-width: ${({ theme }) => theme.layout.gridBreakpointLg}) {
    grid-column: span 8;
  }
`;

const Span4 = styled.div`
  @media (min-width: ${({ theme }) => theme.layout.gridBreakpointLg}) {
    grid-column: span 4;
  }
`;

const Span7 = styled.div`
  @media (min-width: ${({ theme }) => theme.layout.gridBreakpointLg}) {
    grid-column: span 7;
  }
`;

const Span5 = styled.div`
  @media (min-width: ${({ theme }) => theme.layout.gridBreakpointLg}) {
    grid-column: span 5;
  }
`;

const EmptyState = styled.div`
  padding: ${({ theme }) => theme.spacing[7]};
  text-align: center;
  color: ${({ theme }) => theme.color.textSecondary};
  font-family: ${({ theme }) => theme.typography.family.mono};
`;

const Disclaimer = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.glass.scrim};
  color: ${({ theme }) => theme.color.textSecondary};
  font-size: ${({ theme }) => theme.typography.size[2]};
  line-height: 1.5;
`;

export function AnalyticsPage() {
  const { data, loading, error } = useAnalyticsData();

  if (loading) {
    return (
      <AppShell
        topNav={<TopNav />}
        sideNav={<SideNav activeItem="analytics" />}
        bottomNav={<BottomNav />}
      >
        <AnalyticsHeader />
        <EmptyState>Loading analytics...</EmptyState>
      </AppShell>
    );
  }

  return (
    <AppShell
      topNav={<TopNav />}
      sideNav={<SideNav activeItem="analytics" />}
      bottomNav={<BottomNav />}
    >
      <AnalyticsHeader />

      {error ? <EmptyState>{error}</EmptyState> : null}

      <Disclaimer>
        Hotspot map layout and zone labels use session-source breakdowns, not geographic GPS
        zones. Use peak hours and safety score for timing decisions; see widget notes for
        synthetic rankings.
      </Disclaimer>

      <Grid>
        <Span8>
          <RiskHotspotMap hotspots={data.hotspots} />
        </Span8>
        <Span4>
          <WeeklySafetyScore
            score={data.safetyScore}
            label={data.safetyLabel}
            trendPercent={data.trendPercent}
            eventCount={data.eventCount}
          />
        </Span4>
        <Span7>
          <PeakDensityChart hours={data.peakHours} busiestWindow={data.busiestWindow} />
        </Span7>
        <Span5>
          <ZoneRiskDistribution zones={data.zoneRisks} />
        </Span5>
      </Grid>
    </AppShell>
  );
}
