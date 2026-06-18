import styled from "styled-components";
import type { FrameItem, SessionDetailResponse } from "@/entities/session";
import { formatSessionDuration } from "@/entities/session";
import type { SessionPreviewStats } from "@/features/session-archive/model/useSessionPreview";
import { Button, GlassPanel, Icon } from "@/shared/ui";

type SessionPreviewProps = {
  session: SessionDetailResponse | null;
  loading: boolean;
  stats: SessionPreviewStats | null;
  frames?: FrameItem[];
  statsError?: string | null;
  onGenerateReport?: () => void;
  reportDisabled?: boolean;
};

const Panel = styled(GlassPanel)`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.glow};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.glass.scrim};
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.color.textPrimary};
`;

const SessionId = styled.span`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.primary};
`;

const PreviewArea = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;

const Thumbnail = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.glass.fill};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PlayButton = styled.div`
  width: ${({ theme }) => theme.spacing[7]};
  height: ${({ theme }) => theme.spacing[7]};
  border-radius: 50%;
  background: ${({ theme }) => theme.gradient.aqua};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.color.textInverse};
  box-shadow: ${({ theme }) => theme.shadow.glow};
  border: 1px solid ${({ theme }) => theme.color.primary};
`;

const SegmentBadge = styled.span`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing[2]};
  left: ${({ theme }) => theme.spacing[2]};
  padding: 2px ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.danger};
  color: ${({ theme }) => theme.color.textInverse};
  font-size: ${({ theme }) => theme.typography.size[1]};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
`;

const Stats = styled.div`
  padding: 0 ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const StatCard = styled.div`
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.surfaceSubtle};
`;

const StatLabel = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing[1]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.textSecondary};
`;

const StatValue = styled.p<{ $warning?: boolean }>`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.size[4]};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme, $warning }) => ($warning ? theme.color.warning : theme.color.textPrimary)};
`;

const ThreatBar = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.surfaceSubtle};
`;

const BarTrack = styled.div`
  display: flex;
  height: 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  overflow: hidden;
  background: ${({ theme }) => theme.color.surfaceHigh};
`;

const BarSegment = styled.div<{ $width: number; $colorKey: "success" | "warning" | "danger" }>`
  width: ${({ $width }) => $width}%;
  background: ${({ theme, $colorKey }) => {
    if ($colorKey === "danger") return theme.color.danger;
    if ($colorKey === "warning") return theme.color.warning;
    return theme.color.success;
  }};
`;

const SafeLabel = styled.span`
  color: ${({ theme }) => theme.color.success};
`;

const WarnLabel = styled.span`
  color: ${({ theme }) => theme.color.warning};
`;

const DangerLabel = styled.span`
  color: ${({ theme }) => theme.color.danger};
`;

const BarLegend = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
`;

const EmptyState = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
  color: ${({ theme }) => theme.color.textSecondary};
  font-family: ${({ theme }) => theme.typography.family.mono};
`;

const FrameTrail = styled.div`
  padding: 0 ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[4]};
`;

const FrameList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const FrameRow = styled.li`
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  border-bottom: 1px solid ${({ theme }) => theme.color.glass.border};

  &:last-child {
    border-bottom: none;
  }
`;

const RiskTag = styled.span<{ $risk: string }>`
  color: ${({ theme, $risk }) => {
    if ($risk === "DANGER") return theme.color.danger;
    if ($risk === "WARNING") return theme.color.warning;
    return theme.color.success;
  }};
`;

function formatDensityLabel(maxCrowdDensity: number, frameCount: number): string {
  if (maxCrowdDensity > 0) return `${maxCrowdDensity} persons`;
  if (frameCount > 0) return `${frameCount} frames`;
  return "—";
}

export function SessionPreview({
  session,
  loading,
  stats,
  frames = [],
  statsError,
  onGenerateReport,
  reportDisabled = true,
}: SessionPreviewProps) {
  if (loading) {
    return (
      <Panel>
        <EmptyState>Loading preview...</EmptyState>
      </Panel>
    );
  }

  if (!session) {
    return (
      <Panel>
        <EmptyState>Select a session to preview.</EmptyState>
      </Panel>
    );
  }

  const threat = stats?.threat ?? { safe: 100, warn: 0, danger: 0 };
  const densityLabel = formatDensityLabel(stats?.maxCrowdDensity ?? 0, session.frame_count);
  const anomalies = stats?.anomalies ?? 0;
  const segmentLabel = formatSessionDuration(session.started_at, session.ended_at);

  return (
    <Panel>
      <Header>
        <HeaderTitle>Selected Preview</HeaderTitle>
        <SessionId>ID: SESSION_{session.id}</SessionId>
      </Header>

      {statsError ? <EmptyState>{statsError}</EmptyState> : null}

      <PreviewArea>
        <Thumbnail>
          <PlayButton>
            <Icon name="play_arrow" size={24} />
          </PlayButton>
          <SegmentBadge>{segmentLabel}</SegmentBadge>
        </Thumbnail>
      </PreviewArea>

      <Stats>
        <StatGrid>
          <StatCard>
            <StatLabel>Max Crowd Density</StatLabel>
            <StatValue>{densityLabel}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Anomalies</StatLabel>
            <StatValue $warning={anomalies > 0}>
              {String(anomalies).padStart(2, "0")}
            </StatValue>
          </StatCard>
        </StatGrid>

        <ThreatBar>
          <StatLabel>Threat Distribution</StatLabel>
          <BarTrack>
            <BarSegment $width={threat.safe} $colorKey="success" />
            <BarSegment $width={threat.warn} $colorKey="warning" />
            <BarSegment $width={threat.danger} $colorKey="danger" />
          </BarTrack>
          <BarLegend>
            <SafeLabel>{threat.safe}% SAFE</SafeLabel>
            <WarnLabel>{threat.warn}% WARN</WarnLabel>
            <DangerLabel>{threat.danger}% DNG</DangerLabel>
          </BarLegend>
        </ThreatBar>

        <FrameTrail>
          <StatLabel>Frame Trail ({frames.length})</StatLabel>
          {frames.length === 0 ? (
            <EmptyState style={{ padding: "12px" }}>No persisted frames yet.</EmptyState>
          ) : (
            <FrameList>
              {frames.map((frame) => (
                <FrameRow key={frame.id}>
                  <span>#{frame.sequence_no}</span>
                  <span>
                    {frame.person_count} persons · {frame.crowd_density}
                  </span>
                  <RiskTag $risk={frame.max_proximity_risk}>{frame.max_proximity_risk}</RiskTag>
                </FrameRow>
              ))}
            </FrameList>
          )}
        </FrameTrail>

        <Button
          type="button"
          $variant="ghost"
          $fullWidth
          disabled={reportDisabled}
          onClick={onGenerateReport}
          aria-label="Generate full session report"
          title={reportDisabled ? "Select a session first" : "Open printable HTML report"}
        >
          Generate Full PDF Report
        </Button>
      </Stats>
    </Panel>
  );
}
