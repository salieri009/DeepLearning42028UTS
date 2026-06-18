import type { ProximityRisk } from "@/entities/detection";

export function formatDensityLabel(density: string | undefined): string {
  return density ?? "—";
}

export function formatRiskLabel(risk: string | undefined): ProximityRisk | string {
  return risk ?? "—";
}

export function formatRecommendation(recommendation: string | undefined): string {
  return recommendation ?? "—";
}

export function getRiskBadgeVariant(
  risk: string | undefined,
): "safe" | "warning" | "danger" | "neutral" {
  if (risk === "DANGER") return "danger";
  if (risk === "WARNING") return "warning";
  if (risk === "SAFE") return "safe";
  return "neutral";
}

export function getDensityBadgeVariant(
  density: string | undefined,
): "safe" | "warning" | "danger" | "neutral" {
  const d = (density ?? "").toUpperCase();
  if (d === "HIGH" || d === "CRITICAL") return "danger";
  if (d === "MEDIUM") return "warning";
  if (d === "LOW") return "safe";
  return "neutral";
}

/** NFR-1 target: inference latency under 500ms per frame. */
const LATENCY_OPTIMAL_MS = 500;
const LATENCY_SLOW_MS = 800;

export function formatLatencyBadge(latencyMs: number | null): {
  label: string;
  variant: "safe" | "warning" | "danger";
} | null {
  if (latencyMs === null) {
    return null;
  }
  if (latencyMs <= LATENCY_OPTIMAL_MS) {
    return { label: "OPTIMAL", variant: "safe" };
  }
  if (latencyMs <= LATENCY_SLOW_MS) {
    return { label: "SLOW", variant: "warning" };
  }
  return { label: "HIGH", variant: "danger" };
}
