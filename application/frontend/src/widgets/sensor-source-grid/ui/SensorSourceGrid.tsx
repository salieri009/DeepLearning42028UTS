import styled from "styled-components";
import type { SensorSource } from "@/entities/sensor";
import { SensorCard } from "@/entities/sensor";
import { Icon } from "@/shared/ui";

type SensorSourceGridProps = {
  sources: SensorSource[];
};

const Section = styled.section``;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Title = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.size[4]};
  color: ${({ theme }) => theme.color.primary};
`;

const AddLink = styled.button`
  border: none;
  background: none;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.info[60]};
  cursor: not-allowed;
  opacity: 0.6;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export function SensorSourceGrid({ sources }: SensorSourceGridProps) {
  return (
    <Section>
      <Header>
        <Title>
          <Icon name="videocam" size={22} />
          Sensor Sources
        </Title>
        <AddLink type="button" disabled title="Coming soon" aria-label="Add Source (coming soon)">
          Add Source
        </AddLink>
      </Header>
      <Grid>
        {sources.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.7 }}>No active webcam sessions yet. Start the dashboard camera to register a source.</p>
        ) : null}
        {sources.map((source) => (
          <SensorCard key={source.id} source={source} />
        ))}
      </Grid>
    </Section>
  );
}
