import { useCallback, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styled, { css, useTheme } from "styled-components";
import { getBackendHealth, getBackendReadiness, getSettingsModelLabel } from "@/shared/api";
import { clearCustomSources } from "@/shared/lib/customSourcesStorage";
import { clearSensorSettings } from "@/shared/lib/sensorSettingsStorage";
import { Button, Icon, Modal } from "@/shared/ui";

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

type PanelKind = "health" | "assets" | "help" | null;

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
  backdrop-filter: blur(${({ theme }) => theme.effects.glassBlur}) saturate(${({ theme }) => theme.effects.glassSaturation});
  border-right: 1px solid ${({ theme }) => theme.color.glass.border};
  box-shadow: ${({ theme }) => theme.shadow.glow};

  @media (min-width: ${({ theme }) => theme.layout.gridBreakpointLg}) {
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
  width: ${({ theme }) => theme.spacing[7]};
  height: ${({ theme }) => theme.spacing[7]};
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
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.glass.border};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.focus};
    outline-offset: 2px;
  }

  &.active {
    color: ${({ theme }) => theme.color.textInverse};
    background: ${({ theme }) => theme.gradient.aqua};
    box-shadow: ${({ theme }) => theme.shadow.glow};
  }
`;

const NavItemLink = styled(NavLink)`
  ${navItemStyles}
`;

const NavItemButton = styled.button`
  ${navItemStyles}
`;

const Footer = styled.div`
  margin-top: auto;
  padding: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const ModalBody = styled.div`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.textPrimary};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const ModalPre = styled.pre`
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
`;

const StatusLine = styled.p`
  margin: 0;
`;

const ITEMS: { id: SideNavItem; icon: string; label: string }[] = [
  { id: "security", icon: "security", label: "Security" },
  { id: "analytics", icon: "analytics", label: "Analytics" },
  { id: "traffic", icon: "traffic", label: "Traffic" },
  { id: "health", icon: "monitor_heart", label: "Health" },
  { id: "assets", icon: "inventory_2", label: "Assets" },
  { id: "sensors", icon: "settings_input_component", label: "Sensors" },
  { id: "logs", icon: "history", label: "Archive" },
];

export function SideNav({ activeItem }: SideNavProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [panel, setPanel] = useState<PanelKind>(null);
  const [healthText, setHealthText] = useState<string>("");
  const [assetsText, setAssetsText] = useState<string>("");

  const openHealth = useCallback(async () => {
    setPanel("health");
    setHealthText("Loading...");
    try {
      const [health, readiness] = await Promise.all([
        getBackendHealth(),
        getBackendReadiness(),
      ]);
      setHealthText(
        `Liveness: ${health.status}\nReadiness: ${readiness.status}\n\nComponents:\n${JSON.stringify(readiness.components ?? health.components ?? {}, null, 2)}`,
      );
    } catch {
      setHealthText("Unable to reach backend health endpoints.");
    }
  }, []);

  const openAssets = useCallback(async () => {
    setPanel("assets");
    setAssetsText("Loading...");
    try {
      const model = await getSettingsModelLabel();
      setAssetsText(
        `Detection model: ${model}\nWeights: application/models/best.pt (YOLOv8m person-only)\nStack: React → Spring Boot → FastAPI`,
      );
    } catch {
      setAssetsText("Unable to load asset metadata.");
    }
  }, []);

  const handleLogout = () => {
    clearCustomSources();
    clearSensorSettings();
    navigate("/");
  };

  return (
    <>
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
                <NavItemLink
                  key={id}
                  to={to}
                  end={to === "/"}
                  className={activeItem === id ? "active" : undefined}
                  aria-current={activeItem === id ? "page" : undefined}
                >
                  <Icon name={icon} size={20} filled={activeItem === id} />
                  {label}
                </NavItemLink>
              );
            }

            if (id === "health") {
              return (
                <NavItemButton key={id} type="button" onClick={() => void openHealth()}>
                  <Icon name={icon} size={20} />
                  {label}
                </NavItemButton>
              );
            }

            if (id === "assets") {
              return (
                <NavItemButton key={id} type="button" onClick={() => void openAssets()}>
                  <Icon name={icon} size={20} />
                  {label}
                </NavItemButton>
              );
            }

            return null;
          })}
        </NavList>

        <Footer>
          <NavItemButton type="button" onClick={() => setPanel("help")} aria-label="Help">
            <Icon name="help" size={20} />
            Help
          </NavItemButton>
          <NavItemButton type="button" onClick={handleLogout} aria-label="Logout and clear local data">
            <Icon name="logout" size={20} />
            Logout
          </NavItemButton>
        </Footer>
      </Aside>

      <Modal open={panel === "health"} title="System Health" onClose={() => setPanel(null)}>
        <ModalBody>
          <ModalPre>{healthText}</ModalPre>
        </ModalBody>
      </Modal>

      <Modal open={panel === "assets"} title="Deployed Assets" onClose={() => setPanel(null)}>
        <ModalBody>
          <ModalPre>{assetsText}</ModalPre>
        </ModalBody>
      </Modal>

      <Modal
        open={panel === "help"}
        title="CrowdNav Help"
        onClose={() => setPanel(null)}
        width={theme.layout.modalWideWidth}
      >
        <ModalBody>
          <StatusLine>S1 — Dashboard: Start Monitoring for live crowd and proximity guidance.</StatusLine>
          <StatusLine>S2 — Archive: Review persisted sessions and export JSON bundles.</StatusLine>
          <StatusLine>S3 — Live Map: GPS position plus zone congestion markers.</StatusLine>
          <StatusLine>S4 — Analytics: Weekly safety score and peak density charts.</StatusLine>
          <StatusLine>S5 — Settings: Tune confidence threshold and detection model.</StatusLine>
          <Button type="button" $variant="primary" onClick={() => setPanel(null)}>
            Got it
          </Button>
        </ModalBody>
      </Modal>
    </>
  );
}
