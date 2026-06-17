import styled from "styled-components";

export const HudButton = styled.button<{ $active?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.color.primary : theme.color.glass.border)};
  background: ${({ theme, $active }) =>
    $active ? theme.color.glass.fillStrong : theme.color.glass.fill};
  color: ${({ theme, $active }) => ($active ? theme.color.primary : theme.color.textPrimary)};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.glass.fillStrong};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.focus};
    outline-offset: 2px;
  }
`;
