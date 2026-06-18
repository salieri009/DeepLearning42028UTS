import styled from "styled-components";
import { GlassPanel, Icon, LiveStatusDot, PageChromeTitle } from "@/shared/ui";

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

const LiveBadge = styled(Badge)`
  color: ${({ theme }) => theme.color.success};
`;

export function AnalyticsHeader() {
  return (
    <Header>
      <div>
        <PageChromeTitle as="h1">System Intelligence</PageChromeTitle>
        <Subtitle>Real-time predictive risk analytics and facility throughput metrics.</Subtitle>
      </div>
      <Badges>
        <LiveBadge>
          <LiveStatusDot $live />
          LIVE FEED ACTIVE
        </LiveBadge>
        <Badge>
          <Icon name="calendar_today" size={18} />
          Last 24 Hours
        </Badge>
      </Badges>
    </Header>
  );
}
