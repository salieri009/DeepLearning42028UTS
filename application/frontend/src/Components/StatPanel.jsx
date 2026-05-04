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

  return (
    <>
    <h1>Crowd Tracking Statistics</h1>

    <Panel>
      <p><b>People:</b> {data.people}</p>
      <p><b>Confidence:</b> {data.confidence}</p>
      <p><b>Density:</b> {data.density}</p>
      <p><b>Risk:</b> {data.risk}</p>
    </Panel>

    </>
  );
}