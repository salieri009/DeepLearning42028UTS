import { useCallback, useEffect, useMemo, useState } from "react";
import { getSession, listSessions } from "@/shared/api";
import type {
  ProximityRisk,
  SessionDetailResponse,
  SourceType,
} from "@/entities/session";
import { reportError } from "@/shared/lib/reportError";

export type DateRangeFilter = "24h" | "7d" | "30d" | "custom";
export type RiskFilter = ProximityRisk | "ALL";
export type SourceFilter = SourceType | "ALL";

const PAGE_SIZE = 20;

function withinDateRange(startedAt: string, range: DateRangeFilter): boolean {
  if (range === "custom") return true;
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const hours = range === "24h" ? 24 : range === "7d" ? 24 * 7 : 24 * 30;
  return start >= now - hours * 60 * 60 * 1000;
}

export function useArchiveSessions() {
  const [sessions, setSessions] = useState<SessionDetailResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [dateRange, setDateRange] = useState<DateRangeFilter>("24h");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");

  const loadSessions = useCallback((pageOffset: number) => {
    setLoading(true);
    setError(null);

    listSessions(PAGE_SIZE, pageOffset)
      .then((data) =>
        Promise.all(data.items.map((item) => getSession(item.id).catch(() => null))).then(
          (details) => ({ data, details }),
        ),
      )
      .then(({ data, details }) => {
        const enriched = details.filter((d): d is SessionDetailResponse => d !== null);
        setSessions(enriched);
        setTotal(data.total);
        setSelectedId((prev) => prev ?? enriched[0]?.id ?? null);
      })
      .catch((err) => {
        reportError(err);
        setError("Failed to load sessions.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadSessions(offset), 0);
    return () => window.clearTimeout(timer);
  }, [offset, loadSessions]);

  const selectedDetail = useMemo(
    () => sessions.find((s) => s.id === selectedId) ?? null,
    [sessions, selectedId],
  );

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (!withinDateRange(s.started_at, dateRange)) return false;
      if (sourceFilter !== "ALL" && s.source_type !== sourceFilter) return false;
      if (riskFilter !== "ALL" && s.worst_risk !== riskFilter) return false;
      return true;
    });
  }, [sessions, dateRange, sourceFilter, riskFilter]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const clearFilters = () => {
    setDateRange("24h");
    setRiskFilter("ALL");
    setSourceFilter("ALL");
  };

  const goNext = () => {
    if (offset + PAGE_SIZE < total) setOffset((o) => o + PAGE_SIZE);
  };

  const goPrev = () => {
    if (offset > 0) setOffset((o) => Math.max(0, o - PAGE_SIZE));
  };

  return {
    sessions: filteredSessions,
    total,
    loading,
    error,
    selectedId,
    selectedDetail,
    detailLoading: false,
    dateRange,
    riskFilter,
    sourceFilter,
    setDateRange,
    setRiskFilter,
    setSourceFilter,
    setSelectedId,
    clearFilters,
    currentPage,
    pageCount,
    goNext,
    goPrev,
    refetch: () => loadSessions(offset),
  };
}
