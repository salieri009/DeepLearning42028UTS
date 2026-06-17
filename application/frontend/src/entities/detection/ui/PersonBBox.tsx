import { useTheme } from "styled-components";
import styled from "styled-components";
import type { PersonDetection } from "../model/types";
import { getRiskColor } from "../lib/getRiskColor";

type PersonBBoxProps = {
  person: PersonDetection;
};

const Box = styled.div<{ $color: string }>`
  position: absolute;
  box-sizing: border-box;
  border: 2px solid ${({ $color }) => $color};
  box-shadow: 0 0 10px ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const LabelChip = styled.span<{ $color: string }>`
  position: absolute;
  top: -28px;
  left: 0;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.color.textInverse};
  background: ${({ $color }) => $color};
  padding: 2px ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.sm};
  white-space: nowrap;
`;

export function PersonBBox({ person }: PersonBBoxProps) {
  const theme = useTheme();
  const b = person.bbox;
  const risk = person.proximity_risk ?? "SAFE";
  const color = getRiskColor(theme, risk);

  return (
    <Box
      $color={color}
      style={{
        left: `${(b.x_center - b.width / 2) * 100}%`,
        top: `${(b.y_center - b.height / 2) * 100}%`,
        width: `${b.width * 100}%`,
        height: `${b.height * 100}%`,
      }}
    >
      <LabelChip $color={color}>
        {risk} {Math.round((person.confidence ?? 0) * 100)}%
      </LabelChip>
    </Box>
  );
}
