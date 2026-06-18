import { useEffect, useState } from "react";
import { getAnalyticsSummary, type AnalyticsData } from "@/shared/api";
import { reportError } from "@/shared/lib/reportError";

const EMPTY_ANALYTICS: AnalyticsData = {
  safetyScore: 0,
  safetyLabel: "No data",
  trendPercent: 0,
  eventCount: 0,
  busiestWindow: "—",
  peakHours: [],
  zoneRisks: [],
  hotspots: [],
  frameCount: 0,
  sessionCount: 0,
};

export function useAnalyticsData(days = 7) {
  const [data, setData] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;

      setLoading(true);
      setError(null);

      try {
        const summary = await getAnalyticsSummary(days, controller.signal);
        if (!controller.signal.aborted) {
          setData(summary);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        reportError("Load analytics summary error", err);
        setData(EMPTY_ANALYTICS);
        setError("Failed to load analytics summary.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [days]);

  return { data, loading, error };
}
