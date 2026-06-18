import { useEffect, useMemo, useState } from "react";
import type { FrameItem, SessionDetailResponse } from "@/entities/session";
import { listSessionFrames } from "@/shared/api";
import { reportError } from "@/shared/lib/reportError";
import {
  buildPreviewStats,
  detectPreviewTruncation,
  FRAME_PREVIEW_LIMIT,
  type PreviewStats,
  type PreviewTruncation,
} from "../lib/sessionArchiveUtils";

export type SessionPreviewStats = PreviewStats;

export function useSessionPreview(
  sessionId: number | null,
  sessionDetail?: Pick<SessionDetailResponse, "frame_count" | "worst_risk"> | null,
) {
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
        const frameData = await listSessionFrames(sessionId, FRAME_PREVIEW_LIMIT, controller.signal);
        if (!controller.signal.aborted) {
          setFrames(frameData.items);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        reportError(err);
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

  const visibleFrames = useMemo(
    () => (sessionId == null ? [] : frames),
    [sessionId, frames],
  );
  const loading = sessionId != null && fetchLoading;

  const stats = useMemo<PreviewStats>(
    () => buildPreviewStats(visibleFrames, sessionDetail),
    [visibleFrames, sessionDetail],
  );

  const truncation = useMemo<PreviewTruncation>(
    () => detectPreviewTruncation(0, visibleFrames.length, sessionDetail?.frame_count),
    [visibleFrames.length, sessionDetail?.frame_count],
  );

  return {
    loading,
    error: sessionId == null ? null : error,
    stats,
    frames: visibleFrames,
    truncation,
  };
}
