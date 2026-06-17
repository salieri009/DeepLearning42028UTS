import styled from "styled-components";

export const ChromeText = styled.span`
  background: ${({ theme }) => theme.gradient.chrome};
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: ${({ theme }) => theme.typography.weight.bold};
`;
