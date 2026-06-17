import styled, { keyframes } from "styled-components";
import type { HotspotMarker } from "@/entities/analytics";
import { GlassPanel, Icon } from "@/shared/ui";

type RiskHotspotMapProps = {
  hotspots: HotspotMarker[];
};

const Card = styled(GlassPanel)`
  position: relative;
  height: 520px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.glow};
`;

const MapImage = styled.div`
  position: absolute;
  inset: 0;
  background: ${({ theme }) => theme.color.surfaceHigh};
  opacity: 0.6;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 33% 25%, ${({ theme }) => theme.color.danger}4d 0%, transparent 40%),
      radial-gradient(circle at 75% 66%, ${({ theme }) => theme.color.warning}33 0%, transparent 40%);
  }
`;

const Scanline = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.1;
  background: linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.1) 50%);
  background-size: 100% 2px;
  pointer-events: none;
`;

const Legend = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing[6]};
  left: ${({ theme }) => theme.spacing[6]};
  z-index: 10;
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.color.glass.fill};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  backdrop-filter: blur(12px);
`;

const LegendTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.color.textPrimary};
`;

const LegendRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.textSecondary};
`;

const Dot = styled.span<{ $variant: "danger" | "warning" | "safe" }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $variant }) => {
    if ($variant === "danger") return theme.color.danger;
    if ($variant === "warning") return theme.color.warning;
    return theme.color.success;
  }};
`;

const ping = keyframes`
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
`;

const Marker = styled.div<{ $top: string; $left: string }>`
  position: absolute;
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  transform: translate(-50%, -50%);
  z-index: 20;
`;

const Ping = styled.div<{ $variant: "danger" | "warning" }>`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid
    ${({ theme, $variant }) =>
      $variant === "danger" ? theme.color.danger : theme.color.warning};
  animation: ${ping} 2s ease-out infinite;
`;

const MarkerCore = styled.div<{ $variant: "danger" | "warning" }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid
    ${({ theme, $variant }) =>
      $variant === "danger" ? theme.color.danger : theme.color.warning};
  background: ${({ theme, $variant }) =>
    $variant === "danger" ? `${theme.color.danger}66` : `${theme.color.warning}66`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.color.textInverse};
  position: relative;
`;

const Hud = styled.div`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing[6]};
  right: ${({ theme }) => theme.spacing[6]};
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  z-index: 10;
`;

const HudButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.glass.fill};
  color: ${({ theme }) => theme.color.textPrimary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.color.glass.fillStrong};
  }
`;

export function RiskHotspotMap({ hotspots }: RiskHotspotMapProps) {
  return (
    <Card>
      <MapImage />
      <Scanline />
      <Legend>
        <LegendTitle>Risk Hotspot Map</LegendTitle>
        <LegendRow>
          <LegendItem>
            <Dot $variant="danger" /> Critical
          </LegendItem>
          <LegendItem>
            <Dot $variant="warning" /> Congested
          </LegendItem>
          <LegendItem>
            <Dot $variant="safe" /> Optimal
          </LegendItem>
        </LegendRow>
      </Legend>

      {hotspots.map((spot) => {
        const variant = spot.risk === "DANGER" ? "danger" : "warning";
        return (
          <Marker key={spot.id} $top={spot.top} $left={spot.left}>
            <Ping $variant={variant} />
            <MarkerCore $variant={variant}>
              <Icon name="warning" size={20} />
            </MarkerCore>
          </Marker>
        );
      })}

      <Hud>
        <HudButton type="button" aria-label="Layers">
          <Icon name="layers" size={20} />
        </HudButton>
        <HudButton type="button" aria-label="Zoom in">
          <Icon name="zoom_in" size={20} />
        </HudButton>
        <HudButton type="button" aria-label="My location">
          <Icon name="my_location" size={20} />
        </HudButton>
      </Hud>
    </Card>
  );
}
