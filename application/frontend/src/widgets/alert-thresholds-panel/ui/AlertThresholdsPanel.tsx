import styled from "styled-components";
import { GlassPanel, Icon, PanelTitle, PanelTitleRow, RangeSlider, UnsavedBadge } from "@/shared/ui";

type AlertThresholdsPanelProps = {
  confidence: number;
  densityLimit: number;
  dirty?: boolean;
  onConfidenceChange: (v: number) => void;
  onDensityLimitChange: (v: number) => void;
};

const Panel = styled(GlassPanel)`
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadow.glow};
  height: 100%;
`;

const Sliders = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`;

export function AlertThresholdsPanel({
  confidence,
  densityLimit,
  dirty = false,
  onConfidenceChange,
  onDensityLimitChange,
}: AlertThresholdsPanelProps) {
  const normalizedDensity = Math.max(5, Math.min(500, Math.round(densityLimit / 5) * 5));

  return (
    <Panel>
      <PanelTitleRow>
        <PanelTitle>
          <Icon name="tune" size={20} />
          Alert Thresholds
        </PanelTitle>
        {dirty ? <UnsavedBadge>Unsaved</UnsavedBadge> : null}
      </PanelTitleRow>
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
          value={normalizedDensity}
          min={5}
          max={500}
          step={5}
          displayValue={`${normalizedDensity} ppl`}
          hint="Adjusts when crowd density is classified as HIGH on the dashboard."
          onChange={onDensityLimitChange}
        />
      </Sliders>
    </Panel>
  );
}
