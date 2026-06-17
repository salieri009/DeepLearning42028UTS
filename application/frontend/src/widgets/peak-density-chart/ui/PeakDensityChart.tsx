import styled from "styled-components";
import type { PeakHour } from "@/entities/analytics";
import { ChromeText, GlassPanel } from "@/shared/ui";

type PeakDensityChartProps = {
  hours: PeakHour[];
  busiestWindow: string;
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
  padding: 0 ${({ theme }) => theme.spacing[2]};
`;

const Bar = styled.div<{ $height: number; $peak?: boolean }>`
  flex: 1;
  position: relative;
  height: ${({ $height }) => $height}%;
  border-radius: ${({ theme }) => theme.radius.sm} ${({ theme }) => theme.radius.sm} 0 0;
  background: ${({ theme, $peak }) => ($peak ? theme.gradient.aqua : theme.color.glass.fill)};
  box-shadow: ${({ theme, $peak }) => ($peak ? theme.shadow.glow : "none")};
  transition: filter 120ms ease;

  &:hover {
    filter: brightness(1.1);
  }
`;

const BarLabel = styled.span<{ $peak?: boolean }>`
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: 10px;
  color: ${({ theme, $peak }) => ($peak ? theme.color.primary : theme.color.textSecondary)};
  font-weight: ${({ $peak, theme }) => ($peak ? theme.typography.weight.bold : theme.typography.weight.medium)};
  white-space: nowrap;
`;

export function PeakDensityChart({ hours, busiestWindow }: PeakDensityChartProps) {
  return (
    <Card>
      <Header>
        <Title>Peak Density Times</Title>
        <Badge>Busiest: {busiestWindow}</Badge>
      </Header>
      <Chart>
        {hours.map((hour) => (
          <Bar key={hour.label} $height={hour.heightPercent} $peak={hour.peak}>
            <BarLabel $peak={hour.peak}>{hour.label}</BarLabel>
          </Bar>
        ))}
      </Chart>
    </Card>
  );
}
