import type { ReactNode } from "react";
import styled from "styled-components";
import { SkipLink } from "@/shared/ui";

const Shell = styled.div`
  position: relative;
  min-height: 100vh;
  overflow: hidden;
`;

type DashboardShellProps = {
  topNav: ReactNode;
  videoStage: ReactNode;
  statsSidebar: ReactNode;
  controlBar: ReactNode;
  liveRegion?: ReactNode;
};

export function DashboardShell({
  topNav,
  videoStage,
  statsSidebar,
  controlBar,
  liveRegion,
}: DashboardShellProps) {
  return (
    <Shell>
      <SkipLink targetId="dashboard-main" />
      {liveRegion}
      {videoStage}
      {topNav}
      {statsSidebar}
      {controlBar}
    </Shell>
  );
}
