import styled from "styled-components";

export const GlassPanel = styled.div`
  backdrop-filter: blur(12px) saturate(120%);
  background: ${({ theme }) => theme.color.glass.fill};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.glass};
`;
