import type { AnalyzeFrameResponse } from "@/entities/detection";
import { apiClient } from "./client";

export const analyzeFrame = (frameBase64: string, sessionId?: number | null) =>
  apiClient.post<AnalyzeFrameResponse>("/v1/analyze-frame", {
    frame_base64: frameBase64,
    ...(sessionId != null ? { session_id: sessionId } : {}),
  });
