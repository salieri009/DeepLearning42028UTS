import type { ReactNode } from "react";
import styled from "styled-components";
import { SkipLink } from "@/shared/ui";

const Shell = styled.div`
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  background: ${({ theme }) => theme.color.bg};
`;

const GridTexture = styled.div`
  position: fixed;
  inset: 0;
  z-index: -50;
  pointer-events: none;
  opacity: 0.03;
  background-image:
    linear-gradient(${({ theme }) => theme.color.textPrimary} 1px, transparent 1px),
    linear-gradient(90deg, ${({ theme }) => theme.color.textPrimary} 1px, transparent 1px);
  background-size: ${({ theme }) => theme.spacing[7]} ${({ theme }) => theme.spacing[7]};
`;

const GlowTop = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: ${({ theme }) => theme.layout.glowOrbLg};
  height: ${({ theme }) => theme.layout.glowOrbLg};
  border-radius: 50%;
  background: ${({ theme }) => theme.color.primary};
  opacity: 0.05;
  filter: blur(${({ theme }) => theme.effects.glowBlurLg});
  pointer-events: none;
  z-index: -40;
`;

const GlowBottom = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: ${({ theme }) => theme.layout.glowOrbMd};
  height: ${({ theme }) => theme.layout.glowOrbMd};
  border-radius: 50%;
  background: ${({ theme }) => theme.color.info[60]};
  opacity: 0.05;
  filter: blur(${({ theme }) => theme.effects.glowBlurMd});
  pointer-events: none;
  z-index: -40;
`;

const Main = styled.main`
  padding-top: calc(${({ theme }) => theme.layout.headerHeight} + ${({ theme }) => theme.spacing[5]});
  padding-bottom: calc(${({ theme }) => theme.layout.mobileBottomNavHeight} + ${({ theme }) => theme.spacing[7]});
  padding-left: ${({ theme }) => theme.spacing[4]};
  padding-right: ${({ theme }) => theme.spacing[4]};
  min-height: 100vh;

  @media (min-width: ${({ theme }) => theme.layout.gridBreakpointLg}) {
    margin-left: ${({ theme }) => theme.layout.leftSidebarWidth};
    padding-left: ${({ theme }) => theme.spacing[6]};
  }
`;

const Content = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
`;

type AppShellProps = {
  topNav: ReactNode;
  sideNav: ReactNode;
  bottomNav?: ReactNode;
  children: ReactNode;
};

export function AppShell({ topNav, sideNav, bottomNav, children }: AppShellProps) {
  return (
    <Shell>
      <SkipLink />
      {topNav}
      {sideNav}
      <Main id="main-content">
        <Content>{children}</Content>
      </Main>
      {bottomNav}
      <GridTexture />
      <GlowTop />
      <GlowBottom />
    </Shell>
  );
}
