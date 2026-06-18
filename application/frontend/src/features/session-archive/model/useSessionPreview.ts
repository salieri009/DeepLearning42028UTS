import { useEffect, useMemo, useState } from "react";
import type { DetectionItem, FrameItem } from "@/entities/session";
import { listDetections, listSessionFrames } from "@/shared/api";
import { reportError } from "@/shared/lib/reportError";
import {
  computeMaxCrowdDensity,
  computeThreatDistribution,
  countAnomalies,
  type ThreatDistribution,
} from "../lib/sessionArchiveUtils";

export type SessionPreviewStats = {
  threat: ThreatDistribution;
  maxCrowdDensity: number;
  anomalies: number;
};

const EMPTY_STATS: SessionPreviewStats = {
  threat: { safe: 100, warn: 0, danger: 0 },
  maxCrowdDensity: 0,
  anomalies: 0,
};

export function useSessionPreview(sessionId: number | null) {
  const [detections, setDetections] = useState<DetectionItem[]>([]);
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId == null) return;

    const controller = new AbortController();

    void (async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;

      setFetchLoading(true);
      setError(null);

      try {
        const [detectionData, frameData] = await Promise.all([
          listDetections(sessionId, { limit: 500 }, controller.signal),
          listSessionFrames(sessionId, 100, controller.signal),
        ]);
        if (!controller.signal.aborted) {
          setDetections(detectionData.items);
          setFrames(frameData.items);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        reportError(err);
        setDetections([]);
        setFrames([]);
        setError("Failed to load session trail.");
      } finally {
        if (!controller.signal.aborted) {
          setFetchLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [sessionId]);

  const visibleDetections = useMemo(
    () => (sessionId == null ? [] : detections),
    [sessionId, detections],
  );
  const visibleFrames = useMemo(
    () => (sessionId == null ? [] : frames),
    [sessionId, frames],
  );
  const loading = sessionId != null && fetchLoading;

  const stats = useMemo<SessionPreviewStats>(() => {
    if (visibleDetections.length === 0) return EMPTY_STATS;
    return {
      threat: computeThreatDistribution(visibleDetections),
      maxCrowdDensity: computeMaxCrowdDensity(visibleDetections),
      anomalies: countAnomalies(visibleDetections),
    };
  }, [visibleDetections]);

  return {
    loading,
    error: sessionId == null ? null : error,
    stats,
    detections: visibleDetections,
    frames: visibleFrames,
  };
}
