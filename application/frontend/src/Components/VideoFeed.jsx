import { useEffect } from "react";
import styled from "styled-components";

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

const Placeholder = styled.div`
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: gray;
`;

// VideoFeed always renders the <video> element so App.jsx can set srcObject
// before the running state changes. The placeholder overlay is shown on top
// when the camera is off.
export default function VideoFeed({ running, data, videoRef }) {
  // Clear the video source when detection stops
  useEffect(() => {
    if (!running && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [running, videoRef]);

  return (
    <Container>
      {/* Always in DOM so App can attach srcObject before setting running=true */}
      <VideoEl ref={videoRef} muted playsInline style={{ display: running ? "block" : "none" }} />

      {!running && <Placeholder>Camera Off</Placeholder>}

      {/* Bounding boxes from persons[].bbox (YOLO normalized coords) */}
      {running && data?.persons?.map((person, i) => {
        const b = person.bbox;
        return (
          <Box
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