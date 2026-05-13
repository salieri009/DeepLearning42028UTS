import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import VideoFeed from "./features/video/VideoFeed";
import Controls from "./features/controls/Controls";
import StatPanel from "./features/stats/StatPanel";
import { analyzeFrame } from "./api";
import type { AnalyzeFrameResponse } from "./types";
import { Title } from "./ui/Typography";

const Page = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

const Status = styled.span<{ $running: boolean }>`
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme, $running }) => ($running ? theme.color.successText : theme.color.textSecondary)};
`;

const Content = styled.main`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: ${({ theme }) => theme.spacing[5]};

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const Side = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

// ---------------------------------------------------------------------------
// Audio alerts via Web Speech API
// ---------------------------------------------------------------------------
const ALERT_MESSAGES: Record<string, string> = {
  WARNING: "Caution. Pedestrians nearby.",
  DANGER: "Warning! Crowd detected. Please stop.",
};

/** Minimum ms between spoken alerts to avoid spamming. */
const ALERT_COOLDOWN_MS = 5000;

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 1.1;
  utt.volume = 1;
  window.speechSynthesis.speak(utt);
}

function tryVibrate(pattern: number[]) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

// ---------------------------------------------------------------------------

function reportError(context: string, error: unknown) {
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

  // Track last spoken risk to avoid repeating identical alerts
  const lastSpokenRiskRef = useRef<string>("SAFE");
  const lastAlertTimeRef = useRef<number>(0);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg").split(",")[1] ?? null;
  }, []);

  const triggerAlert = useCallback((risk: string) => {
    const now = Date.now();
    const isHigherRisk =
      (risk === "DANGER") ||
      (risk === "WARNING" && lastSpokenRiskRef.current === "SAFE");
    const cooldownPassed = now - lastAlertTimeRef.current > ALERT_COOLDOWN_MS;

    if (isHigherRisk && cooldownPassed) {
      const msg = ALERT_MESSAGES[risk];
      if (msg) {
        speak(msg);
        if (risk === "DANGER") tryVibrate([200, 100, 200, 100, 400]);
        else if (risk === "WARNING") tryVibrate([200, 100, 200]);
      }
      lastAlertTimeRef.current = now;
    }
    lastSpokenRiskRef.current = risk;
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
      lastSpokenRiskRef.current = "SAFE";
      lastAlertTimeRef.current = 0;

      intervalRef.current = window.setInterval(async () => {
        const frame = captureFrame();
        if (!frame) return;
        try {
          const res = await analyzeFrame(frame);
          setData(res.data);
          triggerAlert(res.data.max_proximity_risk ?? "SAFE");
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
    window.speechSynthesis?.cancel();
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
      window.speechSynthesis?.cancel();
    };
  }, []);

  return (
    <Page>
      <Header>
        <Title>CrowdNav</Title>
        <Status $running={running}>{running ? "Running" : "Idle"}</Status>
      </Header>

      <Content>
        <VideoFeed running={running} data={data} videoRef={videoRef} />

        <Side>
          <Controls running={running} onStart={start} onStop={stop} />
          <StatPanel data={data} />
        </Side>
      </Content>
    </Page>
  );
}
