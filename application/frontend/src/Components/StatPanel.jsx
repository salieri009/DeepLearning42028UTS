import styled from "styled-components";

const Panel = styled.div`
  margin-top: 10px;
  padding: 12px;
  border: 1px solid #dddddd;
  background: #f3f3f3;
  border-radius: 8px;
  width: 720px;
  color: black;
`;

export default function StatPanel({ data }) {
  if (!data) return null;

  const personCount = data.persons?.length ?? 0;

  return (
    <>
    <h1>Crowd Tracking Statistics</h1>

    <Panel>
      <p><b>People:</b> {personCount}</p>
      <p><b>Crowd Density:</b> {data.crowd_density}</p>
      <p><b>Max Proximity Risk:</b> {data.max_proximity_risk}</p>
      <p><b>Recommendation:</b> {data.recommendation}</p>
    </Panel>

    </>
  );
}