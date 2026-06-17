import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { ChromeText, Icon, StatusPill } from "@/shared/ui";

type TopNavProps = {
  running?: boolean;
};

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: ${({ theme }) => theme.layout.zIndex.chrome};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: ${({ theme }) => theme.layout.headerHeight};
  padding: 0 ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.color.glass.scrim};
  backdrop-filter: blur(20px);
  border-bottom: 1px solid ${({ theme }) => theme.color.glass.border};
  box-shadow: ${({ theme }) => theme.shadow.glow};
`;

const BrandGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const Brand = styled(ChromeText)`
  font-size: ${({ theme }) => theme.typography.size[5]};
`;

const TabGroup = styled.nav`
  display: none;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[6]};

  @media (min-width: 768px) {
    display: flex;
  }
`;

const Tab = styled(NavLink)`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.textSecondary};
  text-decoration: none;
  padding-bottom: ${({ theme }) => theme.spacing[1]};
  border-bottom: 2px solid transparent;
  transition: color 120ms ease, border-color 120ms ease;

  &:hover {
    color: ${({ theme }) => theme.color.primary};
  }

  &.active {
    color: ${({ theme }) => theme.color.primary};
    border-bottom-color: ${({ theme }) => theme.color.primary};
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const IconLink = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.spacing[7]};
  height: ${({ theme }) => theme.spacing[7]};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.color.textSecondary};
  text-decoration: none;
  transition: color 120ms ease, background 120ms ease;

  &:hover {
    color: ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.glass.fill};
  }

  &.active {
    color: ${({ theme }) => theme.color.primary};
  }
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.spacing[7]};
  height: ${({ theme }) => theme.spacing[7]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: transparent;
  color: ${({ theme }) => theme.color.textSecondary};
  cursor: not-allowed;
  opacity: 0.5;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.surfaceHigh};
  overflow: hidden;
`;

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/analytics", label: "Analytics", end: false },
  { to: "/live-map", label: "Live Map", end: false },
  { to: "/archive", label: "Archive", end: false },
] as const;

export function TopNav({ running = false }: TopNavProps) {
  return (
    <Header>
      <BrandGroup>
        <Brand>CrowdNav AI</Brand>
        {running && <StatusPill live />}
      </BrandGroup>

      <TabGroup aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, end }) => (
          <Tab key={to} to={to} end={end}>
            {label}
          </Tab>
        ))}
      </TabGroup>

      <Actions>
        <IconButton type="button" disabled title="Coming soon" aria-label="Notifications">
          <Icon name="notifications" size={22} />
        </IconButton>
        <IconLink to="/settings" aria-label="Settings">
          <Icon name="settings" size={22} />
        </IconLink>
        <Avatar aria-hidden />
      </Actions>
    </Header>
  );
}
