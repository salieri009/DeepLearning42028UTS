export type ZoneRisk = {
  name: string;
  level: "HIGH RISK" | "MODERATE" | "LOW RISK";
  percent: number;
};

export type PeakHour = {
  label: string;
  heightPercent: number;
  peak?: boolean;
};

export type HotspotMarker = {
  id: string;
  label: string;
  capacity: string;
  risk: "DANGER" | "WARNING";
  top: string;
  left: string;
};

export type AnalyticsData = {
  safetyScore: number;
  safetyLabel: string;
  trendPercent: number;
  eventCount: number;
  busiestWindow: string;
  peakHours: PeakHour[];
  zoneRisks: ZoneRisk[];
  hotspots: HotspotMarker[];
};

export const ANALYTICS_DATA: AnalyticsData = {
  safetyScore: 82,
  safetyLabel: "Nominal",
  trendPercent: 4.2,
  eventCount: 12,
  busiestWindow: "14:00 - 16:00",
  peakHours: [
    { label: "08:00", heightPercent: 25 },
    { label: "10:00", heightPercent: 50 },
    { label: "12:00", heightPercent: 60 },
    { label: "14:00", heightPercent: 100, peak: true },
    { label: "16:00", heightPercent: 80, peak: true },
    { label: "18:00", heightPercent: 40 },
    { label: "20:00", heightPercent: 20 },
  ],
  zoneRisks: [
    { name: "Shipping/Dock", level: "HIGH RISK", percent: 85 },
    { name: "Main Aisle", level: "MODERATE", percent: 45 },
    { name: "Storage Bay 3", level: "LOW RISK", percent: 12 },
  ],
  hotspots: [
    {
      id: "a4",
      label: "Zone A-4 Congestion",
      capacity: "88% CAPACITY",
      risk: "DANGER",
      top: "25%",
      left: "33%",
    },
  ],
};

export function useAnalyticsData() {
  return ANALYTICS_DATA;
}
