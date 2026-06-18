import { NavLink } from "react-router-dom";
import styled, { css } from "styled-components";
import { Icon } from "@/shared/ui";

export type SideNavItem =
  | "security"
  | "analytics"
  | "traffic"
  | "health"
  | "assets"
  | "sensors"
  | "logs";

type SideNavProps = {
  activeItem: SideNavItem;
};

const ROUTE_BY_ITEM: Partial<Record<SideNavItem, string>> = {
  security: "/",
  analytics: "/analytics",
  traffic: "/live-map",
  sensors: "/settings",
  logs: "/archive",
};

const Aside = styled.aside`
  display: none;
  position: fixed;
  left: 0;
  top: ${({ theme }) => theme.layout.headerHeight};
  width: ${({ theme }) => theme.layout.leftSidebarWidth};
  height: calc(100vh - ${({ theme }) => theme.layout.headerHeight});
  z-index: ${({ theme }) => theme.layout.zIndex.sidebar};
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing[4]} 0;
  background: ${({ theme }) => theme.color.glass.fill};
  backdrop-filter: blur(20px);
  border-right: 1px solid ${({ theme }) => theme.color.glass.border};
  box-shadow: ${({ theme }) => theme.shadow.md};

  @media (min-width: 1024px) {
    display: flex;
  }
`;

const NodeCard = styled.div`
  margin: 0 ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[3]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.surfaceHigh};
`;

const NodeIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.gradient.aqua};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.color.textInverse};
`;

const NodeTitle = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.color.textPrimary};
`;

const NodeSubtitle = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.size[1]};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.color.info[60]};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
`;

const NavList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: 0 ${({ theme }) => theme.spacing[2]};
`;

const navItemStyles = css`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  text-align: left;
  transition: background 120ms ease, color 120ms ease;
  color: ${({ theme }) => theme.color.textSecondary};
  background: transparent;
  text-decoration: none;
  width: 100%;
  box-sizing: border-box;

  &:hover {
    background: ${({ theme }) => theme.color.glass.border};
  }

  &.active {
    color: ${({ theme }) => theme.color.textInverse};
    background: ${({ theme }) => theme.gradient.aqua};
    box-shadow: ${({ theme }) => theme.shadow.glow};
  }
`;

const NavItemLink = styled(NavLink)`
  ${navItemStyles}
  cursor: pointer;
`;

const NavItemDisabled = styled.button`
  ${navItemStyles}
  cursor: not-allowed;
  opacity: 0.55;
`;

const Footer = styled.div`
  margin-top: auto;
  padding: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const ITEMS: { id: SideNavItem; icon: string; label: string }[] = [
  { id: "security", icon: "security", label: "Security" },
  { id: "analytics", icon: "analytics", label: "Analytics" },
  { id: "traffic", icon: "traffic", label: "Traffic" },
  { id: "health", icon: "monitor_heart", label: "Health" },
  { id: "assets", icon: "inventory_2", label: "Assets" },
  { id: "sensors", icon: "settings_input_component", label: "Sensors" },
  { id: "logs", icon: "history", label: "Logs" },
];

export function SideNav({ activeItem }: SideNavProps) {
  return (
    <Aside aria-label="Primary navigation">
      <NodeCard>
        <NodeIcon>
          <Icon name="hub" size={22} />
        </NodeIcon>
        <div>
          <NodeTitle>Node Alpha</NodeTitle>
          <NodeSubtitle>Active Monitoring</NodeSubtitle>
        </div>
      </NodeCard>

      <NavList>
        {ITEMS.map(({ id, icon, label }) => {
          const to = ROUTE_BY_ITEM[id];
          if (to) {
            return (
              <NavItemLink key={id} to={to} end={to === "/"} aria-current={activeItem === id ? "page" : undefined}>
                <Icon name={icon} size={20} filled={activeItem === id} />
                {label}
              </NavItemLink>
            );
          }

          return (
            <NavItemDisabled key={id} type="button" disabled title="Coming soon" aria-label={`${label} (coming soon)`}>
              <Icon name={icon} size={20} />
              {label}
            </NavItemDisabled>
          );
        })}
      </NavList>

      <Footer>
        <NavItemDisabled type="button" disabled title="Coming soon" aria-label="Help (coming soon)">
          <Icon name="help" size={20} />
          Help
        </NavItemDisabled>
        <NavItemDisabled type="button" disabled title="Coming soon" aria-label="Logout (coming soon)">
          <Icon name="logout" size={20} />
          Logout
        </NavItemDisabled>
      </Footer>
    </Aside>
  );
}
