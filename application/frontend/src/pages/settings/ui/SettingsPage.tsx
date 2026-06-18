import styled from "styled-components";
import { useSensorSettings } from "@/features/sensor-settings";
import { AlertThresholdsPanel } from "@/widgets/alert-thresholds-panel";
import { AppShell } from "@/widgets/app-shell";
import { BottomNav } from "@/widgets/bottom-nav";
import { DetectionModelPanel } from "@/widgets/detection-model-panel";
import { SensorSourcesGrid } from "@/widgets/sensor-sources-grid";
import { SettingsActions } from "@/widgets/settings-actions";
import { SideNav } from "@/widgets/side-nav";
import { SystemNotificationsPanel } from "@/widgets/system-notifications-panel";
import { TopNav } from "@/widgets/top-nav";
import { ChromeText } from "@/shared/ui";

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[6]};

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Notice = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.info[60]};
`;

export function SettingsPage() {
  const settings = useSensorSettings();

  return (
    <AppShell
      topNav={<TopNav />}
      sideNav={<SideNav activeItem="sensors" />}
      bottomNav={<BottomNav />}
    >
      <Content>
        <ChromeText as="h1" style={{ fontSize: "32px", textTransform: "uppercase" }}>
          Sensor Settings
        </ChromeText>

        {settings.loading ? (
          <Notice role="status" aria-live="polite">
            Loading settings...
          </Notice>
        ) : null}
        {settings.error ? (
          <Notice role="status" aria-live="polite">
            {settings.error}
          </Notice>
        ) : null}

        <SensorSourcesGrid
          sources={settings.sources}
          onAddSource={settings.addSource}
          onUpdateSource={settings.updateSource}
        />

        <TwoCol>
          <DetectionModelPanel model={settings.draft.model} onChange={settings.setModel} />
          <AlertThresholdsPanel
            confidence={settings.draft.confidence}
            onConfidenceChange={settings.setConfidence}
          />
        </TwoCol>

        <SystemNotificationsPanel
          visualOverlays={settings.draft.visualOverlays}
          logErrors={settings.draft.logErrors}
          webrtcAccess={settings.draft.webrtcAccess}
          onVisualOverlaysChange={settings.setVisualOverlays}
          onLogErrorsChange={settings.setLogErrors}
          onWebrtcAccessChange={settings.setWebrtcAccess}
        />

        <SettingsActions
          dirty={settings.dirty}
          onSave={settings.save}
          onDiscard={settings.discard}
        />
      </Content>
    </AppShell>
  );
}
