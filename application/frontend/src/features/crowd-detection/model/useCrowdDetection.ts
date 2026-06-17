import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyzeFrameResponse } from "@/entities/detection";
import { analyzeFrame, closeSession, createSession } from "@/shared/api";
import { reportError } from "@/shared/lib/reportError";

type UseCrowdDetectionOptions = {
  onAnalyzed?: (data: AnalyzeFrameResponse) => void;
  intervalMs?: number;
};

export const DEFAULT_CAPTURE_INTERVAL_MS = 500;

export function useCrowdDetection({
  onAnalyzed,
  intervalMs = DEFAULT_CAPTURE_INTERVAL_MS,
}: UseCrowdDetectionOptions = {}) {
  const [running, setRunning] = useState(false);
  const [data, setData] = useState<AnalyzeFrameResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startingRef = useRef(false);
  const sessionIdRef = useRef<number | null>(null);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg").split(",")[1] ?? null;
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    const activeSessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    if (activeSessionId != null) {
      closeSession(activeSessionId).catch((e) => reportError("Close session error", e));
    }
    setRunning(false);
    setData(null);
    setLatencyMs(null);
  }, []);

  const start = useCallback(async () => {
    if (startingRef.current || running) return;
    startingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setRunning(true);

      try {
        const session = await createSession("WEBCAM");
        sessionIdRef.current = session.id;
      } catch (e) {
        reportError("Create session error", e);
        sessionIdRef.current = null;
      }

      intervalRef.current = window.setInterval(async () => {
        const frame = captureFrame();
        if (!frame) return;
        const started = performance.now();
        try {
          const res = await analyzeFrame(frame, sessionIdRef.current);
          setLatencyMs(Math.round(performance.now() - started));
          setData(res.data);
          onAnalyzed?.(res.data);
        } catch (e) {
          reportError("Analyze error", e);
        }
      }, intervalMs);
    } catch (e) {
      reportError("Start error", e);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    } finally {
      startingRef.current = false;
    }
  }, [captureFrame, intervalMs, onAnalyzed, running]);

  useEffect(() => {
    return () => {
      startingRef.current = false;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    running,
    data,
    latencyMs,
    videoRef,
    start,
    stop,
  };
}
