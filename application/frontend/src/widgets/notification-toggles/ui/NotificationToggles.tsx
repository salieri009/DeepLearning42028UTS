import styled from "styled-components";
import { GlassPanel, Icon, Toggle } from "@/shared/ui";

type NotificationTogglesProps = {
  visualOverlays: boolean;
  logErrors: boolean;
  webrtcAccess: boolean;
  onVisualOverlaysChange: (v: boolean) => void;
  onLogErrorsChange: (v: boolean) => void;
  onWebrtcAccessChange: (v: boolean) => void;
};

const Panel = styled(GlassPanel)`
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadow.glow};
`;

const Title = styled.h2`
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

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const Hint = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.textSecondary};
  line-height: 1.4;
`;

export function NotificationToggles({
  visualOverlays,
  logErrors,
  onVisualOverlaysChange,
  onLogErrorsChange,
}: NotificationTogglesProps) {
  return (
    <Panel>
      <Title>
        <Icon name="campaign" size={22} />
        System Notifications
      </Title>
      <Grid>
        <Field>
          <Toggle label="Visual UI Overlays" checked={visualOverlays} onChange={onVisualOverlaysChange} />
          <Hint>When off, dashboard hides bbox overlays and alert chips during monitoring.</Hint>
        </Field>
        <Toggle label="Log Background Task Errors" checked={logErrors} onChange={onLogErrorsChange} />
        <Field>
          <Toggle
            label="WebRTC Remote Access"
            checked={false}
            onChange={() => undefined}
            disabled
          />
          <Hint>Not available in v2.6 — stored preference is ignored at runtime (PRD §9).</Hint>
        </Field>
      </Grid>
    </Panel>
  );
}
