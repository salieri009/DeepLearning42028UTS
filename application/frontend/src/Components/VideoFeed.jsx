import styled from "styled-components";

const Container = styled.div`
  position: relative;
  width: 720px;
  background: black;
`;

const Stream = styled.img`
  width: 100%;
`;

const Box = styled.div`
  position: absolute;
  border: 2px solid lime;
`;

const Arrow = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 40px;
`;

const Placeholder = styled.div`
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: gray;
`;


// will update on this further once backend connected 
export default function VideoFeed({ running, data }) {
  return (
    <Container>
      {!running && <Placeholder>Camera Off</Placeholder>}

      {running && (
        <>
          {/* live video stream */}
          <Stream src="" />
          {/* http://localhost:/video_feed */}

          {/* bounding boxes */}
          {data?.boxes?.map((b, i) => (
            <Box
              key={i}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: `${b.w}%`,
                height: `${b.h}%`
              }}
            />
          ))}

          {/* navigation arrow */}
          <Arrow>
            {data?.direction === "forward" && "⬆️"}
            {data?.direction === "left" && "⬅️"}
            {data?.direction === "right" && "➡️"}
            {data?.direction === "back" && "⬇️"}
          </Arrow>
        </>
      )}
    </Container>
  );
}