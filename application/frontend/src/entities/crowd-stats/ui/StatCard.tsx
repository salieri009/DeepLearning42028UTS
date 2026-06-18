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
};

const badgeStyles = {
  safe: css`
    background: ${({ theme }) => theme.color.tint.success};
    color: ${({ theme }) => theme.color.neutral[100]};
  `,
  warning: css`
    background: ${({ theme }) => theme.color.warning};
    color: ${({ theme }) => theme.color.neutral[90]};
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

const Card = styled(GlassPanel)<{ $accent?: boolean }>`
  padding: ${({ theme }) => theme.spacing[4]};
  cursor: default;
  transition: background 120ms ease, box-shadow 120ms ease;
  ${({ $accent, theme }) =>
    $accent &&
    css`
      border-left: 3px solid ${theme.color.warning};
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
  padding: 2px ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.sm};
  ${({ $variant }) => badgeStyles[$variant]}
`;

const Label = styled.p`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.textSecondary};
`;

const Value = styled.p`
  font-size: ${({ theme }) => theme.typography.size[5]};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.textPrimary};
  margin-top: ${({ theme }) => theme.spacing[1]};

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
}: StatCardProps) {
  return (
    <Card $accent={accent}>
      <Header>
        <Icon name={icon} size={20} />
        {badge && <Badge $variant={badgeVariant}>{badge}</Badge>}
      </Header>
      <Label>{label}</Label>
      <Value>
        {value} {unit && <span>{unit}</span>}
      </Value>
    </Card>
  );
}
