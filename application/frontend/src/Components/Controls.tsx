import styled from "styled-components";

type ControlsProps = {
  running: boolean;
  onStart: () => void | Promise<void>;
  onStop: () => void;
};

const Btn = styled.button`
  padding: 10px 16px;
  margin: 10px 10px 10px 0;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #0021f8;
  background: #0021f8;
  color: white;

  &:hover {
    background: #3700ff;
    font-weight: bold;
    border: 1px solid #3700ff;
  }
`;

const Stop = styled(Btn)`
  background: #ff0000;
  border: 1px solid #ff0000;

  &:hover {
    background: #9e1e1e;
    border: 1px solid #9e1e1e;
  }
`;

export default function Controls({ running, onStart, onStop }: ControlsProps) {
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

