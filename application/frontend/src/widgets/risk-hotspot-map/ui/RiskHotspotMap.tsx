import { useCallback, useRef } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/maplibre";
import styled, { keyframes, useTheme } from "styled-components";
import type { HotspotMarker } from "@/entities/analytics";
import type { AppTheme } from "@/shared/config/theme";
import { UTS_SYDNEY_CENTER } from "@/shared/config/campusZones";
import { GlassPanel, Icon } from "@/shared/ui";
import "maplibre-gl/dist/maplibre-gl.css";

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/dark";
const DEFAULT_ZOOM = 15.5;

type RiskHotspotMapProps = {
  hotspots: HotspotMarker[];
};

const Card = styled(GlassPanel)`
  position: relative;
  height: ${({ theme }) => theme.layout.analyticsPanelHeight};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.glow};
`;

const Legend = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing[6]};
  left: ${({ theme }) => theme.spacing[6]};
  z-index: 2;
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.color.glass.fill};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  backdrop-filter: blur(${({ theme }) => theme.effects.glassBlur})
    saturate(${({ theme }) => theme.effects.glassSaturation});
`;

const LegendTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.color.textPrimary};
`;

const LegendHint = styled.p`
  margin: ${({ theme }) => theme.spacing[2]} 0 0;
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.textSecondary};
`;

const LegendRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[2]};
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

const Dot = styled.span<{ $variant: "danger" | "warning" }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $variant }) =>
    $variant === "danger" ? theme.color.danger : theme.color.warning};
`;

const Attribution = styled.div`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing[2]};
  right: ${({ theme }) => theme.spacing[2]};
  z-index: 2;
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.textSecondary};
  background: ${({ theme }) => theme.color.glass.scrim};
  padding: 0 ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const ping = keyframes`
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
`;

const MarkerShell = styled.div`
  position: relative;
  width: 48px;
  height: 48px;
`;

const Ping = styled.div<{ $color: string }>`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid ${({ $color }) => $color};
  animation: ${ping} 2s ease-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const MarkerCore = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}66`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.color.textInverse};
  position: relative;
`;

function riskColor(theme: AppTheme, risk: HotspotMarker["risk"]) {
  return risk === "DANGER" ? theme.color.danger : theme.color.warning;
}

export function RiskHotspotMap({ hotspots }: RiskHotspotMapProps) {
  const theme = useTheme();
  const mapRef = useRef<MapRef>(null);
  const [lat, lng] = UTS_SYDNEY_CENTER;

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.on("styleimagemissing", (event) => {
      const size = 1;
      map.addImage(event.id, { width: size, height: size, data: new Uint8Array(size * size * 4) });
    });
  }, []);

  return (
    <Card tabIndex={-1} aria-label="Geographic risk hotspot map">
      <Legend>
        <LegendTitle>Risk Hotspot Map</LegendTitle>
        <LegendHint>
          DANGER frames aggregated by campus zone (UTS Building 11 vicinity). Markers use real
          coordinates.
        </LegendHint>
        <LegendRow>
          <LegendItem>
            <Dot $variant="danger" /> Critical zone
          </LegendItem>
          <LegendItem>
            <Dot $variant="warning" /> Elevated
          </LegendItem>
        </LegendRow>
      </Legend>

      <Map
        ref={mapRef}
        initialViewState={{ latitude: lat, longitude: lng, zoom: DEFAULT_ZOOM }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={OPENFREEMAP_STYLE}
        attributionControl={false}
        onLoad={handleMapLoad}
      >
        {hotspots.map((spot) => {
          const color = riskColor(theme, spot.risk);
          return (
            <Marker
              key={spot.id}
              latitude={spot.lat}
              longitude={spot.lng}
              anchor="center"
            >
              <MarkerShell
                role="img"
                aria-label={`${spot.label}, ${spot.risk} risk, ${spot.metricLabel}`}
              >
                <Ping $color={color} />
                <MarkerCore $color={color}>
                  <Icon name="warning" size={20} />
                </MarkerCore>
              </MarkerShell>
            </Marker>
          );
        })}
      </Map>

      <Attribution>© OpenFreeMap · OpenStreetMap</Attribution>
    </Card>
  );
}
