import { useCallback } from "react";
import type { AnalyzeFrameResponse } from "@/entities/detection";
import { useAlertHistory } from "@/features/alert-history";
import { useCrowdDetection } from "@/features/crowd-detection";
import { useRiskAlerts } from "@/features/risk-alerts";
import { ControlBar } from "@/widgets/control-bar";
import { DashboardShell } from "@/widgets/dashboard-shell";
import { StatsSidebar } from "@/widgets/stats-sidebar";
import { TopNav } from "@/widgets/top-nav";
import { VideoStage } from "@/widgets/video-stage";

export function DashboardPage() {
  const { triggerAlert, reset: resetAlerts, cancel: cancelSpeech } = useRiskAlerts();
  const { alerts, pushFromRisk, reset: resetHistory, formatAlertMeta } = useAlertHistory();

  const handleAnalyzed = useCallback(
    (response: AnalyzeFrameResponse) => {
      const risk = response.max_proximity_risk ?? "SAFE";
      triggerAlert(risk);
      pushFromRisk(risk, response.recommendation);
    },
    [triggerAlert, pushFromRisk],
  );

  const { running, data, latencyMs, videoRef, start, stop } = useCrowdDetection({
    onAnalyzed: handleAnalyzed,
  });

  const handleStart = async () => {
    resetAlerts();
    resetHistory();
    await start();
  };

  const handleStop = () => {
    stop();
    cancelSpeech();
    resetAlerts();
    resetHistory();
  };

  return (
    <DashboardShell
      topNav={<TopNav running={running} />}
      videoStage={<VideoStage running={running} data={data} videoRef={videoRef} />}
      statsSidebar={
        <StatsSidebar
          data={data}
          latencyMs={latencyMs}
          alerts={alerts}
          formatAlertMeta={formatAlertMeta}
        />
      }
      controlBar={<ControlBar running={running} onStart={handleStart} onStop={handleStop} />}
    />
  );
}
