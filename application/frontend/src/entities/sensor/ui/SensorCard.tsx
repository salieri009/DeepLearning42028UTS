import styled from "styled-components";
import type { SensorSource } from "../model/types";
import { Icon } from "@/shared/ui";

type SensorCardProps = {
  source: SensorSource;
};

const Card = styled.article`
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.glass.fill};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.glow};
  transition: border-color 200ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.color.primary};
  }
`;

const Feed = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  background: ${({ theme }) => theme.color.bg};
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 50%, ${({ theme }) => theme.color.tint.scanlineBand} 51%);
    background-size: 100% 4px;
    pointer-events: none;
  }
`;

const FeedPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.color.surfaceHigh};
  opacity: 0.8;
`;

const StatusBadge = styled.span`
  position: absolute;
  top: ${({ theme }) => theme.spacing[2]};
  left: ${({ theme }) => theme.spacing[2]};
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.success};
  color: ${({ theme }) => theme.color.onSuccess};
  font-size: ${({ theme }) => theme.typography.size[1]};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
`;

const Pulse = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.textInverse};
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
`;

const FeedLabel = styled.span`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing[2]};
  left: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.textOnVideo};
  background: ${({ theme }) => theme.color.tint.labelBackdrop};
  padding: 2px ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.gradient.glassSheen};
`;

const Name = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.textPrimary};
`;

const Ip = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.textSecondary};
`;

const SettingsButton = styled.button`
  border: none;
  background: none;
  color: ${({ theme }) => theme.color.textSecondary};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color.primary};
  }
`;

export function SensorCard({ source }: SensorCardProps) {
  return (
    <Card>
      <Feed>
        <FeedPlaceholder />
        {source.connected && (
          <StatusBadge>
            <Pulse />
            CONNECTED
          </StatusBadge>
        )}
        <FeedLabel>{source.feedLabel}</FeedLabel>
      </Feed>
      <Footer>
        <div>
          <Name>{source.name}</Name>
          <Ip>IP: {source.ip}</Ip>
        </div>
        <SettingsButton
          type="button"
          disabled
          title="Coming soon"
          aria-label={`Settings for ${source.name} (coming soon)`}
        >
          <Icon name="settings" size={20} />
        </SettingsButton>
      </Footer>
    </Card>
  );
}
