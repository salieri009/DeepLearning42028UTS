import { useCallback, useRef, useState } from "react";
import { formatAlertMetaLine } from "../lib/formatAlertMeta";

export type AlertEntry = {
  id: string;
  message: string;
  risk: string;
  timestamp: Date;
};

const MAX_ALERTS = 10;

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

  const formatAlertMeta = useCallback((entry: AlertEntry) => formatAlertMetaLine(entry), []);

  return { alerts, pushFromRisk, reset, formatAlertMeta };
}
