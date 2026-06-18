import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  type DetectionModel,
  type SensorSettingsState,
  type SensorSource,
} from "@/entities/sensor";
import type { SessionResponse } from "@/entities/session";
import {
  addCustomSource,
  loadCustomSources,
  updateCustomSource,
} from "@/shared/lib/customSourcesStorage";
import { getSettings, listSessions, updateSettings } from "@/shared/api";
import {
  loadSensorSettings,
  saveSensorSettings,
} from "@/shared/lib/sensorSettingsStorage";
import { reportError, setLogErrorsEnabled } from "@/shared/lib/reportError";

function sessionsToSources(sessions: SessionResponse[]): SensorSource[] {
  return sessions
    .filter((session) => session.source_type === "WEBCAM")
    .map((session) => ({
      id: `session-${session.id}`,
      name: session.client_label,
      ip: `session:${session.id}`,
      feedLabel: `${session.source_type} // ${session.ended_at ? "archived" : "live"}`,
      connected: session.ended_at == null,
    }));
}

function mergeSources(sessionSources: SensorSource[]): SensorSource[] {
  const custom = loadCustomSources();
  const byId = new Map<string, SensorSource>();
  for (const source of [...sessionSources, ...custom]) {
    byId.set(source.id, source);
  }
  return [...byId.values()];
}

export function useSensorSettings() {
  const [sources, setSources] = useState<SensorSource[]>([]);
  const [settings, setSettings] = useState<SensorSettingsState>(() => loadSensorSettings());
  const [draft, setDraft] = useState<SensorSettingsState>(() => loadSensorSettings());
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSources = useCallback(async (signal?: AbortSignal) => {
    const sessions = await listSessions(20, 0, signal);
    setSources(mergeSources(sessionsToSources(sessions.items)));
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;

      setLoading(true);
      setError(null);

      try {
        const [remoteSettings] = await Promise.all([
          getSettings(controller.signal),
          refreshSources(controller.signal),
        ]);

        const normalized = {
          ...remoteSettings,
          audibleAlerts: false,
        };

        if (controller.signal.aborted) return;

        setSettings(normalized);
        setDraft(normalized);
        saveSensorSettings(normalized);
        setLogErrorsEnabled(normalized.logErrors);
        setDirty(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        reportError("Load sensor settings error", err);
        const local = loadSensorSettings();
        setSettings(local);
        setDraft(local);
        setLogErrorsEnabled(local.logErrors);
        setSources(mergeSources([]));
        setError("Using local settings; backend unavailable.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [refreshSources]);

  const updateDraft = useCallback(<K extends keyof SensorSettingsState>(
    key: K,
    value: SensorSettingsState[K],
  ) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      setDirty(JSON.stringify(next) !== JSON.stringify(settings));
      return next;
    });
  }, [settings]);

  const setModel = (model: DetectionModel) => updateDraft("model", model);
  const setConfidence = (confidence: number) => updateDraft("confidence", confidence);
  const setDensityLimit = (densityLimit: number) => updateDraft("densityLimit", densityLimit);
  const setVisualOverlays = (visualOverlays: boolean) => updateDraft("visualOverlays", visualOverlays);
  const setLogErrors = (logErrors: boolean) => updateDraft("logErrors", logErrors);
  const setWebrtcAccess = (webrtcAccess: boolean) => updateDraft("webrtcAccess", webrtcAccess);

  const save = () => {
    void (async () => {
      const payload = {
        ...draft,
        audibleAlerts: false,
      };
      try {
        const saved = await updateSettings(payload);
        const normalized = { ...saved, audibleAlerts: false };
        setSettings(normalized);
        setDraft(normalized);
        saveSensorSettings(normalized);
        setDirty(false);
        setError(null);
      } catch (err) {
        reportError("Save sensor settings error", err);
        setSettings(draft);
        saveSensorSettings(draft);
        setDirty(false);
        setError("Saved locally; backend sync failed.");
      }
    })();
  };

  const discard = () => {
    setDraft(settings);
    setDirty(false);
  };

  const addSource = (name: string, ip: string, feedLabel: string) => {
    const created = addCustomSource({
      name,
      ip,
      feedLabel,
      connected: true,
    });
    setSources((prev) => [...prev.filter((s) => s.id !== created.id), created]);
    return created;
  };

  const updateSource = (id: string, patch: Partial<SensorSource>) => {
    const updated = updateCustomSource(id, patch);
    if (!updated) return null;
    setSources((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  return {
    sources,
    draft,
    dirty,
    loading,
    error,
    setModel,
    setConfidence,
    setDensityLimit,
    setVisualOverlays,
    setLogErrors,
    setWebrtcAccess,
    save,
    discard,
    addSource,
    updateSource,
    defaults: DEFAULT_SETTINGS,
  };
}
