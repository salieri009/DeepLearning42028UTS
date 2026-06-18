import type { AlertEntry } from "../model/useAlertHistory";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour12: false });
}

/** Show risk level in alert meta — not a fabricated percentage. */
export function formatAlertMetaLine(entry: AlertEntry): string {
  return `${formatTime(entry.timestamp)} • ${entry.risk}`;
}
