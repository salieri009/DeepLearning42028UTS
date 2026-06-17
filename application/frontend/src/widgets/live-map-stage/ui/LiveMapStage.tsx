import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import styled, { useTheme } from "styled-components";
import type { AppTheme } from "@/shared/config/theme";
import type { MapMarker } from "@/features/live-map-markers";
import { GlassPanel } from "@/shared/ui";
import "maplibre-gl/dist/maplibre-gl.css";

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

type LiveMapStageProps = {
  center: [number, number];
  zoom: number;
  markers: MapMarker[];
};

const Wrapper = styled(GlassPanel)`
  position: relative;
  height: 520px;
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
  background: ${({ theme }) => theme.color.glass.scrim};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  backdrop-filter: blur(12px);
`;

const LegendTitle = styled.h3`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.textPrimary};
`;

const Attribution = styled.div`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing[2]};
  right: ${({ theme }) => theme.spacing[2]};
  z-index: 2;
  font-size: 10px;
  color: ${({ theme }) => theme.color.textSecondary};
  background: ${({ theme }) => theme.color.glass.scrim};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const MarkerDot = styled.div<{ $color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: 2px solid ${({ theme }) => theme.color.textInverse};
  box-shadow: 0 0 12px ${({ $color }) => $color};
`;

function riskColor(theme: AppTheme, risk: MapMarker["risk"]) {
  if (risk === "DANGER") return theme.color.danger;
  if (risk === "WARNING") return theme.color.warning;
  return theme.color.success;
}

export function LiveMapStage({ center, zoom, markers }: LiveMapStageProps) {
  const theme = useTheme();
  const [lng, lat] = center;

  return (
    <Wrapper>
      <Legend>
        <LegendTitle>Live Risk Map</LegendTitle>
      </Legend>
      <Map
        initialViewState={{ longitude: lng, latitude: lat, zoom }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={OPENFREEMAP_STYLE}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" />
        {markers.map((marker) => (
          <Marker key={marker.id} longitude={marker.lng} latitude={marker.lat} anchor="center">
            <MarkerDot
              $color={riskColor(theme, marker.risk)}
              title={marker.label}
            />
          </Marker>
        ))}
      </Map>
      <Attribution>OpenFreeMap · OpenStreetMap</Attribution>
    </Wrapper>
  );
}
