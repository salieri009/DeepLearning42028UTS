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
  background-size: 40px 40px;
`;

const GlowTop = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 800px;
  height: 800px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.primary};
  opacity: 0.05;
  filter: blur(150px);
  pointer-events: none;
  z-index: -40;
`;

const GlowBottom = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.info[60]};
  opacity: 0.05;
  filter: blur(120px);
  pointer-events: none;
  z-index: -40;
`;

const Main = styled.main`
  padding-top: calc(${({ theme }) => theme.layout.headerHeight} + ${({ theme }) => theme.spacing[5]});
  padding-bottom: calc(${({ theme }) => theme.layout.mobileBottomNavHeight} + ${({ theme }) => theme.spacing[8]});
  padding-right: ${({ theme }) => theme.spacing[4]};
  min-height: 100vh;

  @media (min-width: 1024px) {
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
