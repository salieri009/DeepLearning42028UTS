import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  type DetectionModel,
  type SensorSettingsState,
  type SensorSource,
} from "@/entities/sensor";
import type { SessionResponse } from "@/entities/session";
import { getSettings, listSessions, updateSettings } from "@/shared/api";
import {
  loadSensorSettings,
  saveSensorSettings,
} from "@/shared/lib/sensorSettingsStorage";
import { reportError } from "@/shared/lib/reportError";

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

export function useSensorSettings() {
  const [sources, setSources] = useState<SensorSource[]>([]);
  const [settings, setSettings] = useState<SensorSettingsState>(() => loadSensorSettings());
  const [draft, setDraft] = useState<SensorSettingsState>(() => loadSensorSettings());
  const [dirty, setDirty] = useState(false);
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
        const [remoteSettings, sessions] = await Promise.all([
          getSettings(controller.signal),
          listSessions(20, 0, controller.signal),
        ]);

        const normalized = {
          ...remoteSettings,
          audibleAlerts: false,
          densityLimit: DEFAULT_SETTINGS.densityLimit,
        };

        if (controller.signal.aborted) return;

        setSettings(normalized);
        setDraft(normalized);
        saveSensorSettings(normalized);
        setDirty(false);
        setSources(sessionsToSources(sessions.items));
      } catch (err) {
        if (controller.signal.aborted) return;
        reportError(err);
        const local = loadSensorSettings();
        setSettings(local);
        setDraft(local);
        setError("Using local settings; backend unavailable.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, []);

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
  const setVisualOverlays = (visualOverlays: boolean) => updateDraft("visualOverlays", visualOverlays);
  const setLogErrors = (logErrors: boolean) => updateDraft("logErrors", logErrors);
  const setWebrtcAccess = (webrtcAccess: boolean) => updateDraft("webrtcAccess", webrtcAccess);

  const save = () => {
    void (async () => {
      const payload = {
        ...draft,
        audibleAlerts: false,
        densityLimit: DEFAULT_SETTINGS.densityLimit,
      };
      try {
        const saved = await updateSettings(payload);
        const normalized = { ...saved, audibleAlerts: false, densityLimit: DEFAULT_SETTINGS.densityLimit };
        setSettings(normalized);
        setDraft(normalized);
        saveSensorSettings(normalized);
        setDirty(false);
        setError(null);
      } catch (err) {
        reportError(err);
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

  return {
    sources: sources.length > 0 ? sources : [],
    draft,
    dirty,
    loading,
    error,
    setModel,
    setConfidence,
    setVisualOverlays,
    setLogErrors,
    setWebrtcAccess,
    save,
    discard,
    defaults: DEFAULT_SETTINGS,
  };
}
