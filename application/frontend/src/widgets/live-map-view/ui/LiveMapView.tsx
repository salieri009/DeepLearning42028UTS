import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import styled, { useTheme } from "styled-components";
import type { AppTheme } from "@/shared/config/theme";
import type { MapMarker } from "@/features/live-map-markers";
import { MapControls } from "@/widgets/map-controls";
import { GlassPanel } from "@/shared/ui";

type LiveMapViewProps = {
  center: [number, number];
  zoom: number;
  markers: MapMarker[];
};

function riskColor(theme: AppTheme, risk: MapMarker["risk"]) {
  if (risk === "DANGER") return theme.color.danger;
  if (risk === "WARNING") return theme.color.warning;
  return theme.color.success;
}

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
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.color.glass.scrim};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  backdrop-filter: blur(12px);
`;

const LegendTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.textPrimary};
`;

const LegendRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.textSecondary};
`;

export function LiveMapView({ center, zoom, markers }: LiveMapViewProps) {
  const theme = useTheme();

  return (
    <Wrapper>
      <Legend>
        <LegendTitle>Live Risk Map</LegendTitle>
        <LegendRow>
          <span style={{ color: theme.color.danger }}>Critical</span>
          <span style={{ color: theme.color.warning }}>Congested</span>
          <span style={{ color: theme.color.success }}>Optimal</span>
        </LegendRow>
      </Legend>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", background: theme.color.surfaceHigh }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <CircleMarker
            key={marker.id}
            center={[marker.lat, marker.lng]}
            radius={12}
            pathOptions={{
              color: riskColor(theme, marker.risk),
              fillColor: riskColor(theme, marker.risk),
              fillOpacity: 0.6,
              weight: 2,
            }}
          >
            <Popup>
              <strong>{marker.label}</strong>
              {marker.capacity && <div>{marker.capacity}</div>}
            </Popup>
          </CircleMarker>
        ))}
        <MapControls />
      </MapContainer>
    </Wrapper>
  );
}
