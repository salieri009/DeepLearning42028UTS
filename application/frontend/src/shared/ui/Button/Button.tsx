import styled, { css } from "styled-components";

export type ButtonVariant = "primary" | "danger" | "ghost" | "glass";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  $variant?: ButtonVariant;
  $size?: ButtonSize;
  $fullWidth?: boolean;
  $pill?: boolean;
};

const sizeStyles = {
  sm: css`
    padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
    font-size: ${({ theme }) => theme.typography.size[2]};
    min-height: ${({ theme }) => theme.spacing[7]};
  `,
  md: css`
    padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
    font-size: ${({ theme }) => theme.typography.size[2]};
    min-height: ${({ theme }) => theme.spacing[7]};
  `,
  lg: css`
    padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[5]}`};
    font-size: ${({ theme }) => theme.typography.size[3]};
    min-height: ${({ theme }) => theme.spacing[7]};
  `,
} satisfies Record<ButtonSize, ReturnType<typeof css>>;

const variantStyles = {
  primary: css`
    background: ${({ theme }) => theme.gradient.aqua};
    border-color: ${({ theme }) => theme.color.primary};
    color: ${({ theme }) => theme.color.textInverse};
    box-shadow: ${({ theme }) => theme.shadow.md};
    position: relative;
    overflow: hidden;

    &::after {
      content: "";
      position: absolute;
      inset: 0 0 55% 0;
      background: ${({ theme }) => theme.gradient.glassSheen};
      pointer-events: none;
    }

    &:hover:not(:disabled) {
      filter: brightness(1.08);
    }

    @media (prefers-reduced-motion: reduce) {
      &::after {
        display: none;
      }
    }
  `,
  danger: css`
    background: ${({ theme }) => theme.color.danger};
    border-color: ${({ theme }) => theme.color.danger};
    color: ${({ theme }) => theme.color.textInverse};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.color.dangerHover};
      border-color: ${({ theme }) => theme.color.dangerHover};
    }
  `,
  ghost: css`
    background: transparent;
    border-color: transparent;
    color: ${({ theme }) => theme.color.textSecondary};

    &:hover:not(:disabled) {
      color: ${({ theme }) => theme.color.primary};
      background: ${({ theme }) => theme.color.glass.fill};
    }
  `,
  glass: css`
    background: ${({ theme }) => theme.color.glass.fill};
    backdrop-filter: blur(12px) saturate(120%);
    border-color: ${({ theme }) => theme.color.glass.border};
    color: ${({ theme }) => theme.color.textPrimary};
    box-shadow: ${({ theme }) => theme.shadow.glow};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.color.glass.fillStrong};
    }
  `,
} satisfies Record<ButtonVariant, ReturnType<typeof css>>;

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  position: relative;

  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  border-radius: ${({ $pill, theme }) => ($pill ? theme.radius.full : theme.radius.md)};
  border: 1px solid transparent;

  cursor: pointer;
  user-select: none;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease, filter 120ms ease;

  ${({ $size = "md" }) => sizeStyles[$size]}
  ${({ $variant = "primary" }) => variantStyles[$variant]}

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.focus};
    outline-offset: 2px;
  }
`;
