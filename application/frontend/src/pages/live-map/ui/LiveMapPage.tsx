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

const Badge = styled(GlassPanel)`
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.success};
`;

const LiveDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.success};
  animation: pulse 2s ease-in-out infinite;

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
          <ChromeText style={{ fontSize: "32px", textTransform: "uppercase" }}>
            Live Map
          </ChromeText>
          <Subtitle>OpenFreeMap overlay with real-time sensor risk markers.</Subtitle>
        </div>
        <Badge>
          <LiveDot />
          LIVE FEED ACTIVE
        </Badge>
      </Header>

      <LiveMapStage center={mapData.center} zoom={mapData.zoom} markers={mapData.markers} />
    </AppShell>
  );
}
