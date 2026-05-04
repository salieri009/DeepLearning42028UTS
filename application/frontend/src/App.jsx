import { useEffect, useRef, useState } from "react";
import VideoFeed from "./components/VideoFeed";
import Controls from "./components/Controls";
import StatPanel from "./components/StatPanel";
import { startDetection, stopDetection } from "./api";

export default function App() {
  const [running, setRunning] = useState(false);
  const [data, setData] = useState(null);
  const wsRef = useRef(null);

  // connect websocket
  const connectWS = () => {
    const ws = new WebSocket("ws://localhost:5000/ws");

    ws.onopen = () => {
      console.log("WS connected");
    };

    ws.onmessage = (event) => {
      try {
        setData(JSON.parse(event.data));
      } catch (e) {
        console.error("Bad WS data", e);
      }
    };

    ws.onclose = () => {
      console.log("WS closed");
    };

    ws.onerror = (err) => {
      console.error("WS error", err);
    };

    wsRef.current = ws;
  };

  const start = async () => {
    await startDetection();
    connectWS();
    setRunning(true);
  };

  const stop = async () => {
    await stopDetection();
    wsRef.current?.close();
    wsRef.current = null;
    setRunning(false);
    setData(null);
  };

  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>CrowdNav</h2>

      <VideoFeed running={running} data={data} />

      <Controls running={running} onStart={start} onStop={stop} />

      <StatPanel data={data} />
    </div>
  );
}