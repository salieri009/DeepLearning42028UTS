import { useEffect, useId, useState } from "react";
import styled, { useTheme } from "styled-components";
import { ChromeText, GlassPanel, Icon } from "@/shared/ui";

type WeeklySafetyGaugeProps = {
  score: number;
  label: string;
  trendPercent: number;
  eventCount: number;
};

const Card = styled(GlassPanel)`
  height: ${({ theme }) => theme.layout.analyticsPanelHeight};
  padding: ${({ theme }) => theme.spacing[6]};
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.glow};
`;

const Title = styled(ChromeText)`
  font-size: ${({ theme }) => theme.typography.size[4]};
  text-transform: uppercase;
  font-style: italic;
  border-top: ${({ theme }) => theme.spacing[1]} solid ${({ theme }) => theme.color.glass.highlight};
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
  font-size: ${({ theme }) => theme.typography.size.display};
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

const ProgressRing = styled.circle`
  color: ${({ theme }) => theme.color.primary};
`;

export function WeeklySafetyGauge({
  score,
  label,
  trendPercent,
  eventCount,
}: WeeklySafetyGaugeProps) {
  const theme = useTheme();
  const [displayScore, setDisplayScore] = useState(0);
  const scoreId = useId();
  const labelId = useId();

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
      <Title>Weekly Safety Score</Title>
      <GaugeArea>
        <svg
          width={256}
          height={256}
          style={{ transform: "rotate(-90deg)" }}
          role="img"
          aria-labelledby={`${scoreId} ${labelId}`}
        >
          <circle
            cx={128}
            cy={128}
            r={RADIUS}
            fill="transparent"
            stroke={theme.color.gaugeTrack}
            strokeWidth={12}
          />
          <ProgressRing
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
          <Score id={scoreId}>{displayScore}</Score>
          <ScoreLabel id={labelId}>{label}</ScoreLabel>
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
