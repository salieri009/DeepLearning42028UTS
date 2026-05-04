import { useEffect, useRef, useState } from "react";
import VideoFeed from "./components/VideoFeed";
import Controls from "./components/Controls";
import StatPanel from "./components/StatPanel";
import { startDetection, stopDetection } from "./api";

export default function App() {
  const [running, setRunning] = useState(false);
  const [data, setData] = useState(null);

  const wsRef = useRef(null);
  const runningRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);

  // WebSocket connection
  const connectWS = () => {
    const ws = new WebSocket("ws://localhost:5000/ws");

    ws.onopen = () => {
      console.log("WS connected");
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setData(parsed);
      } catch (e) {
        console.error("Bad WS data:", event.data);
      }
    };

    ws.onerror = (err) => {
      console.error("WS error", err);
    };

    ws.onclose = () => {
      console.log("WS closed");

      wsRef.current = null;

      // prevent multiple reconnect loops
      if (reconnectTimeoutRef.current) return;

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;

        if (runningRef.current) {
          connectWS();
        }
      }, 2000);
    };

    wsRef.current = ws;
  };

  // Start detection
  const start = async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    await startDetection();

    connectWS();

    setRunning(true);
    runningRef.current = true;
  };

  // stop detection
  const stop = async () => {
    await stopDetection();

    // close websocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // clear reconnect timer
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setRunning(false);
    runningRef.current = false;
    setData(null);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Ui render
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>CrowdNav</h2>

      <VideoFeed running={running} data={data} />

      <Controls running={running} onStart={start} onStop={stop} />

      <StatPanel data={data} />
    </div>
  );
}