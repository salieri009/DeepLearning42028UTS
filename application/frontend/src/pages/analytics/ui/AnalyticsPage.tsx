import styled from "styled-components";
import { useAnalyticsMock } from "@/features/analytics-mock";
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

  @media (min-width: 1024px) {
    grid-template-columns: repeat(12, 1fr);
  }
`;

const Span8 = styled.div`
  @media (min-width: 1024px) {
    grid-column: span 8;
  }
`;

const Span4 = styled.div`
  @media (min-width: 1024px) {
    grid-column: span 4;
  }
`;

const Span7 = styled.div`
  @media (min-width: 1024px) {
    grid-column: span 7;
  }
`;

const Span5 = styled.div`
  @media (min-width: 1024px) {
    grid-column: span 5;
  }
`;

export function AnalyticsPage() {
  const data = useAnalyticsMock();

  return (
    <AppShell
      topNav={<TopNav />}
      sideNav={<SideNav activeItem="analytics" />}
      bottomNav={<BottomNav />}
    >
      <AnalyticsHeader />

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
