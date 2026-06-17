import styled from "styled-components";
import { Button, GlassPanel, Icon } from "@/shared/ui";

type ControlBarProps = {
  running: boolean;
  onStart: () => void | Promise<void>;
  onStop: () => void;
};

const Nav = styled.nav`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing[5]};
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 0 ${({ theme }) => theme.spacing[4]};
  pointer-events: none;
`;

const Bar = styled(GlassPanel)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.full};
  pointer-events: auto;
  max-width: 100%;
  overflow-x: auto;
`;

const Divider = styled.div`
  width: 1px;
  height: 32px;
  background: ${({ theme }) => theme.color.glass.border};
  margin: 0 ${({ theme }) => theme.spacing[2]};
`;

export function ControlBar({ running, onStart, onStop }: ControlBarProps) {
  return (
    <Nav>
      <Bar>
        {!running ? (
          <Button $variant="primary" $pill onClick={onStart}>
            <Icon name="play_arrow" size={20} />
            Start Monitoring
          </Button>
        ) : (
          <Button $variant="danger" $pill onClick={onStop}>
            <Icon name="stop_circle" size={20} />
            Stop Monitoring
          </Button>
        )}

        <Button $variant="ghost" disabled title="Coming soon">
          <Icon name="videocam" size={20} />
          Record
        </Button>

        <Button $variant="ghost" disabled title="Coming soon">
          <Icon name="download" size={20} />
          Export
        </Button>

        <Divider />

        <Button
          $variant="danger"
          onClick={onStop}
          disabled={!running}
          title={running ? "Stop monitoring" : "Not running"}
          aria-label="Stop"
        >
          <Icon name="stop_circle" size={22} />
        </Button>
      </Bar>
    </Nav>
  );
}
