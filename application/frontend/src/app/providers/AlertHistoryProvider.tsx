import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { AlertEntry } from "@/features/alert-history";

const MAX_ALERTS = 10;

type AlertHistoryContextValue = {
  alerts: AlertEntry[];
  pushFromRisk: (risk: string, recommendation?: string) => void;
  reset: () => void;
  formatAlertMeta: (entry: AlertEntry) => string;
};

const AlertHistoryContext = createContext<AlertHistoryContextValue | null>(null);

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour12: false });
}

function riskPercent(risk: string): string {
  if (risk === "DANGER") return "88";
  if (risk === "WARNING") return "45";
  return "0";
}

export function AlertHistoryProvider({ children }: { children: ReactNode }) {
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

  return (
    <AlertHistoryContext.Provider value={{ alerts, pushFromRisk, reset, formatAlertMeta }}>
      {children}
    </AlertHistoryContext.Provider>
  );
}

export function useAlertHistoryContext(): AlertHistoryContextValue {
  const ctx = useContext(AlertHistoryContext);
  if (!ctx) {
    throw new Error("useAlertHistoryContext must be used within AlertHistoryProvider");
  }
  return ctx;
}

export function useOptionalAlertHistory(): AlertHistoryContextValue {
  const ctx = useContext(AlertHistoryContext);
  return (
    ctx ?? {
      alerts: [],
      pushFromRisk: () => undefined,
      reset: () => undefined,
      formatAlertMeta: (entry) => formatTime(entry.timestamp),
    }
  );
}
