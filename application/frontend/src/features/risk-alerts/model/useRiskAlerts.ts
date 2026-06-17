import { useCallback, useRef } from "react";
import { loadSensorSettings } from "@/shared/lib/sensorSettingsStorage";

const ALERT_MESSAGES: Record<string, string> = {
  WARNING: "Caution. Pedestrians nearby.",
  DANGER: "Warning! Crowd detected. Please stop.",
};

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

export function useRiskAlerts() {
  const lastSpokenRiskRef = useRef<string>("SAFE");
  const lastAlertTimeRef = useRef<number>(0);

  const reset = useCallback(() => {
    lastSpokenRiskRef.current = "SAFE";
    lastAlertTimeRef.current = 0;
  }, []);

  const triggerAlert = useCallback((risk: string) => {
    const { audibleAlerts } = loadSensorSettings();
    if (!audibleAlerts) {
      lastSpokenRiskRef.current = risk;
      return;
    }

    const now = Date.now();
    const isHigherRisk =
      risk === "DANGER" || (risk === "WARNING" && lastSpokenRiskRef.current === "SAFE");
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

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { triggerAlert, reset, cancel };
}
