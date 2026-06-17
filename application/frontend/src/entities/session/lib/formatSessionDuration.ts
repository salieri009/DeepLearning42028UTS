import type { ProximityRisk } from "../model/types";

export function formatSessionDuration(
  startedAt: string,
  endedAt: string | null,
): string {
  if (!endedAt) return "ACTIVE";

  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const diffSec = Math.max(0, Math.floor((end - start) / 1000));

  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

export function formatSessionStart(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function riskToLabel(risk: ProximityRisk | null | undefined): string {
  switch (risk) {
    case "DANGER":
      return "CRITICAL";
    case "WARNING":
      return "CAUTION";
    case "SAFE":
      return "NOMINAL";
    default:
      return "UNKNOWN";
  }
}

export function riskToVariant(risk: ProximityRisk | null | undefined): ProximityRisk {
  return risk ?? "SAFE";
}
