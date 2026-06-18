import { useState } from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { useOptionalAlertHistory } from "@/app/providers/AlertHistoryProvider";
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
  backdrop-filter: blur(${({ theme }) => theme.effects.glassBlur}) saturate(${({ theme }) => theme.effects.glassSaturation});
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
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  text-transform: uppercase;
`;

const TabGroup = styled.nav`
  display: none;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[6]};

  @media (min-width: ${({ theme }) => theme.layout.tabletBreakpoint}) {
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

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  &:hover {
    color: ${({ theme }) => theme.color.primary};
  }

  &.active {
    color: ${({ theme }) => theme.color.primary};
    border-bottom-color: ${({ theme }) => theme.color.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.focus};
    outline-offset: 2px;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  position: relative;
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

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.focus};
    outline-offset: 2px;
  }
`;

const IconButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.spacing[7]};
  height: ${({ theme }) => theme.spacing[7]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: transparent;
  color: ${({ theme }) => theme.color.textSecondary};
  cursor: pointer;
  transition: color 120ms ease, background 120ms ease;

  &:hover {
    color: ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.glass.fill};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.focus};
    outline-offset: 2px;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: ${({ theme }) => theme.spacing[1]};
  right: ${({ theme }) => theme.spacing[1]};
  min-width: ${({ theme }) => theme.spacing[4]};
  height: ${({ theme }) => theme.spacing[4]};
  padding: 0 ${({ theme }) => theme.spacing[1]};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.color.danger};
  color: ${({ theme }) => theme.color.textInverse};
  font-size: ${({ theme }) => theme.typography.size[1]};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  line-height: ${({ theme }) => theme.spacing[4]};
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.spacing[2]});
  right: 0;
  width: ${({ theme }) => theme.layout.dropdownWidth};
  max-height: ${({ theme }) => theme.layout.dropdownMaxHeight};
  overflow-y: auto;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.glass.scrim};
  backdrop-filter: blur(${({ theme }) => theme.effects.glassBlur}) saturate(${({ theme }) => theme.effects.glassSaturation});
  box-shadow: ${({ theme }) => theme.shadow.glow};
  padding: ${({ theme }) => theme.spacing[3]};
`;

const DropdownTitle = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.textSecondary};
`;

const AlertRow = styled.div<{ $risk: string }>`
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.md};
  border-left: ${({ theme }) => theme.spacing[1]} solid
    ${({ theme, $risk }) =>
      $risk === "DANGER"
        ? theme.color.danger
        : $risk === "WARNING"
          ? theme.color.warning
          : theme.color.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.size[2]};
  background: ${({ theme }) => theme.color.glass.fill};
`;

const AlertMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.textSecondary};
`;

const EmptyNote = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textSecondary};
  font-size: ${({ theme }) => theme.typography.size[2]};
`;

const Avatar = styled.div`
  width: ${({ theme }) => theme.spacing[6]};
  height: ${({ theme }) => theme.spacing[6]};
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.glass.fillStrong};
  overflow: hidden;
`;

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/analytics", label: "Analytics", end: false },
  { to: "/live-map", label: "Live Map", end: false },
  { to: "/archive", label: "Archive", end: false },
] as const;

export function TopNav({ running = false }: TopNavProps) {
  const { alerts, formatAlertMeta } = useOptionalAlertHistory();
  const [open, setOpen] = useState(false);

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
        <IconButton
          type="button"
          aria-label="Notifications"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((prev) => !prev)}
        >
          <Icon name="notifications" size={22} />
          {alerts.length > 0 ? <Badge>{alerts.length}</Badge> : null}
        </IconButton>
        {open ? (
          <Dropdown role="menu" aria-label="Recent alerts">
            <DropdownTitle>Recent Alerts</DropdownTitle>
            {alerts.length === 0 ? (
              <EmptyNote>No alerts yet. Start monitoring on the dashboard.</EmptyNote>
            ) : (
              alerts.map((alert) => (
                <AlertRow key={alert.id} $risk={alert.risk}>
                  <strong>{alert.message}</strong>
                  <AlertMeta>{formatAlertMeta(alert)}</AlertMeta>
                </AlertRow>
              ))
            )}
          </Dropdown>
        ) : null}
        <IconLink to="/settings" aria-label="Settings">
          <Icon name="settings" size={22} />
        </IconLink>
        <Avatar aria-hidden />
      </Actions>
    </Header>
  );
}
