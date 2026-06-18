import type {
  DetectionItem,
  FrameItem,
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
export const DETECTION_PREVIEW_LIMIT = 500;
export const FRAME_PREVIEW_LIMIT = 100;

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

export function dateRangeToDays(dateRange: DateRangeFilter): number | undefined {
  switch (dateRange) {
    case "24h":
      return 1;
    case "7d":
      return 7;
    case "30d":
      return 30;
    default:
      return undefined;
  }
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

/** Frame-level stats from persisted backend aggregates (preferred over detection recompute). */
export function computeThreatDistributionFromFrames(frames: FrameItem[]): ThreatDistribution {
  if (frames.length === 0) {
    return { safe: 100, warn: 0, danger: 0 };
  }

  const counts: Record<ProximityRisk, number> = {
    SAFE: 0,
    WARNING: 0,
    DANGER: 0,
  };

  for (const frame of frames) {
    counts[frame.max_proximity_risk] += 1;
  }

  const total = frames.length;
  return {
    safe: Math.round((counts.SAFE / total) * 100),
    warn: Math.round((counts.WARNING / total) * 100),
    danger: Math.round((counts.DANGER / total) * 100),
  };
}

export function computeMaxPersonCountFromFrames(frames: FrameItem[]): number {
  return frames.reduce((max, frame) => Math.max(max, frame.person_count), 0);
}

export function countDangerFrames(frames: FrameItem[]): number {
  return frames.filter((frame) => frame.max_proximity_risk === "DANGER").length;
}

export type PreviewStats = {
  threat: ThreatDistribution;
  maxCrowdDensity: number;
  anomalies: number;
  statsPartial: boolean;
  sessionWorstRisk: ProximityRisk | null;
};

export function buildPreviewStats(
  frames: FrameItem[],
  session: Pick<SessionDetailResponse, "frame_count" | "worst_risk"> | null | undefined,
): PreviewStats {
  const empty: PreviewStats = {
    threat: { safe: 100, warn: 0, danger: 0 },
    maxCrowdDensity: 0,
    anomalies: 0,
    statsPartial: false,
    sessionWorstRisk: session?.worst_risk ?? null,
  };

  if (frames.length === 0) {
    return empty;
  }

  const statsPartial =
    session != null && session.frame_count > 0 && frames.length < session.frame_count;

  return {
    threat: computeThreatDistributionFromFrames(frames),
    maxCrowdDensity: computeMaxPersonCountFromFrames(frames),
    anomalies: countDangerFrames(frames),
    statsPartial,
    sessionWorstRisk: session?.worst_risk ?? null,
  };
}

export function confirmTruncatedExport(
  session: Pick<SessionDetailResponse, "frame_count">,
  detectionCount: number,
  loadedFrameCount: number,
): boolean {
  const truncated = detectPreviewTruncation(detectionCount, loadedFrameCount, session.frame_count);
  if (!truncated.detections && !truncated.frames) {
    return true;
  }

  const parts: string[] = [];
  if (truncated.frames) {
    parts.push(`frames capped at ${loadedFrameCount} of ${session.frame_count}`);
  }
  if (truncated.detections) {
    parts.push(`detections capped at ${DETECTION_PREVIEW_LIMIT}`);
  }

  return window.confirm(
    `Export is partial (${parts.join("; ")}). Continue with truncated JSON?`,
  );
}

export type PreviewTruncation = {
  detections: boolean;
  frames: boolean;
};

export function detectPreviewTruncation(
  detectionCount: number,
  loadedFrameCount: number,
  sessionFrameCount?: number | null,
): PreviewTruncation {
  const framesTruncated =
    sessionFrameCount != null && sessionFrameCount > 0
      ? loadedFrameCount < sessionFrameCount
      : loadedFrameCount >= FRAME_PREVIEW_LIMIT;

  return {
    detections: detectionCount >= DETECTION_PREVIEW_LIMIT,
    frames: framesTruncated,
  };
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
