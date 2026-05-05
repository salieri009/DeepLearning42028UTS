import { useCallback, useEffect, useRef, useState } from "react";
import VideoFeed from "./Components/VideoFeed";
import Controls from "./Components/Controls";
import StatPanel from "./Components/StatPanel";
import { analyzeFrame } from "./api";

export default function App() {
  const [running, setRunning] = useState(false);
  const [data, setData] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const startingRef = useRef(false);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg").split(",")[1];
  }, []);

  // Start detection: acquire webcam and begin polling the backend
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

      intervalRef.current = setInterval(async () => {
        const frame = captureFrame();
        if (!frame) return;
        try {
          const res = await analyzeFrame(frame);
          setData(res.data);
        } catch (e) {
          console.error("Analyze error", e);
        }
      }, 500);
    } catch (e) {
      console.error("Start error", e);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    } finally {
      startingRef.current = false;
    }
  };

  // Stop detection: always clean up regardless of errors
  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
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

  // Cleanup on unmount — also clears startingRef so reconnect logic cannot fire
  useEffect(() => {
    return () => {
      startingRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
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