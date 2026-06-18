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
  box-shadow: 0 0 ${({ theme }) => theme.spacing[3]} ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: box-shadow 120ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const LabelChip = styled.span<{ $color: string; $risk: string }>`
  position: absolute;
  top: calc(-1 * (${({ theme }) => theme.spacing[4]} + ${({ theme }) => theme.spacing[1]}));
  left: 0;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme, $risk }) =>
    $risk === "WARNING" ? theme.color.onWarning : theme.color.textInverse};
  background: ${({ $color }) => $color};
  padding: 0 ${({ theme }) => theme.spacing[2]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  border-radius: ${({ theme }) => theme.radius.sm};
  white-space: nowrap;

  &::before {
    content: "";
    position: absolute;
    inset: calc(-1 * ${({ theme }) => theme.spacing[1]});
    border-radius: inherit;
    background: ${({ theme }) => theme.color.glass.scrim};
    z-index: -1;
  }
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
      <LabelChip $color={color} $risk={risk}>
        {risk} {Math.round((person.confidence ?? 0) * 100)}%
      </LabelChip>
    </Box>
  );
}
