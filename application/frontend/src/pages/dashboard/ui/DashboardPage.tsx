import { useCallback, useMemo, useState } from "react";
import type { AnalyzeFrameResponse } from "@/entities/detection";
import { useAlertHistoryContext } from "@/app/providers/AlertHistoryProvider";
import { useCrowdDetection } from "@/features/crowd-detection";
import { exportLiveSession } from "@/features/session-export";
import { buildHtmlReport, downloadHtmlReport } from "@/features/report-generation";
import { useSessionRecording } from "@/features/session-recording";
import { useRiskAlerts } from "@/features/risk-alerts";
import { ControlBar } from "@/widgets/control-bar";
import { DashboardShell } from "@/widgets/dashboard-shell";
import { BottomNav } from "@/widgets/bottom-nav";
import { MobileStatsBar } from "@/widgets/stats-sidebar/ui/MobileStatsBar";
import { StatsSidebar } from "@/widgets/stats-sidebar";
import { TopNav } from "@/widgets/top-nav";
import { VideoStage } from "@/widgets/video-stage";
import { LiveRegion } from "@/shared/ui";

export function DashboardPage() {
  const { triggerAlert, reset: resetAlerts, cancel: cancelSpeech } = useRiskAlerts();
  const { alerts, pushFromRisk, reset: resetHistory, formatAlertMeta } = useAlertHistoryContext();
  const { recording, toggleRecording, stopRecording } = useSessionRecording();
  const [exporting, setExporting] = useState(false);

  const handleAnalyzed = useCallback(
    (response: AnalyzeFrameResponse) => {
      const risk = response.max_proximity_risk ?? "SAFE";
      triggerAlert(risk);
      pushFromRisk(risk, response.recommendation);
    },
    [triggerAlert, pushFromRisk],
  );

  const {
    running,
    data,
    latencyMs,
    sessionId,
    lastSessionId,
    videoRef,
    getStream,
    start,
    stop,
  } = useCrowdDetection({
    onAnalyzed: handleAnalyzed,
  });

  const exportSessionId = sessionId ?? lastSessionId;

  const handleStart = async () => {
    resetAlerts();
    resetHistory();
    await start();
  };

  const handleStop = () => {
    if (recording) stopRecording(true);
    stop();
    cancelSpeech();
    resetAlerts();
    resetHistory();
  };

  const handleRecord = () => {
    toggleRecording(getStream());
  };

  const handleExport = () => {
    if (exportSessionId == null || exporting) return;
    setExporting(true);
    void exportLiveSession(exportSessionId).finally(() => setExporting(false));
  };

  const handleGenerateReport = () => {
    const html = buildHtmlReport({
      kind: "live",
      generatedAt: new Date().toISOString(),
      sessionId: exportSessionId,
      data,
      latencyMs,
      alerts,
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadHtmlReport(html, `crowdnav-live-report-${stamp}.html`);
  };

  const liveMessage = useMemo(() => {
    if (!running || !data) return "";
    const count = data.persons?.length ?? 0;
    const recommendation = data.recommendation ?? "SAFE";
    const parts = [`${count} people detected. Recommendation: ${recommendation}.`];
    if (alerts[0]) {
      parts.push(`Latest alert: ${alerts[0].message}.`);
    }
    return parts.join(" ");
  }, [running, data, alerts]);

  const alertPoliteness =
    data?.recommendation?.toUpperCase() === "STOP" ? "assertive" : "polite";

  return (
    <DashboardShell
      topNav={<TopNav running={running} />}
      videoStage={<VideoStage running={running} data={data} videoRef={videoRef} />}
      mobileStatsBar={<MobileStatsBar data={data} />}
      statsSidebar={
        <StatsSidebar
          data={data}
          latencyMs={latencyMs}
          alerts={alerts}
          formatAlertMeta={formatAlertMeta}
          onGenerateReport={handleGenerateReport}
          reportDisabled={!data}
        />
      }
      controlBar={
        <ControlBar
          running={running}
          recording={recording}
          exportDisabled={exportSessionId == null || exporting}
          onStart={handleStart}
          onStop={handleStop}
          onRecord={handleRecord}
          onExport={handleExport}
        />
      }
      liveRegion={
        <LiveRegion message={liveMessage} politeness={alertPoliteness as "polite" | "assertive"} />
      }
      bottomNav={<BottomNav />}
    />
  );
}
