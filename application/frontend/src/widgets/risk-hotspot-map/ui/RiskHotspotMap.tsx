import { useCallback, useState } from "react";
import styled, { keyframes } from "styled-components";
import type { HotspotMarker } from "@/entities/analytics";
import { GlassPanel, HudButton, Icon } from "@/shared/ui";

type RiskHotspotMapProps = {
  hotspots: HotspotMarker[];
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

const Card = styled(GlassPanel)`
  position: relative;
  height: 520px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.glow};
`;

const MapViewport = styled.div<{ $zoom: number }>`
  position: absolute;
  inset: 0;
  transform: scale(${({ $zoom }) => $zoom});
  transform-origin: center center;
  transition: transform 120ms ease;
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
  background: linear-gradient(transparent 50%, ${({ theme }) => theme.color.tint.scanlineBand} 50%);
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
  font-size: ${({ theme }) => theme.typography.size[1]};
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

export function RiskHotspotMap({ hotspots }: RiskHotspotMapProps) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [layersVisible, setLayersVisible] = useState(true);

  const zoomIn = useCallback(() => {
    setZoom((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP));
  }, []);

  const resetView = useCallback(() => {
    setZoom(MIN_ZOOM);
  }, []);

  const toggleLayers = useCallback(() => {
    setLayersVisible((visible) => !visible);
  }, []);

  return (
    <Card>
      <MapViewport $zoom={zoom} aria-label="Risk hotspot map viewport">
        <MapImage />
        <Scanline />

        {layersVisible && (
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
        )}

        {layersVisible &&
          hotspots.map((spot) => {
            const variant = spot.risk === "DANGER" ? "danger" : "warning";
            return (
              <Marker key={spot.id} $top={spot.top} $left={spot.left} role="img" aria-label={`${spot.label}, ${spot.risk} risk, capacity ${spot.capacity}`}>
                <Ping $variant={variant} />
                <MarkerCore $variant={variant}>
                  <Icon name="warning" size={20} />
                </MarkerCore>
              </Marker>
            );
          })}
      </MapViewport>

      <Hud>
        <HudButton
          type="button"
          aria-label="Layers"
          aria-pressed={layersVisible}
          $active={layersVisible}
          onClick={toggleLayers}
        >
          <Icon name="layers" size={20} />
        </HudButton>
        <HudButton
          type="button"
          aria-label="Zoom in"
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
        >
          <Icon name="zoom_in" size={20} />
        </HudButton>
        <HudButton type="button" aria-label="My location" onClick={resetView} disabled={zoom === MIN_ZOOM}>
          <Icon name="my_location" size={20} />
        </HudButton>
      </Hud>
    </Card>
  );
}
