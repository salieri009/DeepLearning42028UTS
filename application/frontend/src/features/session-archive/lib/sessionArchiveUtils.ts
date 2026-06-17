import type {
  DetectionItem,
  ProximityRisk,
  SessionDetailResponse,
  SessionResponse,
  SourceType,
} from "@/entities/session";

export type DateRangeFilter = "24h" | "7d" | "30d" | "custom";
export type RiskFilter = ProximityRisk | "ALL";
export type SourceFilter = SourceType | "ALL";

export const PAGE_SIZE = 20;
export const FETCH_BATCH_SIZE = 50;
export const ENRICH_CONCURRENCY = 5;

export function withinDateRange(startedAt: string, range: DateRangeFilter): boolean {
  if (range === "custom") return true;
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return false;
  const now = Date.now();
  const hours = range === "24h" ? 24 : range === "7d" ? 24 * 7 : 24 * 30;
  return start >= now - hours * 60 * 60 * 1000;
}

export function filterSessions(
  sessions: SessionDetailResponse[],
  dateRange: DateRangeFilter,
  riskFilter: RiskFilter,
  sourceFilter: SourceFilter,
): SessionDetailResponse[] {
  return sessions.filter((session) => {
    if (!withinDateRange(session.started_at, dateRange)) return false;
    if (sourceFilter !== "ALL" && session.source_type !== sourceFilter) return false;
    if (riskFilter !== "ALL" && session.worst_risk !== riskFilter) return false;
    return true;
  });
}

export function isDefaultFilters(
  dateRange: DateRangeFilter,
  riskFilter: RiskFilter,
  sourceFilter: SourceFilter,
): boolean {
  return dateRange === "30d" && riskFilter === "ALL" && sourceFilter === "ALL";
}

export function sessionToDetailFallback(session: SessionResponse): SessionDetailResponse {
  return {
    ...session,
    frame_count: 0,
    avg_latency_ms: null,
    worst_risk: null,
  };
}

export type ThreatDistribution = {
  safe: number;
  warn: number;
  danger: number;
};

export function computeThreatDistribution(detections: DetectionItem[]): ThreatDistribution {
  if (detections.length === 0) {
    return { safe: 100, warn: 0, danger: 0 };
  }

  const counts: Record<ProximityRisk, number> = {
    SAFE: 0,
    WARNING: 0,
    DANGER: 0,
  };

  for (const detection of detections) {
    counts[detection.proximity_risk] += 1;
  }

  const total = detections.length;
  return {
    safe: Math.round((counts.SAFE / total) * 100),
    warn: Math.round((counts.WARNING / total) * 100),
    danger: Math.round((counts.DANGER / total) * 100),
  };
}

export function computeMaxCrowdDensity(detections: DetectionItem[]): number {
  const byFrame = new Map<number, number>();
  for (const detection of detections) {
    byFrame.set(detection.frame_id, (byFrame.get(detection.frame_id) ?? 0) + 1);
  }
  return Math.max(0, ...byFrame.values());
}

export function countAnomalies(detections: DetectionItem[]): number {
  return detections.filter((detection) => detection.proximity_risk === "DANGER").length;
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
