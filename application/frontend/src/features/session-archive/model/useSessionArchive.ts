import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listSessions } from "@/shared/api";
import type { SessionDetailResponse } from "@/entities/session";
import { reportError } from "@/shared/lib/reportError";
import {
  dateRangeToDays,
  isDefaultFilters,
  PAGE_SIZE,
  type DateRangeFilter,
  type RiskFilter,
  type SourceFilter,
} from "../lib/sessionArchiveUtils";

export type { DateRangeFilter, RiskFilter, SourceFilter } from "../lib/sessionArchiveUtils";

export function useSessionArchive() {
  const [sessions, setSessions] = useState<SessionDetailResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);

  const [dateRange, setDateRange] = useState<DateRangeFilter>("30d");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");

  const loadVersionRef = useRef(0);

  const runLoad = useCallback(
    async (signal: AbortSignal) => {
      await Promise.resolve();
      if (signal.aborted) return;

      const loadVersion = loadVersionRef.current + 1;
      loadVersionRef.current = loadVersion;

      setLoading(true);
      setError(null);

      try {
        const page = await listSessions({
          limit: PAGE_SIZE,
          offset,
          days: dateRangeToDays(dateRange),
          sourceType: sourceFilter === "ALL" ? undefined : sourceFilter,
          worstRisk: riskFilter === "ALL" ? undefined : riskFilter,
        });

        if (signal.aborted || loadVersionRef.current !== loadVersion) return;

        setSessions(page.items);
        setTotal(page.total);
        setSelectedId((prev) => {
          if (prev != null && page.items.some((session) => session.id === prev)) {
            return prev;
          }
          return page.items[0]?.id ?? null;
        });
      } catch (err) {
        if (signal.aborted || loadVersionRef.current !== loadVersion) return;
        reportError("Load session archive error", err);
        setSessions([]);
        setTotal(0);
        setSelectedId(null);
        setError("Failed to load sessions.");
      } finally {
        if (!signal.aborted && loadVersionRef.current === loadVersion) {
          setLoading(false);
        }
      }
    },
    [dateRange, riskFilter, sourceFilter, offset],
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch when filters/page change
    void runLoad(controller.signal);
    return () => controller.abort();
  }, [runLoad]);

  const filterActive = !isDefaultFilters(dateRange, riskFilter, sourceFilter);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const resolvedSelectedId = useMemo(() => {
    if (selectedId != null && sessions.some((session) => session.id === selectedId)) {
      return selectedId;
    }
    return sessions[0]?.id ?? null;
  }, [sessions, selectedId]);

  const selectedDetail = useMemo(
    () => sessions.find((session) => session.id === resolvedSelectedId) ?? null,
    [sessions, resolvedSelectedId],
  );

  const setDateRangeAndReset = useCallback((value: DateRangeFilter) => {
    setDateRange(value);
    setOffset(0);
  }, []);

  const setRiskFilterAndReset = useCallback((value: RiskFilter) => {
    setRiskFilter(value);
    setOffset(0);
  }, []);

  const setSourceFilterAndReset = useCallback((value: SourceFilter) => {
    setSourceFilter(value);
    setOffset(0);
  }, []);

  const clearFilters = useCallback(() => {
    setDateRange("30d");
    setRiskFilter("ALL");
    setSourceFilter("ALL");
    setOffset(0);
  }, []);

  const goNext = useCallback(() => {
    if (offset + PAGE_SIZE < total) {
      setOffset((value) => value + PAGE_SIZE);
    }
  }, [offset, total]);

  const goPrev = useCallback(() => {
    if (offset > 0) {
      setOffset((value) => Math.max(0, value - PAGE_SIZE));
    }
  }, [offset]);

  const emptyMessage =
    total === 0
      ? filterActive
        ? "No sessions match the current filters."
        : "No sessions found."
      : "No sessions found.";

  const refetch = useCallback(() => {
    const controller = new AbortController();
    void runLoad(controller.signal);
    return () => controller.abort();
  }, [runLoad]);

  return {
    sessions,
    total,
    loading,
    error,
    selectedId: resolvedSelectedId,
    selectedDetail,
    dateRange,
    riskFilter,
    sourceFilter,
    setDateRange: setDateRangeAndReset,
    setRiskFilter: setRiskFilterAndReset,
    setSourceFilter: setSourceFilterAndReset,
    setSelectedId,
    clearFilters,
    currentPage,
    pageCount,
    goNext,
    goPrev,
    emptyMessage,
    filterActive,
    refetch,
  };
}
