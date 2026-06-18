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
  background-image: radial-gradient(circle, ${({ theme }) => theme.color.texture.gridDot} 1px, transparent 1px);
  background-size: 24px 24px;
`;

const Scanline = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  opacity: 0.15;
  background:
    linear-gradient(${({ theme }) => theme.color.texture.scanlineFade} 50%, ${({ theme }) => theme.color.tint.scanlineBand} 50%),
    ${({ theme }) => theme.color.texture.scanlineChroma};
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
    $tone === "danger" ? theme.color.riskTint.danger : theme.color.riskTint.warning};
  color: ${({ theme, $tone }) => ($tone === "danger" ? theme.color.danger : theme.color.warning)};
`;

export function VideoStage({ running, data, videoRef }: VideoStageProps) {
  const recommendation = data?.recommendation?.toUpperCase();
  const showChip =
    running && recommendation && recommendation !== "PROCEED" && recommendation !== "SAFE";

  return (
    <Stage id="dashboard-main">
      <GridTexture />
      <Scanline />
      <VideoEl
        ref={videoRef}
        muted
        playsInline
        $visible={running}
        aria-label={running ? "Live camera monitoring feed" : undefined}
      />
      {!running && (
        <Placeholder>
          <Icon name="videocam_off" size={48} />
          <Text $tone="secondary">Camera Off — press Start Monitoring</Text>
        </Placeholder>
      )}

      {running && (
        <OverlayLayer>
          <div aria-hidden="true">
            {(data?.persons ?? []).map((person, i) => (
              <PersonBBox key={i} person={person} />
            ))}
          </div>

          {showChip && (
            <AlertChip
              $tone={recommendation === "STOP" ? "danger" : "warning"}
              role="status"
              aria-live={recommendation === "STOP" ? "assertive" : "polite"}
            >
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
