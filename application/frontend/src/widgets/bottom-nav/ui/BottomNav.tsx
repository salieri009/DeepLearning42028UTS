import { NavLink, useLocation } from "react-router-dom";
import styled from "styled-components";
import { Icon } from "@/shared/ui";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", shortLabel: "Home", icon: "home", end: true },
  { to: "/analytics", label: "Analytics", shortLabel: "Stats", icon: "analytics", end: false },
  { to: "/live-map", label: "Live Map", shortLabel: "Map", icon: "map", end: false },
  { to: "/archive", label: "Archive", shortLabel: "Archive", icon: "history", end: false },
  { to: "/settings", label: "Settings", shortLabel: "Setup", icon: "tune", end: false },
] as const;

const Nav = styled.nav`
  display: flex;
  position: fixed;
  bottom: ${({ theme }) => theme.spacing[6]};
  left: 50%;
  transform: translateX(-50%);
  z-index: ${({ theme }) => theme.layout.zIndex.chrome};
  min-width: min(100%, ${({ theme }) => theme.layout.mobileNavMaxWidth});
  max-width: calc(100vw - ${({ theme }) => theme.spacing[6]});
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[6]}`};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.color.glass.fill};
  backdrop-filter: blur(${({ theme }) => theme.effects.glassBlur}) saturate(${({ theme }) => theme.effects.glassSaturation});
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  box-shadow: ${({ theme }) => theme.shadow.glow};
  justify-content: space-around;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.layout.mobileNavCompactBreakpoint}) {
    padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
    gap: ${({ theme }) => theme.spacing[2]};
  }

  @media (min-width: ${({ theme }) => theme.layout.tabletBreakpoint}) {
    display: none;
  }
`;

const NavLinkItem = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  min-height: ${({ theme }) => theme.spacing[7]};
  min-width: ${({ theme }) => theme.spacing[7]};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.full};
  background: transparent;
  color: ${({ theme }) => theme.color.textSecondary};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  text-decoration: none;
  transition: background 120ms ease, color 120ms ease;

  @media (max-width: ${({ theme }) => theme.layout.mobileNavCompactBreakpoint}) {
    padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[2]}`};
    min-width: ${({ theme }) => theme.spacing[6]};
  }

  &.active {
    color: ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.glass.fillStrong};
    border: 1px solid ${({ theme }) => theme.color.primary};
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.focus};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const LongLabel = styled.span`
  @media (max-width: ${({ theme }) => theme.layout.mobileNavCompactBreakpoint}) {
    display: none;
  }
`;

const ShortLabel = styled.span`
  display: none;

  @media (max-width: ${({ theme }) => theme.layout.mobileNavCompactBreakpoint}) {
    display: inline;
  }
`;

export function BottomNav() {
  const location = useLocation();

  return (
    <Nav aria-label="Mobile page navigation">
      {NAV_ITEMS.map(({ to, label, shortLabel, icon, end }) => (
        <NavLinkItem
          key={to}
          to={to}
          end={end}
          aria-current={location.pathname === to || (!end && location.pathname.startsWith(to)) ? "page" : undefined}
        >
          <Icon name={icon} size={22} filled={location.pathname === to} />
          <LongLabel>{label}</LongLabel>
          <ShortLabel>{shortLabel}</ShortLabel>
        </NavLinkItem>
      ))}
    </Nav>
  );
}
