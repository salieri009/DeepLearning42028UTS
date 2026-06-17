import type { HotspotMarker, PeakHour, ZoneRisk } from "@/entities/analytics";

export type AnalyticsMockData = {
  safetyScore: number;
  safetyLabel: string;
  trendPercent: number;
  eventCount: number;
  busiestWindow: string;
  peakHours: PeakHour[];
  zoneRisks: ZoneRisk[];
  hotspots: HotspotMarker[];
};

const MOCK: AnalyticsMockData = {
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

export function useAnalyticsMock() {
  return MOCK;
}
