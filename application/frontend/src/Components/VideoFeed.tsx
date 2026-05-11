import { useEffect, type RefObject } from "react";
import styled from "styled-components";
import type { AnalyzeFrameResponse, ProximityRisk } from "../types";

type Props = {
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

const Placeholder = styled.div`
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: gray;
`;

const RISK_COLOR: Record<ProximityRisk, string> = {
  SAFE: "#00e676",
  WARNING: "#ffea00",
  DANGER: "#ff1744",
};

export default function VideoFeed({ running, data, videoRef }: Props) {
  useEffect(() => {
    if (!running && videoRef.current) videoRef.current.srcObject = null;
  }, [running, videoRef]);

  return (
    <Container>
      <VideoEl ref={videoRef} muted playsInline style={{ display: running ? "block" : "none" }} />
      {!running && <Placeholder>Camera Off</Placeholder>}

      {running &&
        (data?.persons ?? []).map((person, i) => {
          const b = person.bbox;
          const color = RISK_COLOR[(person.proximity_risk as ProximityRisk) ?? "SAFE"];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${(b.x_center - b.width / 2) * 100}%`,
                top: `${(b.y_center - b.height / 2) * 100}%`,
                width: `${b.width * 100}%`,
                height: `${b.height * 100}%`,
                border: `2px solid ${color}`,
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: -18,
                  left: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#000",
                  background: color,
                  padding: "1px 4px",
                  borderRadius: 3,
                  whiteSpace: "nowrap",
                }}
              >
                {person.proximity_risk ?? "SAFE"} {Math.round((person.confidence ?? 0) * 100)}%
              </span>
            </div>
          );
        })}
    </Container>
  );
}
