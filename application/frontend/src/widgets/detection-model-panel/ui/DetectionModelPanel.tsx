import { Icon, PanelTitle, PanelTitleRow, RadioGroup, UnsavedBadge } from "@/shared/ui";
import type { DetectionModel } from "@/entities/sensor";
import { GlassPanel } from "@/shared/ui";
import styled from "styled-components";

type DetectionModelPanelProps = {
  model: DetectionModel;
  dirty?: boolean;
  onChange: (model: DetectionModel) => void;
};

const Panel = styled(GlassPanel)`
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadow.glow};
  height: 100%;
`;

const Description = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.color.textSecondary};
  font-size: ${({ theme }) => theme.typography.size[2]};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

export function DetectionModelPanel({ model, dirty = false, onChange }: DetectionModelPanelProps) {
  return (
    <Panel>
      <PanelTitleRow>
        <PanelTitle id="detection-model-heading">
          <Icon name="neurology" size={20} />
          Detection Model
        </PanelTitle>
        {dirty ? <UnsavedBadge>Unsaved</UnsavedBadge> : null}
      </PanelTitleRow>
      <Description>Select the neural engine for real-time inference.</Description>
      <RadioGroup
        name="detection-model"
        value={model}
        onChange={onChange}
        groupLabelId="detection-model-heading"
        options={[
          { value: "yolov8-precise", label: "YOLOv8 Precise (fine-tuned best.pt)", tag: "RECOMMENDED" },
          {
            value: "yolov8-nano",
            label: "YOLOv8 Nano (Ultralytics hub)",
            tag: "LOW LATENCY",
            tagMuted: true,
          },
        ]}
      />
    </Panel>
  );
}
