import { useCallback, useRef, useState } from "react";

export type AlertEntry = {
  id: string;
  message: string;
  risk: string;
  timestamp: Date;
};

const MAX_ALERTS = 10;

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour12: false });
}

function riskPercent(risk: string): string {
  if (risk === "DANGER") return "88";
  if (risk === "WARNING") return "45";
  return "0";
}

export function useAlertHistory() {
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const lastRiskRef = useRef<string>("SAFE");

  const pushFromRisk = useCallback((risk: string, recommendation?: string) => {
    if (risk !== "WARNING" && risk !== "DANGER") {
      lastRiskRef.current = risk;
      return;
    }

    if (lastRiskRef.current === risk) return;

    const message =
      risk === "DANGER"
        ? `Critical proximity: ${recommendation ?? "STOP"}`
        : `Crowd alert: ${recommendation ?? "CAUTION"}`;

    const entry: AlertEntry = {
      id: `${Date.now()}-${risk}`,
      message,
      risk,
      timestamp: new Date(),
    };

    setAlerts((prev) => [entry, ...prev].slice(0, MAX_ALERTS));
    lastRiskRef.current = risk;
  }, []);

  const reset = useCallback(() => {
    setAlerts([]);
    lastRiskRef.current = "SAFE";
  }, []);

  const formatAlertMeta = useCallback((entry: AlertEntry) => {
    return `${formatTime(entry.timestamp)} • Risk ${riskPercent(entry.risk)}%`;
  }, []);

  return { alerts, pushFromRisk, reset, formatAlertMeta };
}
