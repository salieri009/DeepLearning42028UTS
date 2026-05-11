import { useEffect, type RefObject } from "react";
import styled from "styled-components";
import type { AnalyzeFrameResponse } from "../types";

type VideoFeedProps = {
  running: boolean;
  data: AnalyzeFrameResponse | null;
  videoRef: RefObject<HTMLVideoElement | null>;
};

const Container = styled.div`
  position: relative;
  width: 720px;
  background: black;
`;

const VideoEl = styled.video`
  width: 100%;
  display: block;
`;

const Box = styled.div`
  position: absolute;
  border: 2px solid lime;
`;

const riskColor = (level?: string): string => {
  if (level === "DANGER") return "red";
  if (level === "WARNING") return "yellow";
  return "lime";
};

const Placeholder = styled.div`
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: gray;
`;

export default function VideoFeed({ running, data, videoRef }: VideoFeedProps) {
  useEffect(() => {
    if (!running && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [running, videoRef]);

  return (
    <Container>
      <VideoEl
        ref={videoRef}
        muted
        playsInline
        style={{ display: running ? "block" : "none" }}
      />

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
                borderColor: riskColor(person.risk_level),
              }}
            />
          );
        })}
    </Container>
  );
}

