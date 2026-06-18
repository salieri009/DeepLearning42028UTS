import type { RefObject } from "react";
import styled from "styled-components";
import type { AnalyzeFrameResponse } from "@/entities/detection";
import { PersonBBox } from "@/entities/detection";
import { GlassPanel, Icon, Label, Text } from "@/shared/ui";

type VideoStageProps = {
  running: boolean;
  data: AnalyzeFrameResponse | null;
  videoRef: RefObject<HTMLVideoElement | null>;
};

const Stage = styled.main`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.layout.zIndex.stage};
  pointer-events: none;
  background: ${({ theme }) => theme.tokens.color.surface.lowest};
`;

const GridTexture = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.2;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 24px 24px;
`;

const Scanline = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  opacity: 0.15;
  background:
    linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%),
    linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02));
  background-size: 100% 4px, 3px 100%;
`;

const VideoEl = styled.video<{ $visible: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${({ $visible }) => ($visible ? 0.85 : 0)};
  display: ${({ $visible }) => ($visible ? "block" : "none")};
`;

const Placeholder = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[3]};
  color: ${({ theme }) => theme.color.textSecondary};
  background: ${({ theme }) => theme.tokens.color.surface.lowest};
`;

const OverlayLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  padding: ${({ theme }) => theme.spacing[6]};
  padding-bottom: ${({ theme }) => theme.layout.videoSafeInsetBottom};
  padding-right: calc(${({ theme }) => theme.layout.sidebarWidth} + ${({ theme }) => theme.spacing[6]});

  @media (max-width: 1024px) {
    padding-right: ${({ theme }) => theme.spacing[6]};
  }
`;

const AlertChip = styled(GlassPanel)<{ $tone: "warning" | "danger" }>`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-left: 4px solid
    ${({ theme, $tone }) => ($tone === "danger" ? theme.color.danger : theme.color.warning)};
  background: ${({ theme }) => theme.color.glass.scrim};

  @media (max-width: 1024px) {
    top: calc(${({ theme }) => theme.layout.headerHeight} + ${({ theme }) => theme.spacing[4]});
    right: ${({ theme }) => theme.spacing[4]};
    position: fixed;
  }
`;

const IconWrap = styled.div<{ $tone: "warning" | "danger" }>`
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, $tone }) =>
    $tone === "danger" ? "rgba(218, 30, 40, 0.2)" : "rgba(241, 194, 27, 0.2)"};
  color: ${({ theme, $tone }) => ($tone === "danger" ? theme.color.danger : theme.color.warning)};
`;

export function VideoStage({ running, data, videoRef }: VideoStageProps) {
  const recommendation = data?.recommendation?.toUpperCase();
  const showChip =
    running && recommendation && recommendation !== "PROCEED" && recommendation !== "SAFE";

  return (
    <Stage>
      <GridTexture />
      <Scanline />
      <VideoEl ref={videoRef} muted playsInline $visible={running} />
      {!running && (
        <Placeholder>
          <Icon name="videocam_off" size={48} />
          <Text $tone="secondary">Camera Off — press Start Monitoring</Text>
        </Placeholder>
      )}

      {running && (
        <OverlayLayer>
          {(data?.persons ?? []).map((person, i) => (
            <PersonBBox key={i} person={person} />
          ))}

          {showChip && (
            <AlertChip $tone={recommendation === "STOP" ? "danger" : "warning"}>
              <IconWrap $tone={recommendation === "STOP" ? "danger" : "warning"}>
                <Icon
                  name="notification_important"
                  filled
                  size={22}
                  className={
                    recommendation === "STOP" ? "text-risk-danger" : "text-risk-warning"
                  }
                />
              </IconWrap>
              <div>
                <Label $tone="secondary">Crowd Density Alert</Label>
                <Text $tone={recommendation === "STOP" ? "danger" : "warning"}>
                  {recommendation} ZONE
                </Text>
              </div>
            </AlertChip>
          )}
        </OverlayLayer>
      )}
    </Stage>
  );
}
