import type { DefaultTheme } from "styled-components";
import type { ProximityRisk } from "../model/types";

export function getRiskColor(theme: DefaultTheme, risk: ProximityRisk | string | undefined): string {
  const key = (risk ?? "SAFE") as ProximityRisk;
  return theme.color.risk[key] ?? theme.color.risk.SAFE;
}

export function normalizeRisk(risk: string | undefined): ProximityRisk {
  if (risk === "WARNING" || risk === "DANGER") return risk;
  return "SAFE";
}
