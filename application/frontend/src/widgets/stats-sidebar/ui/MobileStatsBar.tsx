import styled from "styled-components";
import type { AnalyzeFrameResponse } from "@/entities/detection";
import {
  formatDensityLabel,
  formatRecommendation,
  formatRiskLabel,
} from "@/entities/crowd-stats";
import { Label } from "@/shared/ui";

type MobileStatsBarProps = {
  data: AnalyzeFrameResponse | null;
};

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  min-width: ${({ theme }) => theme.layout.mobileStatMinWidth};
  scroll-snap-align: start;
`;

const Bar = styled.div`
  display: none;
  position: relative;

  @media (max-width: ${({ theme }) => theme.layout.gridBreakpointLg}) {
    display: flex;
    position: fixed;
    top: ${({ theme }) => theme.layout.headerHeight};
    left: 0;
    right: 0;
    z-index: ${({ theme }) => theme.layout.zIndex.sidebar - 1};
    gap: ${({ theme }) => theme.spacing[3]};
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
    min-height: ${({ theme }) => theme.layout.mobileStatsBarHeight};
    align-items: center;
    background: ${({ theme }) => theme.color.glass.scrim};
    backdrop-filter: blur(${({ theme }) => theme.effects.glassBlur})
      saturate(${({ theme }) => theme.effects.glassSaturation});
    border-bottom: 1px solid ${({ theme }) => theme.color.glass.border};
    overflow-x: auto;
    scroll-snap-type: x proximity;

    &::after {
      content: "";
      position: sticky;
      right: 0;
      flex-shrink: 0;
      width: ${({ theme }) => theme.spacing[6]};
      margin-left: calc(-1 * ${({ theme }) => theme.spacing[6]});
      background: linear-gradient(
        to left,
        ${({ theme }) => theme.color.glass.scrim},
        transparent
      );
      pointer-events: none;
    }
  }
`;

const StatValue = styled.span`
  font-size: ${({ theme }) => theme.typography.size[3]};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.color.textPrimary};
`;

const StatValueCompact = styled(StatValue)`
  max-width: ${({ theme }) => theme.spacing[7]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
        <StatValue>{count}</StatValue>
      </Stat>
      <Stat>
        <Label $tone="secondary">Density</Label>
        <StatValue>{density}</StatValue>
      </Stat>
      <Stat>
        <Label $tone="secondary">Risk</Label>
        <StatValue>{risk}</StatValue>
      </Stat>
      <Stat>
        <Label $tone="secondary">Action</Label>
        <StatValueCompact title={recommendation}>{recommendation}</StatValueCompact>
      </Stat>
    </Bar>
  );
}
