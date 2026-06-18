import styled from "styled-components";
import { useMapMarkers } from "@/features/live-map-markers";
import { AppShell } from "@/widgets/app-shell";
import { BottomNav } from "@/widgets/bottom-nav";
import { LiveMapStage } from "@/widgets/live-map-stage";
import { SideNav } from "@/widgets/side-nav";
import { TopNav } from "@/widgets/top-nav";
import { ChromeText, GlassPanel } from "@/shared/ui";

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Subtitle = styled.p`
  margin: ${({ theme }) => theme.spacing[2]} 0 0;
  color: ${({ theme }) => theme.color.textSecondary};
`;

const Disclaimer = styled.p`
  margin: ${({ theme }) => theme.spacing[1]} 0 0;
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.warning};
`;

const Badge = styled(GlassPanel)<{ $live?: boolean }>`
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme, $live }) => ($live ? theme.color.success : theme.color.textSecondary)};
`;

const LiveDot = styled.span<{ $live?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $live }) => ($live ? theme.color.success : theme.color.textSecondary)};
  animation: ${({ $live }) => ($live ? "pulse 2s ease-in-out infinite" : "none")};

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
`;

export function LiveMapPage() {
  const mapData = useMapMarkers();

  return (
    <AppShell
      topNav={<TopNav />}
      sideNav={<SideNav activeItem="traffic" />}
      bottomNav={<BottomNav />}
    >
      <Header>
        <div>
          <ChromeText as="h1" style={{ fontSize: "32px", textTransform: "uppercase" }}>
            Live Map
          </ChromeText>
          <Subtitle>
            GPS position plus zone risk from the last 24h of session telemetry
            {mapData.loading ? " · syncing…" : ""}
            {mapData.error ? ` · ${mapData.error}` : ""}
            {mapData.gpsError ? " · location unavailable" : ""}
          </Subtitle>
          {mapData.nearCampus === false && (
            <Disclaimer>
              Zone markers show a demo aggregate for UTS Sydney — not calibrated to your
              current area.
            </Disclaimer>
          )}
        </div>
        <Badge $live={mapData.isLive}>
          <LiveDot $live={mapData.isLive} />
          {mapData.isLive ? "LIVE TELEMETRY" : "TELEMETRY SYNC"}
        </Badge>
      </Header>

      <LiveMapStage center={mapData.center} zoom={mapData.zoom} markers={mapData.markers} />
    </AppShell>
  );
}
