import styled, { css } from "styled-components";
import { GlassPanel } from "@/shared/ui/GlassPanel";
import { Icon } from "@/shared/ui/Icon";

export type StatBadgeVariant = "safe" | "warning" | "danger" | "neutral";

type StatCardProps = {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  badge?: string;
  badgeVariant?: StatBadgeVariant;
  accent?: boolean;
  valueTone?: StatBadgeVariant;
  compact?: boolean;
};

const badgeStyles = {
  safe: css`
    background: ${({ theme }) => theme.color.tint.success};
    color: ${({ theme }) => theme.color.neutral[100]};
  `,
  warning: css`
    background: ${({ theme }) => theme.color.warning};
    color: ${({ theme }) => theme.color.onWarning};
  `,
  danger: css`
    background: ${({ theme }) => theme.color.danger};
    color: ${({ theme }) => theme.color.textInverse};
  `,
  neutral: css`
    background: ${({ theme }) => theme.color.tint.info};
    color: ${({ theme }) => theme.color.primary};
  `,
} satisfies Record<StatBadgeVariant, ReturnType<typeof css>>;

const Card = styled(GlassPanel)<{ $accent?: boolean; $compact?: boolean }>`
  padding: ${({ theme, $compact }) => ($compact ? theme.spacing[3] : theme.spacing[4])};
  cursor: default;
  transition: background 120ms ease, box-shadow 120ms ease;
  ${({ $accent, theme }) =>
    $accent &&
    css`
      border-left: ${theme.spacing[1]} solid ${theme.color.warning};
      background: ${theme.color.glass.fillStrong};
    `}

  &:hover {
    background: ${({ theme }) => theme.color.glass.fillStrong};
    box-shadow: ${({ theme }) => theme.shadow.glow};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Badge = styled.span<{ $variant: StatBadgeVariant }>`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  padding: 0 ${({ theme }) => theme.spacing[2]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  border-radius: ${({ theme }) => theme.radius.sm};
  ${({ $variant }) => badgeStyles[$variant]}
`;

const Label = styled.p`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.textSecondary};
`;

const Value = styled.p<{ $tone?: StatBadgeVariant; $compact?: boolean }>`
  font-size: ${({ theme, $compact }) =>
    $compact ? theme.typography.size[4] : theme.typography.size[5]};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme, $tone = "neutral" }) =>
    $tone === "safe"
      ? theme.color.success
      : $tone === "warning"
        ? theme.color.warning
        : $tone === "danger"
          ? theme.color.danger
          : theme.color.textPrimary};
  margin-top: ${({ theme }) => theme.spacing[1]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};

  span {
    font-size: ${({ theme }) => theme.typography.size[1]};
    font-weight: ${({ theme }) => theme.typography.weight.regular};
    color: ${({ theme }) => theme.color.textSecondary};
  }
`;

export function StatCard({
  icon,
  label,
  value,
  unit,
  badge,
  badgeVariant = "neutral",
  accent,
  valueTone,
  compact = false,
}: StatCardProps) {
  return (
    <Card $accent={accent} $compact={compact}>
      <Header>
        <Icon name={icon} size={20} />
        {badge && <Badge $variant={badgeVariant}>{badge}</Badge>}
      </Header>
      <Label>{label}</Label>
      <Value $tone={valueTone ?? badgeVariant} $compact={compact}>
        {value} {unit && <span>{unit}</span>}
      </Value>
    </Card>
  );
}
