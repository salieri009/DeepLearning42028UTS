import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080",
});

export const analyzeFrame = (frameBase64) =>
  API.post("/api/v1/analyze-frame", { frame_base64: frameBase64 });
