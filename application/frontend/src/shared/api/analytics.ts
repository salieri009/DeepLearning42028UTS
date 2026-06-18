import { apiClient } from "./client";
import type { HotspotMarker, PeakHour, ZoneRisk } from "@/entities/analytics";

export type AnalyticsSummaryResponse = {
  safety_score: number;
  safety_label: string;
  trend_percent: number;
  event_count: number;
  busiest_window: string;
  peak_hours: Array<{
    label: string;
    height_percent: number;
    peak: boolean;
  }>;
  zone_risks: Array<{
    name: string;
    level: ZoneRisk["level"];
    percent: number;
    synthetic?: boolean;
  }>;
  hotspots: Array<{
    id: string;
    label: string;
    metric_label: string;
    risk: HotspotMarker["risk"];
    lat: number;
    lng: number;
    synthetic?: boolean;
  }>;
  frame_count: number;
  session_count: number;
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
  frameCount: number;
  sessionCount: number;
};

export function mapAnalyticsSummary(response: AnalyticsSummaryResponse): AnalyticsData {
  return {
    safetyScore: response.safety_score,
    safetyLabel: response.safety_label,
    trendPercent: response.trend_percent,
    eventCount: response.event_count,
    busiestWindow: response.busiest_window,
    peakHours: response.peak_hours.map((hour) => ({
      label: hour.label,
      heightPercent: hour.height_percent,
      peak: hour.peak,
    })),
    zoneRisks: response.zone_risks.map((zone) => ({
      name: zone.name,
      level: zone.level,
      percent: zone.percent,
      synthetic: zone.synthetic,
    })),
    hotspots: response.hotspots.map((hotspot) => ({
      id: hotspot.id,
      label: hotspot.label,
      metricLabel: hotspot.metric_label,
      risk: hotspot.risk,
      lat: hotspot.lat,
      lng: hotspot.lng,
      synthetic: hotspot.synthetic,
    })),
    frameCount: response.frame_count,
    sessionCount: response.session_count,
  };
}

export async function getAnalyticsSummary(
  days = 7,
  signal?: AbortSignal,
): Promise<AnalyticsData> {
  const { data } = await apiClient.get<AnalyticsSummaryResponse>("/v1/analytics/summary", {
    params: { days },
    signal,
  });
  return mapAnalyticsSummary(data);
}
