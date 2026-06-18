import { apiClient } from "./client";
import type { SensorSettingsState } from "@/entities/sensor";

type SensorSettingsWire = {
  model: SensorSettingsState["model"];
  confidence: number;
  density_limit: number;
  visual_overlays: boolean;
  audible_alerts: boolean;
  log_errors: boolean;
  webrtc_access: boolean;
};

function toWire(settings: SensorSettingsState): SensorSettingsWire {
  return {
    model: settings.model,
    confidence: settings.confidence,
    density_limit: settings.densityLimit,
    visual_overlays: settings.visualOverlays,
    audible_alerts: settings.audibleAlerts,
    log_errors: settings.logErrors,
    webrtc_access: settings.webrtcAccess,
  };
}

function fromWire(settings: SensorSettingsWire): SensorSettingsState {
  return {
    model: settings.model,
    confidence: settings.confidence,
    densityLimit: settings.density_limit,
    visualOverlays: settings.visual_overlays,
    audibleAlerts: settings.audible_alerts,
    logErrors: settings.log_errors,
    webrtcAccess: settings.webrtc_access,
  };
}

export async function getSettings(signal?: AbortSignal): Promise<SensorSettingsState> {
  const { data } = await apiClient.get<SensorSettingsWire>("/v1/settings", { signal });
  return fromWire(data);
}

export async function updateSettings(
  settings: SensorSettingsState,
  signal?: AbortSignal,
): Promise<SensorSettingsState> {
  const { data } = await apiClient.put<SensorSettingsWire>("/v1/settings", toWire(settings), {
    signal,
  });
  return fromWire(data);
}
