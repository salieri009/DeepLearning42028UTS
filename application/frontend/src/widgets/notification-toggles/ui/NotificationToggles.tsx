import styled from "styled-components";
import { GlassPanel, Icon, Toggle } from "@/shared/ui";

type NotificationTogglesProps = {
  visualOverlays: boolean;
  audibleAlerts: boolean;
  logErrors: boolean;
  webrtcAccess: boolean;
  onVisualOverlaysChange: (v: boolean) => void;
  onAudibleAlertsChange: (v: boolean) => void;
  onLogErrorsChange: (v: boolean) => void;
  onWebrtcAccessChange: (v: boolean) => void;
};

const Panel = styled(GlassPanel)`
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadow.glow};
`;

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing[6]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.size[4]};
  color: ${({ theme }) => theme.color.primary};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    column-gap: ${({ theme }) => theme.spacing[6]};
  }
`;

export function NotificationToggles({
  visualOverlays,
  audibleAlerts,
  logErrors,
  webrtcAccess,
  onVisualOverlaysChange,
  onAudibleAlertsChange,
  onLogErrorsChange,
  onWebrtcAccessChange,
}: NotificationTogglesProps) {
  return (
    <Panel>
      <Title>
        <Icon name="campaign" size={22} />
        System Notifications
      </Title>
      <Grid>
        <Toggle label="Visual UI Overlays" checked={visualOverlays} onChange={onVisualOverlaysChange} />
        <Toggle label="Audible Risk Alerts" checked={audibleAlerts} onChange={onAudibleAlertsChange} />
        <Toggle label="Log Background Task Errors" checked={logErrors} onChange={onLogErrorsChange} />
        <Toggle label="WebRTC Remote Access" checked={webrtcAccess} onChange={onWebrtcAccessChange} />
      </Grid>
    </Panel>
  );
}
