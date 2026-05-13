import styled from "styled-components";
import type { AnalyzeFrameResponse } from "../types";

type StatPanelProps = {
  data: AnalyzeFrameResponse | null;
};

const Panel = styled.div`
  margin-top: 10px;
  padding: 12px;
  border: 1px solid #dddddd;
  background: #f3f3f3;
  border-radius: 8px;
  width: 720px;
  color: black;
`;

const RISK_STYLE: Record<string, { color: string; background: string }> = {
  SAFE: { color: "#1b5e20", background: "#e8f5e9" },
  WARNING: { color: "#f57f17", background: "#fff8e1" },
  DANGER: { color: "#b71c1c", background: "#ffebee" },
};

const DENSITY_STYLE: Record<string, { color: string }> = {
  LOW: { color: "#2e7d32" },
  MEDIUM: { color: "#e65100" },
  HIGH: { color: "#b71c1c" },
};

function RiskBadge({ value }: { value: string | undefined }) {
  const style = RISK_STYLE[value ?? "SAFE"] ?? RISK_STYLE.SAFE;
  return (
    <span
      style={{
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 4,
        ...style,
      }}
    >
      {value ?? "—"}
    </span>
  );
}

export default function StatPanel({ data }: StatPanelProps) {
  if (!data) return null;

  const personCount = data.persons?.length ?? 0;
  const densityStyle = DENSITY_STYLE[data.crowd_density ?? "LOW"] ?? DENSITY_STYLE.LOW;

  return (
    <>
      <h1>Crowd Tracking Statistics</h1>
      <Panel>
        <p>
          <b>People detected:</b> {personCount}
        </p>
        <p>
          <b>Crowd Density:</b>{" "}
          <span style={{ fontWeight: 700, ...densityStyle }}>
            {data.crowd_density ?? "—"}
          </span>
        </p>
        <p>
          <b>Max Proximity Risk:</b> <RiskBadge value={data.max_proximity_risk} />
        </p>
        <p>
          <b>Recommendation:</b> {data.recommendation ?? "—"}
        </p>
      </Panel>
    </>
  );
}
