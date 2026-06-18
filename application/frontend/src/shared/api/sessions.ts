import { apiClient } from "./client";
import { SESSION_TOKEN_HEADER, sessionAuthHeaders, storeSessionToken } from "@/shared/lib/sessionTokenStorage";
import type {
  DetectionListResponse,
  FrameListResponse,
  ProximityRisk,
  SessionDetailResponse,
  SessionListResponse,
  SessionResponse,
  SourceType,
} from "@/entities/session";

export { SESSION_TOKEN_HEADER };

export async function createSession(
  sourceType: SourceType = "WEBCAM",
  clientLabel = "CrowdNav Dashboard",
): Promise<SessionResponse> {
  const { data } = await apiClient.post<SessionResponse>("/v1/sessions", {
    source_type: sourceType,
    client_label: clientLabel,
  });
  if (data.access_token) {
    storeSessionToken(data.id, data.access_token);
  }
  return data;
}

export async function closeSession(id: number): Promise<SessionResponse> {
  const { data } = await apiClient.patch<SessionResponse>(`/v1/sessions/${id}`, {}, {
    headers: sessionAuthHeaders(id),
  });
  return data;
}

export type ListSessionsParams = {
  limit?: number;
  offset?: number;
  days?: number;
  sourceType?: SourceType;
  worstRisk?: ProximityRisk;
};

export async function listSessions(
  limitOrParams: number | ListSessionsParams = 20,
  offset = 0,
  signal?: AbortSignal,
): Promise<SessionListResponse> {
  const params: ListSessionsParams =
    typeof limitOrParams === "number" ? { limit: limitOrParams, offset } : limitOrParams;

  const { data } = await apiClient.get<SessionListResponse>("/v1/sessions", {
    params: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      days: params.days,
      source_type: params.sourceType,
      worst_risk: params.worstRisk,
    },
    signal: typeof limitOrParams === "number" ? signal : undefined,
  });
  return data;
}

export async function getSession(
  id: number,
  signal?: AbortSignal,
): Promise<SessionDetailResponse> {
  const { data } = await apiClient.get<SessionDetailResponse>(`/v1/sessions/${id}`, {
    headers: sessionAuthHeaders(id),
    signal,
  });
  return data;
}

export type ListDetectionsParams = {
  risk?: string;
  classLabel?: string;
  limit?: number;
};

export async function listDetections(
  id: number,
  params: ListDetectionsParams = {},
  signal?: AbortSignal,
): Promise<DetectionListResponse> {
  const { data } = await apiClient.get<DetectionListResponse>(`/v1/sessions/${id}/detections`, {
    params: {
      risk: params.risk,
      class: params.classLabel,
      limit: params.limit ?? 100,
    },
    headers: sessionAuthHeaders(id),
    signal,
  });
  return data;
}

export async function listSessionFrames(
  id: number,
  limit = 100,
  signal?: AbortSignal,
): Promise<FrameListResponse> {
  const { data } = await apiClient.get<FrameListResponse>(`/v1/sessions/${id}/frames`, {
    params: { limit },
    headers: sessionAuthHeaders(id),
    signal,
  });
  return data;
}
