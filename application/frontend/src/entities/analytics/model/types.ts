export type RiskLevel = "SAFE" | "WARNING" | "DANGER";

export type ZoneRisk = {
  name: string;
  level: "HIGH RISK" | "MODERATE" | "LOW RISK";
  percent: number;
  synthetic?: boolean;
};

export type PeakHour = {
  label: string;
  heightPercent: number;
  peak?: boolean;
};

export type HotspotMarker = {
  id: string;
  label: string;
  metricLabel: string;
  risk: "DANGER" | "WARNING";
  top: string;
  left: string;
  synthetic?: boolean;
};
