import axios from "axios";
import { getSettings } from "./settings";

const ACTUATOR_BASE =
  import.meta.env.VITE_ACTUATOR_BASE_URL ?? (import.meta.env.DEV ? "" : "");

const actuatorClient = axios.create({
  baseURL: ACTUATOR_BASE,
});

export type HealthResponse = {
  status: string;
  components?: Record<string, { status: string; details?: Record<string, unknown> }>;
};

export async function getBackendHealth(): Promise<HealthResponse> {
  const { data } = await actuatorClient.get<HealthResponse>("/actuator/health");
  return data;
}

export async function getBackendReadiness(): Promise<HealthResponse> {
  const { data } = await actuatorClient.get<HealthResponse>("/actuator/health/readiness");
  return data;
}

export async function getSettingsModelLabel(): Promise<string> {
  const settings = await getSettings();
  return settings.model;
}
