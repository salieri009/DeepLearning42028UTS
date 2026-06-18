import { apiClient } from "./client";
import type {
  DetectionListResponse,
  FrameListResponse,
  SessionDetailResponse,
  SessionListResponse,
  SessionResponse,
  SourceType,
} from "@/entities/session";

export async function createSession(
  sourceType: SourceType = "WEBCAM",
  clientLabel = "CrowdNav Dashboard",
): Promise<SessionResponse> {
  const { data } = await apiClient.post<SessionResponse>("/v1/sessions", {
    source_type: sourceType,
    client_label: clientLabel,
  });
  return data;
}

export async function closeSession(id: number): Promise<SessionResponse> {
  const { data } = await apiClient.patch<SessionResponse>(`/v1/sessions/${id}`, {});
  return data;
}

export async function listSessions(
  limit = 20,
  offset = 0,
  signal?: AbortSignal,
): Promise<SessionListResponse> {
  const { data } = await apiClient.get<SessionListResponse>("/v1/sessions", {
    params: { limit, offset },
    signal,
  });
  return data;
}

export async function getSession(
  id: number,
  signal?: AbortSignal,
): Promise<SessionDetailResponse> {
  const { data } = await apiClient.get<SessionDetailResponse>(`/v1/sessions/${id}`, {
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
    signal,
  });
  return data;
}
