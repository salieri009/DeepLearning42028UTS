import styled, { keyframes } from "styled-components";
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
import { GlassPanel } from "@/shared/ui";

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

const Disclaimer = styled(GlassPanel)`
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  color: ${({ theme }) => theme.color.textSecondary};
  font-size: ${({ theme }) => theme.typography.size[2]};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

const skeletonPulse = keyframes`
  0%, 100% {
    opacity: 0.55;
  }
  50% {
    opacity: 0.75;
  }
`;

const Skeleton = styled(GlassPanel)`
  height: ${({ theme }) => theme.layout.analyticsPanelHeight};
  box-shadow: ${({ theme }) => theme.shadow.glow};
  opacity: 0.55;
  animation: ${skeletonPulse} 1.5s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const SkeletonShort = styled(Skeleton)`
  height: ${({ theme }) => theme.spacing[7]};
`;

const LoadingStatus = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.color.textSecondary};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
`;

function AnalyticsLoadingGrid() {
  return (
    <Grid aria-busy="true" aria-labelledby="analytics-loading-status">
      <Span8>
        <Skeleton />
      </Span8>
      <Span4>
        <Skeleton />
      </Span4>
      <Span7>
        <Skeleton />
      </Span7>
      <Span5>
        <SkeletonShort />
      </Span5>
    </Grid>
  );
}

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
        <LoadingStatus id="analytics-loading-status" role="status">
          Loading analytics…
        </LoadingStatus>
        <AnalyticsLoadingGrid />
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
        Hotspot map uses campus zone coordinates (Building 11 area). Sessions are tagged to the
        nearest zone at start; peak hours and safety score guide timing decisions.
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
