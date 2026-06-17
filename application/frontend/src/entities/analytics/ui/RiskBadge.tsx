import styled from "styled-components";
import type { RiskLevel } from "../model/types";

type RiskBadgeProps = {
  risk: RiskLevel | null | undefined;
};

const Badge = styled.span<{ $risk: RiskLevel }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  font-family: ${({ theme }) => theme.typography.family.mono};
  border: 1px solid
    ${({ theme, $risk }) => {
      if ($risk === "DANGER") return theme.color.danger;
      if ($risk === "WARNING") return theme.color.warning;
      return theme.color.success;
    }};
  color: ${({ theme, $risk }) => {
    if ($risk === "DANGER") return theme.color.danger;
    if ($risk === "WARNING") return theme.color.warning;
    return theme.color.success;
  }};
  background: ${({ theme, $risk }) => {
    if ($risk === "DANGER") return `${theme.color.danger}33`;
    if ($risk === "WARNING") return `${theme.color.warning}33`;
    return `${theme.color.success}33`;
  }};
`;

function label(risk: RiskLevel | null | undefined): string {
  if (risk === "DANGER") return "CRITICAL";
  if (risk === "WARNING") return "CAUTION";
  if (risk === "SAFE") return "NOMINAL";
  return "UNKNOWN";
}

export function RiskBadge({ risk }: RiskBadgeProps) {
  const variant: RiskLevel = risk ?? "SAFE";
  return <Badge $risk={variant}>{label(risk)}</Badge>;
}
