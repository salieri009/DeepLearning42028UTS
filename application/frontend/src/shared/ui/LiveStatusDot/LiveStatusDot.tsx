import styled, { keyframes } from "styled-components";

const pulse = keyframes`
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
`;

export const LiveStatusDot = styled.span<{ $live?: boolean; $tone?: "success" | "primary" | "muted" }>`
  width: ${({ theme }) => theme.spacing[2]};
  height: ${({ theme }) => theme.spacing[2]};
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ theme, $live, $tone }) => {
    if ($tone === "primary") return theme.color.primary;
    if ($tone === "muted") return theme.color.textSecondary;
    return $live ? theme.color.success : theme.color.textSecondary;
  }};
  animation: ${({ $live, $tone }) =>
    $live || $tone === "primary" ? pulse : "none"} 2s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
