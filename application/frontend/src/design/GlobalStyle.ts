import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body {
    height: 100%;
  }

  body {
    margin: 0;
    font-family: ${({ theme }) => theme.typography.family.sans};
    font-size: ${({ theme }) => theme.typography.size[3]};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
    background: ${({ theme }) => theme.color.bg};
    color: ${({ theme }) => theme.color.textPrimary};
  }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.focus};
    outline-offset: 2px;
  }

  h1, h2, h3, h4 {
    margin: 0;
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  }

  p {
    margin: 0;
  }

  button {
    font-family: inherit;
  }
`;

