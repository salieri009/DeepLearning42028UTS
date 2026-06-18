import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SessionDetailResponse } from "@/entities/session";
import { useGeolocation } from "@/features/geolocation";
import {
  sessionToDetailFallback,
  withinDateRange,
} from "@/features/session-archive/lib/sessionArchiveUtils";
import { getSession, listSessions } from "@/shared/api";
import { reportError } from "@/shared/lib/reportError";
import {
  aggregateSessionMetrics,
  buildUserMarker,
  buildZoneMarkers,
  isNearCampus,
  pickActiveSession,
  UTS_SYDNEY_CENTER,
} from "../lib/mapMarkerUtils";
import type { MapMarker } from "./types";

export type { MapMarker } from "./types";
export { UTS_SYDNEY_CENTER, ZONE_ANCHORS } from "../lib/mapMarkerUtils";

const SESSION_POLL_MS = 10_000;
const SESSION_FETCH_LIMIT = 30;

export function useMapMarkers() {
  const { position, status: gpsStatus, error: gpsError } = useGeolocation();
  const [sessionDetails, setSessionDetails] = useState<SessionDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [telemetrySynced, setTelemetrySynced] = useState(false);
  const refreshInFlightRef = useRef(false);

  const refreshSessions = useCallback(async (signal?: AbortSignal) => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;

    try {
      const list = await listSessions(SESSION_FETCH_LIMIT, 0, signal);
      const recent = list.items.filter((session) => withinDateRange(session.started_at, "24h"));
      const details = await Promise.all(
        recent.map(async (session) => {
          try {
            return await getSession(session.id, signal);
          } catch {
            return sessionToDetailFallback(session);
          }
        }),
      );
      if (!signal?.aborted) {
        setSessionDetails(details);
        setError(null);
        setTelemetrySynced(true);
      }
    } catch (err) {
      if (signal?.aborted) return;
      reportError("Live map session refresh failed", err);
      setError("Failed to load session telemetry.");
      setTelemetrySynced(false);
    } finally {
      refreshInFlightRef.current = false;
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      await refreshSessions(controller.signal);
    };

    void run();
    const intervalId = window.setInterval(() => void run(), SESSION_POLL_MS);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [refreshSessions]);

  const metrics = useMemo(() => aggregateSessionMetrics(sessionDetails), [sessionDetails]);

  const nearCampus = useMemo(() => {
    if (!position) return null;
    return isNearCampus(position.lat, position.lng);
  }, [position]);

  const markers = useMemo<MapMarker[]>(() => {
    const zoneMarkers = buildZoneMarkers(metrics);

    if (!position) {
      return zoneMarkers;
    }

    const activeSession = pickActiveSession(sessionDetails);
    const userRisk = activeSession?.worst_risk ?? metrics.worstRisk;
    const userLabel = activeSession
      ? `You · live session #${activeSession.id}`
      : "Your location";

    return [
      ...zoneMarkers,
      buildUserMarker(position.lat, position.lng, userRisk, userLabel),
    ];
  }, [metrics, position, sessionDetails]);

  const center: [number, number] = position
    ? [position.lat, position.lng]
    : UTS_SYDNEY_CENTER;

  const isLive =
    metrics.activeCount > 0 ||
    (telemetrySynced && !loading && !error && metrics.sessionCount > 0);

  return {
    center,
    zoom: position ? 17 : 16,
    markers,
    loading,
    error,
    gpsStatus,
    gpsError,
    metrics,
    telemetrySynced,
    nearCampus,
    isLive,
  };
}
