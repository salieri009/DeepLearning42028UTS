import styled from "styled-components";
import { GlassPanel, Icon, RangeSlider } from "@/shared/ui";

type AlertThresholdsPanelProps = {
  confidence: number;
  densityLimit: number;
  onConfidenceChange: (v: number) => void;
  onDensityChange: (v: number) => void;
};

const Panel = styled(GlassPanel)`
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadow.glow};
`;

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing[6]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.size[4]};
  color: ${({ theme }) => theme.color.primary};
`;

const Sliders = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
`;

export function AlertThresholdsPanel({
  confidence,
  densityLimit,
  onConfidenceChange,
  onDensityChange,
}: AlertThresholdsPanelProps) {
  return (
    <Panel>
      <Title>
        <Icon name="tune" size={22} />
        Alert Thresholds
      </Title>
      <Sliders>
        <RangeSlider
          label="Detection Confidence"
          value={confidence}
          min={50}
          max={99}
          displayValue={`${confidence}%`}
          hint="Higher values reduce false positives but may miss partial occlusions."
          onChange={onConfidenceChange}
        />
        <RangeSlider
          label="Crowd Density Limit"
          value={densityLimit}
          min={10}
          max={100}
          displayValue={`${densityLimit} / m²`}
          hint="Triggers notification when local density exceeds the specified metric."
          onChange={onDensityChange}
        />
      </Sliders>
    </Panel>
  );
}
