import { useCallback, useRef } from "react";

const ALERT_COOLDOWN_MS = 5000;

/** Text-only risk tracking per PRD §9 / REQUIREMENTS §4 (no audio or haptic). */
export function useRiskAlerts() {
  const lastSpokenRiskRef = useRef<string>("SAFE");
  const lastAlertTimeRef = useRef<number>(0);

  const reset = useCallback(() => {
    lastSpokenRiskRef.current = "SAFE";
    lastAlertTimeRef.current = 0;
  }, []);

  const triggerAlert = useCallback((risk: string) => {
    const now = Date.now();
    const isHigherRisk =
      risk === "DANGER" || (risk === "WARNING" && lastSpokenRiskRef.current === "SAFE");
    const cooldownPassed = now - lastAlertTimeRef.current > ALERT_COOLDOWN_MS;

    if (isHigherRisk && cooldownPassed) {
      lastAlertTimeRef.current = now;
    }
    lastSpokenRiskRef.current = risk;
  }, []);

  const cancel = useCallback(() => {
    /* no-op: audio removed per PRD §9 */
  }, []);

  return { triggerAlert, reset, cancel };
}
