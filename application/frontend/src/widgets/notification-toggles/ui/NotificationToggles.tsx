import { useId } from "react";
import styled from "styled-components";
import { GlassPanel, PanelTitleRow, Toggle, UnsavedBadge } from "@/shared/ui";

type NotificationTogglesProps = {
  visualOverlays: boolean;
  logErrors: boolean;
  webrtcAccess: boolean;
  dirty?: boolean;
  onVisualOverlaysChange: (v: boolean) => void;
  onLogErrorsChange: (v: boolean) => void;
  onWebrtcAccessChange: (v: boolean) => void;
};

const Panel = styled(GlassPanel)`
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadow.glow};
`;

const UnsavedRow = styled(PanelTitleRow)`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  justify-content: flex-end;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (min-width: ${({ theme }) => theme.layout.tabletBreakpoint}) {
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
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

export function NotificationToggles({
  visualOverlays,
  logErrors,
  dirty = false,
  onVisualOverlaysChange,
  onLogErrorsChange,
}: NotificationTogglesProps) {
  const webrtcHintId = useId();

  return (
    <Panel aria-labelledby="settings-notifications-heading">
      {dirty ? (
        <UnsavedRow>
          <UnsavedBadge>Unsaved</UnsavedBadge>
        </UnsavedRow>
      ) : null}
      <Grid>
        <Field>
          <Toggle label="Visual UI Overlays" checked={visualOverlays} onChange={onVisualOverlaysChange} />
          <Hint>When off, dashboard hides bbox overlays and alert chips during monitoring.</Hint>
        </Field>
        <Field>
          <Toggle label="Log Background Task Errors" checked={logErrors} onChange={onLogErrorsChange} />
          <Hint>Writes client errors to the browser console for debugging.</Hint>
        </Field>
        <Field>
          <Toggle
            label="WebRTC Remote Access"
            checked={false}
            onChange={() => undefined}
            disabled
            describedBy={webrtcHintId}
          />
          <Hint id={webrtcHintId}>Not available in v2.6 — stored preference is ignored at runtime.</Hint>
        </Field>
      </Grid>
    </Panel>
  );
}
