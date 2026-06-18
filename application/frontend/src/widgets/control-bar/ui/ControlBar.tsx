import styled from "styled-components";
import { Button, GlassPanel, Icon } from "@/shared/ui";

type ControlBarProps = {
  running: boolean;
  recording?: boolean;
  exportDisabled?: boolean;
  onStart: () => void | Promise<void>;
  onStop: () => void;
  onRecord?: () => void;
  onExport?: () => void;
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
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.full};
  box-shadow: ${({ theme }) => theme.shadow.glow};
  pointer-events: auto;
  max-width: 100%;
  overflow-x: auto;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Divider = styled.span`
  width: 1px;
  height: ${({ theme }) => theme.spacing[6]};
  margin: 0 ${({ theme }) => theme.spacing[1]};
  background: ${({ theme }) => theme.color.glass.border};
  flex-shrink: 0;
`;

export function ControlBar({
  running,
  recording = false,
  exportDisabled = true,
  onStart,
  onStop,
  onRecord,
  onExport,
}: ControlBarProps) {
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

        <Divider aria-hidden="true" />

        <Button
          type="button"
          $variant={recording ? "danger" : "ghost"}
          $size="md"
          disabled={!running}
          onClick={onRecord}
          aria-pressed={recording}
          aria-label={recording ? "Stop recording" : "Start recording"}
          title={running ? (recording ? "Stop recording" : "Record session video") : "Start monitoring to record"}
        >
          <Icon name={recording ? "stop" : "videocam"} size={20} />
          {recording ? "Stop Record" : "Record"}
        </Button>

        <Button
          type="button"
          $variant="ghost"
          $size="md"
          disabled={exportDisabled}
          onClick={onExport}
          aria-label="Export session data"
          title={exportDisabled ? "No session data to export" : "Download session JSON"}
        >
          <Icon name="download" size={20} />
          Export
        </Button>
      </Bar>
    </Toolbar>
  );
}
