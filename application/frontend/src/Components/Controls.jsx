import styled from "styled-components";

const Btn = styled.button`
  padding: 10px 16px;
  margin: 10px 10px 10px 0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #2563eb;
  color: white;

  &:hover {
    background: #1d4ed8;
  }
`;

const Stop = styled(Btn)`
  background: #444;

  &:hover {
    background: #666;
  }
`;

export default function Controls({ running, onStart, onStop }) {
  return (
    <div>
      {!running ? (
        <Btn onClick={onStart}>Start Detection</Btn>
      ) : (
        <Stop onClick={onStop}>Stop</Stop>
      )}
    </div>
  );
}