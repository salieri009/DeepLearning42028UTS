import { NavLink, useLocation } from "react-router-dom";
import styled from "styled-components";
import { Icon } from "@/shared/ui";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "home", end: true },
  { to: "/analytics", label: "Stats", icon: "analytics", end: false },
  { to: "/live-map", label: "Map", icon: "map", end: false },
  { to: "/archive", label: "Logs", icon: "history", end: false },
  { to: "/settings", label: "Sensors", icon: "tune", end: false },
] as const;

const Nav = styled.nav`
  display: flex;
  position: fixed;
  bottom: ${({ theme }) => theme.spacing[6]};
  left: 50%;
  transform: translateX(-50%);
  z-index: ${({ theme }) => theme.layout.zIndex.chrome};
  min-width: min(100%, 360px);
  max-width: calc(100vw - ${({ theme }) => theme.spacing[6]});
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[6]}`};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.color.glass.fill};
  backdrop-filter: blur(24px);
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  box-shadow: ${({ theme }) => theme.shadow.glow};
  justify-content: space-around;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (min-width: 768px) {
    display: none;
  }
`;

const NavLinkItem = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: transparent;
  color: ${({ theme }) => theme.color.textSecondary};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  text-decoration: none;
  transition: background 120ms ease, color 120ms ease;

  &.active {
    background: ${({ theme }) => theme.gradient.aqua};
    color: ${({ theme }) => theme.color.textInverse};
  }
`;

export function BottomNav() {
  const location = useLocation();

  return (
    <Nav aria-label="Mobile page navigation">
      {NAV_ITEMS.map(({ to, label, icon, end }) => (
        <NavLinkItem
          key={to}
          to={to}
          end={end}
          aria-current={location.pathname === to || (!end && location.pathname.startsWith(to)) ? "page" : undefined}
        >
          <Icon name={icon} size={22} filled={location.pathname === to} />
          {label}
        </NavLinkItem>
      ))}
    </Nav>
  );
}
