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
import { Caption, GlassPanel, PageChromeTitle, SectionTitle } from "@/shared/ui";

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const SectionHeading = styled(SectionTitle)`
  margin: 0;
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[6]};
  align-items: start;

  @media (min-width: ${({ theme }) => theme.layout.tabletBreakpoint}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const DensityLegend = styled(GlassPanel)`
  padding: ${({ theme }) => theme.spacing[4]};
  box-shadow: ${({ theme }) => theme.shadow.sm};
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
        <PageChromeTitle as="h1">Sensor Settings</PageChromeTitle>

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

        <Section aria-labelledby="settings-sources-heading">
          <SectionHeading id="settings-sources-heading">Input Sources</SectionHeading>
          <SensorSourcesGrid
            sources={settings.sources}
            onAddSource={settings.addSource}
            onUpdateSource={settings.updateSource}
          />
        </Section>

        <Section aria-labelledby="settings-tuning-heading">
          <SectionHeading id="settings-tuning-heading">Detection Tuning</SectionHeading>
          <TwoCol>
            <DetectionModelPanel
              model={settings.draft.model}
              dirty={settings.dirtyModel}
              onChange={settings.setModel}
            />
            <AlertThresholdsPanel
              confidence={settings.draft.confidence}
              densityLimit={settings.draft.densityLimit}
              dirty={settings.dirtyThresholds}
              onConfidenceChange={settings.setConfidence}
              onDensityLimitChange={settings.setDensityLimit}
            />
          </TwoCol>
          <DensityLegend>
            <Caption $tone="secondary">
              Crowd density bands: ≤2 LOW · ≤5 MEDIUM · 6+ HIGH. Proximity risk can elevate
              severity on the dashboard.
            </Caption>
          </DensityLegend>
        </Section>

        <Section aria-labelledby="settings-notifications-heading">
          <SectionHeading id="settings-notifications-heading">Notifications</SectionHeading>
          <SystemNotificationsPanel
            visualOverlays={settings.draft.visualOverlays}
            logErrors={settings.draft.logErrors}
            webrtcAccess={settings.draft.webrtcAccess}
            dirty={settings.dirtyNotifications}
            onVisualOverlaysChange={settings.setVisualOverlays}
            onLogErrorsChange={settings.setLogErrors}
            onWebrtcAccessChange={settings.setWebrtcAccess}
          />
        </Section>

        <SettingsActions
          dirty={settings.dirty}
          onSave={settings.save}
          onDiscard={settings.discard}
        />
      </Content>
    </AppShell>
  );
}
