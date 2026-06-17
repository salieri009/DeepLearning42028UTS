import { useEffect, useState } from "react";
import styled from "styled-components";
import { ChromeText } from "../ChromeText";
import { GlassPanel } from "../GlassPanel";
import { Icon } from "../Icon";

type RadialGaugeProps = {
  score: number;
  label: string;
  trendPercent: number;
  eventCount: number;
  title?: string;
};

const Card = styled(GlassPanel)`
  height: 520px;
  padding: ${({ theme }) => theme.spacing[6]};
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.shadow.glow};
`;

const Title = styled(ChromeText)`
  font-size: ${({ theme }) => theme.typography.size[4]};
  text-transform: uppercase;
  font-style: italic;
  border-top: 2px solid ${({ theme }) => theme.color.glass.highlight};
  padding-top: ${({ theme }) => theme.spacing[4]};
`;

const GaugeArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const Score = styled.span`
  font-size: 64px;
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.color.textPrimary};
  line-height: 1;
`;

const ScoreLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.info[60]};
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const ScoreCenter = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Footer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const StatBox = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.glass.fill};
`;

const StatLabel = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.textSecondary};
`;

const StatValue = styled.p<{ $success?: boolean }>`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.size[4]};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme, $success }) => ($success ? theme.color.success : theme.color.textPrimary)};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const CIRCUMFERENCE = 691;
const RADIUS = 110;

export function RadialGauge({
  score,
  label,
  trendPercent,
  eventCount,
  title = "Weekly Safety Score",
}: RadialGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayScore(Math.floor(progress * score));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score]);

  const offset = CIRCUMFERENCE - (displayScore / 100) * CIRCUMFERENCE;

  return (
    <Card>
      <Title>{title}</Title>
      <GaugeArea>
        <svg width={256} height={256} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={128}
            cy={128}
            r={RADIUS}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={12}
            style={{ color: "rgba(255,255,255,0.05)" }}
          />
          <circle
            cx={128}
            cy={128}
            r={RADIUS}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={12}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <ScoreCenter>
          <Score>{displayScore}</Score>
          <ScoreLabel>{label}</ScoreLabel>
        </ScoreCenter>
      </GaugeArea>
      <Footer>
        <StatBox>
          <StatLabel>Trend</StatLabel>
          <StatValue $success>
            <Icon name="trending_up" size={18} />+{trendPercent}%
          </StatValue>
        </StatBox>
        <StatBox>
          <StatLabel>Events</StatLabel>
          <StatValue>{eventCount}</StatValue>
        </StatBox>
      </Footer>
    </Card>
  );
}
