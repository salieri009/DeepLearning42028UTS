import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSession, listSessions } from "@/shared/api";
import type { SessionDetailResponse } from "@/entities/session";
import { reportError } from "@/shared/lib/reportError";
import {
  ENRICH_CONCURRENCY,
  FETCH_BATCH_SIZE,
  filterSessions,
  isDefaultFilters,
  mapWithConcurrency,
  PAGE_SIZE,
  sessionToDetailFallback,
  type DateRangeFilter,
  type RiskFilter,
  type SourceFilter,
} from "../lib/sessionArchiveUtils";

export type { DateRangeFilter, RiskFilter, SourceFilter } from "../lib/sessionArchiveUtils";

async function fetchAllSessionDetails(signal: AbortSignal): Promise<SessionDetailResponse[]> {
  const listItems = [];
  let listOffset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (listOffset < total) {
    const page = await listSessions(FETCH_BATCH_SIZE, listOffset, signal);
    if (signal.aborted) return [];

    listItems.push(...page.items);
    total = page.total;
    listOffset += page.items.length;

    if (page.items.length === 0) break;
  }

  return mapWithConcurrency(listItems, ENRICH_CONCURRENCY, async (item) => {
    try {
      return await getSession(item.id, signal);
    } catch {
      return sessionToDetailFallback(item);
    }
  });
}

export function useSessionArchive() {
  const [sessions, setSessions] = useState<SessionDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);

  const [dateRange, setDateRange] = useState<DateRangeFilter>("30d");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");

  const loadVersionRef = useRef(0);

  const runLoad = useCallback(async (signal: AbortSignal) => {
    await Promise.resolve();
    if (signal.aborted) return;

    const loadVersion = loadVersionRef.current + 1;
    loadVersionRef.current = loadVersion;

    setLoading(true);
    setError(null);

    try {
      const enriched = await fetchAllSessionDetails(signal);
      if (signal.aborted || loadVersionRef.current !== loadVersion) return;

      setSessions(enriched);
      setSelectedId((prev) => {
        if (prev != null && enriched.some((session) => session.id === prev)) {
          return prev;
        }
        return enriched[0]?.id ?? null;
      });
    } catch (err) {
      if (signal.aborted || loadVersionRef.current !== loadVersion) return;
      reportError(err);
      setSessions([]);
      setSelectedId(null);
      setError("Failed to load sessions.");
    } finally {
      if (!signal.aborted && loadVersionRef.current === loadVersion) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Async fetch defers setState until after the first microtask.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount/refetch session list from API
    void runLoad(controller.signal);
    return () => controller.abort();
  }, [runLoad]);

  const filteredSessions = useMemo(
    () => filterSessions(sessions, dateRange, riskFilter, sourceFilter),
    [sessions, dateRange, riskFilter, sourceFilter],
  );

  const filterActive = !isDefaultFilters(dateRange, riskFilter, sourceFilter);
  const filteredTotal = filteredSessions.length;
  const pageCount = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const safeOffset = Math.min(offset, Math.max(0, (pageCount - 1) * PAGE_SIZE));
  const currentPage = Math.floor(safeOffset / PAGE_SIZE) + 1;

  const pagedSessions = useMemo(
    () => filteredSessions.slice(safeOffset, safeOffset + PAGE_SIZE),
    [filteredSessions, safeOffset],
  );

  const resolvedSelectedId = useMemo(() => {
    if (selectedId != null && filteredSessions.some((session) => session.id === selectedId)) {
      return selectedId;
    }
    return pagedSessions[0]?.id ?? null;
  }, [filteredSessions, pagedSessions, selectedId]);

  const selectedDetail = useMemo(
    () => filteredSessions.find((session) => session.id === resolvedSelectedId) ?? null,
    [filteredSessions, resolvedSelectedId],
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
    if (safeOffset + PAGE_SIZE < filteredTotal) {
      setOffset((value) => value + PAGE_SIZE);
    }
  }, [safeOffset, filteredTotal]);

  const goPrev = useCallback(() => {
    if (safeOffset > 0) {
      setOffset((value) => Math.max(0, value - PAGE_SIZE));
    }
  }, [safeOffset]);

  const emptyMessage =
    sessions.length === 0
      ? "No sessions found."
      : filterActive
        ? "No sessions match the current filters."
        : "No sessions found.";

  const refetch = useCallback(() => {
    const controller = new AbortController();
    void runLoad(controller.signal);
    return () => controller.abort();
  }, [runLoad]);

  return {
    sessions: pagedSessions,
    total: filteredTotal,
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
