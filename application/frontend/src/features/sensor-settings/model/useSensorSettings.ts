import { useCallback, useState } from "react";
import {
  DEFAULT_SENSOR_SOURCES,
  DEFAULT_SETTINGS,
  type DetectionModel,
  type SensorSettingsState,
  type SensorSource,
} from "@/entities/sensor";

export function useSensorSettings() {
  const [sources] = useState<SensorSource[]>(DEFAULT_SENSOR_SOURCES);
  const [settings, setSettings] = useState<SensorSettingsState>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<SensorSettingsState>(DEFAULT_SETTINGS);
  const [dirty, setDirty] = useState(false);

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
  const setAudibleAlerts = (audibleAlerts: boolean) => updateDraft("audibleAlerts", audibleAlerts);
  const setLogErrors = (logErrors: boolean) => updateDraft("logErrors", logErrors);
  const setWebrtcAccess = (webrtcAccess: boolean) => updateDraft("webrtcAccess", webrtcAccess);

  const save = () => {
    setSettings(draft);
    setDirty(false);
  };

  const discard = () => {
    setDraft(settings);
    setDirty(false);
  };

  return {
    sources,
    draft,
    dirty,
    setModel,
    setConfidence,
    setDensityLimit,
    setVisualOverlays,
    setAudibleAlerts,
    setLogErrors,
    setWebrtcAccess,
    save,
    discard,
  };
}
