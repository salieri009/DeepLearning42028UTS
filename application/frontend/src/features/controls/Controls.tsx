import { Button } from "../../ui/Button";

type ControlsProps = {
  running: boolean;
  onStart: () => void | Promise<void>;
  onStop: () => void;
};

export default function Controls({ running, onStart, onStop }: ControlsProps) {
  return !running ? (
    <Button onClick={onStart} $variant="primary">
      Start Detection
    </Button>
  ) : (
    <Button onClick={onStop} $variant="danger">
      Stop
    </Button>
  );
}

