import axios from "axios";
import type { AnalyzeFrameResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const API = axios.create({
  baseURL: API_BASE_URL,
});

export const analyzeFrame = (frameBase64: string) =>
  API.post<AnalyzeFrameResponse>("/api/v1/analyze-frame", { frame_base64: frameBase64 });

