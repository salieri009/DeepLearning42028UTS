import type { ReactNode } from "react";
import styled from "styled-components";

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
};

export function DashboardShell({ topNav, videoStage, statsSidebar, controlBar }: DashboardShellProps) {
  return (
    <Shell>
      {videoStage}
      {topNav}
      {statsSidebar}
      {controlBar}
    </Shell>
  );
}
