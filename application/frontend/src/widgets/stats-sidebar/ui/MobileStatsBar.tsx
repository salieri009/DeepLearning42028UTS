import styled from "styled-components";
import type { AnalyzeFrameResponse } from "@/entities/detection";
import {
  formatDensityLabel,
  formatRecommendation,
  formatRiskLabel,
} from "@/entities/crowd-stats";
import { Label, Text } from "@/shared/ui";

type MobileStatsBarProps = {
  data: AnalyzeFrameResponse | null;
};

const Bar = styled.div`
  display: none;

  @media (max-width: 1024px) {
    display: flex;
    position: fixed;
    top: ${({ theme }) => theme.layout.headerHeight};
    left: 0;
    right: 0;
    z-index: ${({ theme }) => theme.layout.zIndex.sidebar - 1};
    gap: ${({ theme }) => theme.spacing[3]};
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
    background: ${({ theme }) => theme.color.glass.scrim};
    backdrop-filter: blur(16px);
    border-bottom: 1px solid ${({ theme }) => theme.color.glass.border};
    overflow-x: auto;
  }
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 72px;
`;

export function MobileStatsBar({ data }: MobileStatsBarProps) {
  if (!data) return null;

  const count = data.persons?.length ?? 0;
  const density = formatDensityLabel(data.crowd_density);
  const risk = formatRiskLabel(data.max_proximity_risk);
  const recommendation = formatRecommendation(data.recommendation);

  return (
    <Bar aria-label="Live crowd statistics summary">
      <Stat>
        <Label $tone="secondary">People</Label>
        <Text $weight="bold">{count}</Text>
      </Stat>
      <Stat>
        <Label $tone="secondary">Density</Label>
        <Text $weight="bold">{density}</Text>
      </Stat>
      <Stat>
        <Label $tone="secondary">Risk</Label>
        <Text $weight="bold">{risk}</Text>
      </Stat>
      <Stat>
        <Label $tone="secondary">Action</Label>
        <Text $weight="bold">{recommendation}</Text>
      </Stat>
    </Bar>
  );
}
