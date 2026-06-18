import type { AnalyzeFrameResponse } from "@/entities/detection";
import { sessionAuthHeaders } from "@/shared/lib/sessionTokenStorage";
import { apiClient } from "./client";

export const analyzeFrame = (frameBase64: string, sessionId?: number | null) =>
  apiClient.post<AnalyzeFrameResponse>(
    "/v1/analyze-frame",
    {
      frame_base64: frameBase64,
      ...(sessionId != null ? { session_id: sessionId } : {}),
    },
    sessionId != null ? { headers: sessionAuthHeaders(sessionId) } : undefined,
  );
