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

export function SettingsPage() {
  const settings = useSensorSettings();

  return (
    <AppShell
      topNav={<TopNav />}
      sideNav={<SideNav activeItem="sensors" />}
      bottomNav={<BottomNav />}
    >
      <Content>
        <SensorSourcesGrid sources={settings.sources} />

        <TwoCol>
          <DetectionModelPanel model={settings.draft.model} onChange={settings.setModel} />
          <AlertThresholdsPanel
            confidence={settings.draft.confidence}
            densityLimit={settings.draft.densityLimit}
            onConfidenceChange={settings.setConfidence}
            onDensityChange={settings.setDensityLimit}
          />
        </TwoCol>

        <SystemNotificationsPanel
          visualOverlays={settings.draft.visualOverlays}
          audibleAlerts={settings.draft.audibleAlerts}
          logErrors={settings.draft.logErrors}
          webrtcAccess={settings.draft.webrtcAccess}
          onVisualOverlaysChange={settings.setVisualOverlays}
          onAudibleAlertsChange={settings.setAudibleAlerts}
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
