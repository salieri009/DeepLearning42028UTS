import { useEffect, type RefObject } from "react";
import styled from "styled-components";
import type { AnalyzeFrameResponse } from "../../types";

type VideoFeedProps = {
  running: boolean;
  data: AnalyzeFrameResponse | null;
  videoRef: RefObject<HTMLVideoElement | null>;
};

const Container = styled.div`
  position: relative;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.mediaMaxWidth};
  background: ${({ theme }) => theme.color.neutral?.[100] ?? "#000"};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`;

const VideoEl = styled.video<{ $running: boolean }>`
  width: 100%;
  display: ${({ $running }) => ($running ? "block" : "none")};
`;

const Box = styled.div`
  position: absolute;
  border: 2px solid ${({ theme }) => theme.color.overlayBorder};
  box-shadow: 0 0 0 1px ${({ theme }) => theme.color.overlayBorderSubtle};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const Placeholder = styled.div`
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.color.textSecondary};
  background: ${({ theme }) => theme.color.surfaceSubtle};
`;

export default function VideoFeed({ running, data, videoRef }: VideoFeedProps) {
  useEffect(() => {
    if (!running && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [running, videoRef]);

  return (
    <Container>
      <VideoEl ref={videoRef} muted playsInline $running={running} />

      {!running && <Placeholder>Camera Off</Placeholder>}

      {running &&
        data?.persons?.map((person, i) => {
          const b = person.bbox;
          return (
            <Box
              // backend order is stable enough for UI; index key is acceptable here
              key={i}
              style={{
                left: `${(b.x_center - b.width / 2) * 100}%`,
                top: `${(b.y_center - b.height / 2) * 100}%`,
                width: `${b.width * 100}%`,
                height: `${b.height * 100}%`,
              }}
            />
          );
        })}
    </Container>
  );
}

