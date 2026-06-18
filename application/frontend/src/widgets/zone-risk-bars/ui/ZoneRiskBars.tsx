import styled from "styled-components";
import type { ZoneRisk } from "@/entities/analytics";
import { ChromeText, GlassPanel, Icon } from "@/shared/ui";

type ZoneRiskBarsProps = {
  zones: ZoneRisk[];
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

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const RowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
`;

const ZoneName = styled.span`
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.textPrimary};
`;

const ZoneLevel = styled.span<{ $level: ZoneRisk["level"] }>`
  color: ${({ theme, $level }) => {
    if ($level === "HIGH RISK") return theme.color.danger;
    if ($level === "MODERATE") return theme.color.warning;
    return theme.color.success;
  }};
`;

const Track = styled.div`
  height: 12px;
  width: 100%;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.color.glass.fill};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  overflow: hidden;
`;

const Fill = styled.div<{ $percent: number; $level: ZoneRisk["level"] }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $level }) => {
    if ($level === "HIGH RISK") return theme.color.danger;
    if ($level === "MODERATE") return theme.color.warning;
    return theme.color.success;
  }};
`;

function levelVariant(level: ZoneRisk["level"]) {
  return level;
}

const SyntheticNote = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.textSecondary};
  font-family: ${({ theme }) => theme.typography.family.mono};
`;

export function ZoneRiskBars({ zones }: ZoneRiskBarsProps) {
  const hasSynthetic = zones.some((zone) => zone.synthetic);

  return (
    <Card>
      <Header>
        <Title>Session Source Breakdown</Title>
        <Icon name="info" size={20} />
      </Header>
      {hasSynthetic ? (
        <SyntheticNote>
          Grouped by session source type — not geographic zones. Values are from stored frame
          aggregates.
        </SyntheticNote>
      ) : null}
      <List>
        {zones.map((zone) => (
          <Row key={zone.name}>
            <RowHeader>
              <ZoneName>{zone.name}</ZoneName>
              <ZoneLevel $level={zone.level}>{zone.level}</ZoneLevel>
            </RowHeader>
            <Track>
              <Fill $percent={zone.percent} $level={levelVariant(zone.level)} />
            </Track>
          </Row>
        ))}
      </List>
    </Card>
  );
}
