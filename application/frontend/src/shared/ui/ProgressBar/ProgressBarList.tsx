import styled from "styled-components";
import { ChromeText } from "../ChromeText";
import { GlassPanel } from "../GlassPanel";
import { Icon } from "../Icon";

export type ProgressBarItem = {
  name: string;
  level: string;
  percent: number;
  variant: "danger" | "warning" | "safe";
};

type ProgressBarListProps = {
  title: string;
  items: ProgressBarItem[];
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

const Track = styled.div`
  height: 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.color.glass.fill};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  overflow: hidden;
`;

const Fill = styled.div<{ $percent: number; $variant: ProgressBarItem["variant"] }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $variant }) => {
    if ($variant === "danger") return theme.color.danger;
    if ($variant === "warning") return theme.color.warning;
    return theme.color.success;
  }};
`;

const Level = styled.span<{ $variant: ProgressBarItem["variant"] }>`
  color: ${({ theme, $variant }) => {
    if ($variant === "danger") return theme.color.danger;
    if ($variant === "warning") return theme.color.warning;
    return theme.color.success;
  }};
`;

export function ProgressBarList({ title, items }: ProgressBarListProps) {
  return (
    <Card>
      <Header>
        <Title>{title}</Title>
        <Icon name="info" size={20} />
      </Header>
      <List>
        {items.map((item) => (
          <Row key={item.name}>
            <RowHeader>
              <span>{item.name.toUpperCase()}</span>
              <Level $variant={item.variant}>{item.level}</Level>
            </RowHeader>
            <Track>
              <Fill $percent={item.percent} $variant={item.variant} />
            </Track>
          </Row>
        ))}
      </List>
    </Card>
  );
}
