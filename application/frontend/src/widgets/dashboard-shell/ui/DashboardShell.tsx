import type { ReactNode } from "react";
import styled from "styled-components";
import { SkipLink, VisuallyHidden } from "@/shared/ui";

const Shell = styled.div`
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;

  @media (max-width: ${({ theme }) => theme.layout.gridBreakpointLg}) {
    padding-bottom: calc(${({ theme }) => theme.spacing[7]} * 2 + env(safe-area-inset-bottom, 0px));
  }
`;

type DashboardShellProps = {
  topNav: ReactNode;
  videoStage: ReactNode;
  statsSidebar: ReactNode;
  mobileStatsBar?: ReactNode;
  controlBar: ReactNode;
  bottomNav?: ReactNode;
  liveRegion?: ReactNode;
};

export function DashboardShell({
  topNav,
  videoStage,
  statsSidebar,
  mobileStatsBar,
  controlBar,
  bottomNav,
  liveRegion,
}: DashboardShellProps) {
  return (
    <Shell>
      <VisuallyHidden as="h1">Crowd Monitoring Dashboard</VisuallyHidden>
      <SkipLink targetId="dashboard-main" />
      {liveRegion}
      {videoStage}
      {topNav}
      {mobileStatsBar}
      {statsSidebar}
      {controlBar}
      {bottomNav}
    </Shell>
  );
}
