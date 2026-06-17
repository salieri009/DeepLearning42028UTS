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
