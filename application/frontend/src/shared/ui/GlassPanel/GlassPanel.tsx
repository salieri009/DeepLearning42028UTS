import styled from "styled-components";

export const GlassPanel = styled.div`
  backdrop-filter: blur(${({ theme }) => theme.effects.glassBlur}) saturate(${({ theme }) => theme.effects.glassSaturation});
  background: ${({ theme }) => theme.color.glass.fill};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.glass}, inset 0 1px 0 ${({ theme }) => theme.color.glass.highlight};
`;
