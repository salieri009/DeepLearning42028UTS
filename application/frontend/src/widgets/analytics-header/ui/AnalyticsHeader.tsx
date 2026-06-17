import styled from "styled-components";
import { ChromeText, GlassPanel, Icon } from "@/shared/ui";

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Subtitle = styled.p`
  margin: ${({ theme }) => theme.spacing[2]} 0 0;
  color: ${({ theme }) => theme.color.textSecondary};
`;

const Badges = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const Badge = styled(GlassPanel)`
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
`;

const LiveDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.success};
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
`;

export function AnalyticsHeader() {
  return (
    <Header>
      <div>
        <ChromeText style={{ fontSize: "32px", textTransform: "uppercase" }}>
          System Intelligence
        </ChromeText>
        <Subtitle>Real-time predictive risk analytics and facility throughput metrics.</Subtitle>
      </div>
      <Badges>
        <Badge style={{ color: "inherit" }}>
          <LiveDot />
          LIVE FEED ACTIVE
        </Badge>
        <Badge>
          <Icon name="calendar_today" size={18} />
          Last 24 Hours
        </Badge>
      </Badges>
    </Header>
  );
}
