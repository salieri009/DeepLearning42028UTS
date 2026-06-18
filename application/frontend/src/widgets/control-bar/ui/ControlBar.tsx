import styled from "styled-components";
import { Button, GlassPanel, Icon, VisuallyHidden } from "@/shared/ui";

type ControlBarProps = {
  running: boolean;
  onStart: () => void | Promise<void>;
  onStop: () => void;
};

const Toolbar = styled.div`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing[5]};
  left: 0;
  right: 0;
  z-index: ${({ theme }) => theme.layout.zIndex.chrome};
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

export function ControlBar({ running, onStart, onStop }: ControlBarProps) {
  return (
    <Toolbar role="toolbar" aria-label="Monitoring controls">
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
          <VisuallyHidden> (coming soon)</VisuallyHidden>
        </Button>

        <Button $variant="ghost" disabled title="Coming soon">
          <Icon name="download" size={20} />
          Export
          <VisuallyHidden> (coming soon)</VisuallyHidden>
        </Button>
      </Bar>
    </Toolbar>
  );
}
