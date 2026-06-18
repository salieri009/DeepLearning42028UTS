import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    height: 100%;
  }

  body {
    margin: 0;
    overflow-x: hidden;
    overflow-y: auto;
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

  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    display: inline-block;
    line-height: 1;
    user-select: none;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
