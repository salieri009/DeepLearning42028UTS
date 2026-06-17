import {
  DEFAULT_SETTINGS,
  type SensorSettingsState,
} from "@/entities/sensor";

const STORAGE_KEY = "crowdnav.sensor-settings.v1";

export function loadSensorSettings(): SensorSettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as SensorSettingsState;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSensorSettings(settings: SensorSettingsState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
