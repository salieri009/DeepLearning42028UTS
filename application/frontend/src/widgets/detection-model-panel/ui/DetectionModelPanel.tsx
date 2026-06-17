import { Icon, RadioGroup } from "@/shared/ui";
import type { DetectionModel } from "@/entities/sensor";
import { GlassPanel } from "@/shared/ui";
import styled from "styled-components";

type DetectionModelPanelProps = {
  model: DetectionModel;
  onChange: (model: DetectionModel) => void;
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

const Description = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.color.textSecondary};
`;

export function DetectionModelPanel({ model, onChange }: DetectionModelPanelProps) {
  return (
    <Panel>
      <Title>
        <Icon name="neurology" size={22} />
        Detection Model
      </Title>
      <Description>Select the neural engine for real-time inference.</Description>
      <RadioGroup
        name="detection-model"
        value={model}
        onChange={onChange}
        options={[
          { value: "yolov8-precise", label: "YOLOv8 Precise (v8.2.1)", tag: "RECOMMENDED" },
          {
            value: "yolov8-nano",
            label: "YOLOv8 Nano (Ultra-Fast)",
            tag: "LOW LATENCY",
            tagMuted: true,
          },
          {
            value: "custom-onnx",
            label: "Custom ONNX Model",
            icon: <Icon name="upload" size={18} />,
          },
        ]}
      />
    </Panel>
  );
}
