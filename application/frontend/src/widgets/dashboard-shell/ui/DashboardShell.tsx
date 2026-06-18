import type { ReactNode } from "react";
import styled from "styled-components";
import { SkipLink } from "@/shared/ui";

const Shell = styled.div`
  position: relative;
  min-height: 100vh;
  overflow: hidden;

  @media (max-width: 1024px) {
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
