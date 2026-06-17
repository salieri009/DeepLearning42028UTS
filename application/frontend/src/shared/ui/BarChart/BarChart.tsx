import styled from "styled-components";
import { ChromeText } from "../ChromeText";
import { GlassPanel } from "../GlassPanel";

export type BarChartItem = {
  label: string;
  heightPercent: number;
  peak?: boolean;
};

type BarChartProps = {
  title: string;
  items: BarChartItem[];
  badge?: string;
};

const Card = styled(GlassPanel)`
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadow.glow};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  border-top: 2px solid ${({ theme }) => theme.color.glass.highlight};
  padding-top: ${({ theme }) => theme.spacing[4]};
`;

const Title = styled(ChromeText)`
  font-size: ${({ theme }) => theme.typography.size[4]};
  text-transform: uppercase;
  font-style: italic;
`;

const Badge = styled.span`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.info[60]};
  background: ${({ theme }) => theme.color.info[60]}1a;
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radius.full};
`;

const Chart = styled.div`
  height: 192px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Bar = styled.div<{ $height: number; $peak?: boolean }>`
  flex: 1;
  position: relative;
  height: ${({ $height }) => $height}%;
  border-radius: ${({ theme }) => theme.radius.sm} ${({ theme }) => theme.radius.sm} 0 0;
  background: ${({ theme, $peak }) => ($peak ? theme.gradient.aqua : theme.color.glass.fill)};
  box-shadow: ${({ theme, $peak }) => ($peak ? theme.shadow.glow : "none")};
`;

const BarLabel = styled.span<{ $peak?: boolean }>`
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: 10px;
  color: ${({ theme, $peak }) => ($peak ? theme.color.primary : theme.color.textSecondary)};
  font-weight: ${({ $peak, theme }) =>
    $peak ? theme.typography.weight.bold : theme.typography.weight.medium};
  white-space: nowrap;
`;

export function BarChart({ title, items, badge }: BarChartProps) {
  return (
    <Card>
      <Header>
        <Title>{title}</Title>
        {badge && <Badge>{badge}</Badge>}
      </Header>
      <Chart>
        {items.map((item) => (
          <Bar key={item.label} $height={item.heightPercent} $peak={item.peak}>
            <BarLabel $peak={item.peak}>{item.label}</BarLabel>
          </Bar>
        ))}
      </Chart>
    </Card>
  );
}
