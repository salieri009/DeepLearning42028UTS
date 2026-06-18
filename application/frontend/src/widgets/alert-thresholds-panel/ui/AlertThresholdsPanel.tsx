import styled from "styled-components";
import { GlassPanel, Icon, RangeSlider } from "@/shared/ui";

type AlertThresholdsPanelProps = {
  confidence: number;
  densityLimit: number;
  onConfidenceChange: (v: number) => void;
  onDensityLimitChange: (v: number) => void;
};

const Panel = styled(GlassPanel)`
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadow.glow};
`;

const Title = styled.h2`
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

const DensityNote = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.textSecondary};
  line-height: 1.5;
`;

export function AlertThresholdsPanel({
  confidence,
  densityLimit,
  onConfidenceChange,
  onDensityLimitChange,
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
          min={1}
          max={500}
          displayValue={`${densityLimit} people`}
          hint="Forwarded to inference via backend settings (FR-15). Scales density classification."
          onChange={onDensityLimitChange}
        />
        <DensityNote>
          Crowd density (PRD §8): ≤2 people LOW · ≤5 MEDIUM · 6+ HIGH. Proximity risk may elevate
          severity (FR-2).
        </DensityNote>
      </Sliders>
    </Panel>
  );
}
