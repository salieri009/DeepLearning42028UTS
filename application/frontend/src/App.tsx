import { useCallback, useEffect, useRef, useState } from "react";
import VideoFeed from "./Components/VideoFeed";
import Controls from "./Components/Controls";
import StatPanel from "./Components/StatPanel";
import { analyzeFrame } from "./api";
import type { AnalyzeFrameResponse } from "./types";

function reportError(context: string, error: unknown) {
  // In production, avoid dumping rich error objects that can include request metadata.
  if (import.meta.env.DEV) {
    console.error(context, error);
    return;
  }
  console.error(context);
}

export default function App() {
  const [running, setRunning] = useState(false);
  const [data, setData] = useState<AnalyzeFrameResponse | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startingRef = useRef(false);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg").split(",")[1] ?? null;
  }, []);

  const start = async () => {
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

      intervalRef.current = window.setInterval(async () => {
        const frame = captureFrame();
        if (!frame) return;
        try {
          const res = await analyzeFrame(frame);
          setData(res.data);
        } catch (e) {
          reportError("Analyze error", e);
        }
      }, 500);
    } catch (e) {
      reportError("Start error", e);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    } finally {
      startingRef.current = false;
    }
  };

  const stop = () => {
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
    setRunning(false);
    setData(null);
  };

  useEffect(() => {
    return () => {
      startingRef.current = false;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>CrowdNav</h2>

      <VideoFeed running={running} data={data} videoRef={videoRef} />

      <Controls running={running} onStart={start} onStop={stop} />

      <StatPanel data={data} />
    </div>
  );
}

