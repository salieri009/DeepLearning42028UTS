/**
 * Drop-in helper for React Native: calls the Java CrowdNav API (mock).
 * Call configureCrowdNavApi once at startup with your server URL (LAN IP on device).
 */

export type CrowdDensity = "HIGH" | "MEDIUM" | "LOW";
export type ProximityRisk = "CRITICAL" | "WARNING" | "SAFE";
export type Recommendation = "STOP" | "CAUTION" | "PROCEED";

export interface BBox {
  x_center: number;
  y_center: number;
  width: number;
  height: number;
}

export interface PersonDetection {
  class: string;
  confidence: number;
  bbox: BBox;
}

export interface AnalyzeFrameResponse {
  persons: PersonDetection[];
  crowd_density: CrowdDensity;
  max_proximity_risk: ProximityRisk;
  recommendation: Recommendation;
}

let apiBaseUrl = "http://localhost:8080";

/** Example: configureCrowdNavApi("http://192.168.0.12:8080") or Android emulator `http://10.0.2.2:8080`. */
export function configureCrowdNavApi(baseUrl: string): void {
  apiBaseUrl = baseUrl.replace(/\/$/, "");
}

export async function analyzeFrameMock(): Promise<AnalyzeFrameResponse> {
  const res = await fetch(`${apiBaseUrl}/api/v1/analyze-frame`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) {
    throw new Error(`analyze-frame failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<AnalyzeFrameResponse>;
}
