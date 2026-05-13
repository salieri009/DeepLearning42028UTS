import styled from "styled-components";
import type { AnalyzeFrameResponse } from "../../types";
import { Card, CardBody, CardHeader } from "../../ui/Card";
import { Label, SectionTitle, Text } from "../../ui/Typography";

type StatPanelProps = {
  data: AnalyzeFrameResponse | null;
};

const StatList = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: ${({ theme }) => theme.spacing[4]};
  row-gap: ${({ theme }) => theme.spacing[3]};
  margin: 0;

  dt,
  dd {
    margin: 0;
  }

  dd {
    justify-self: end;
  }
`;

export default function StatPanel({ data }: StatPanelProps) {
  if (!data) return null;

  const personCount = data.persons?.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <SectionTitle>Crowd Tracking Statistics</SectionTitle>
      </CardHeader>
      <CardBody>
        <StatList>
          <dt>
            <Label>People</Label>
          </dt>
          <dd>
            <Text>{personCount}</Text>
          </dd>

          <dt>
            <Label>Crowd Density</Label>
          </dt>
          <dd>
            <Text>{data.crowd_density}</Text>
          </dd>

          <dt>
            <Label>Max Proximity Risk</Label>
          </dt>
          <dd>
            <Text>{data.max_proximity_risk}</Text>
          </dd>

          <dt>
            <Label>Recommendation</Label>
          </dt>
          <dd>
            <Text>{data.recommendation}</Text>
          </dd>
        </StatList>
      </CardBody>
    </Card>
  );
}

