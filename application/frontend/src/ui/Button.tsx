import styled, { css } from "styled-components";

export type ButtonVariant = "primary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  $variant?: ButtonVariant;
  $size?: ButtonSize;
  $fullWidth?: boolean;
};

const sizeStyles = {
  sm: css`
    padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
    font-size: ${({ theme }) => theme.typography.size[2]};
  `,
  md: css`
    padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
    font-size: ${({ theme }) => theme.typography.size[3]};
  `,
  lg: css`
    padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[5]}`};
    font-size: ${({ theme }) => theme.typography.size[3]};
  `,
} satisfies Record<ButtonSize, ReturnType<typeof css>>;

const variantStyles = {
  primary: css`
    background: ${({ theme }) => theme.color.primary};
    border-color: ${({ theme }) => theme.color.primary};
    color: ${({ theme }) => theme.color.textInverse};

    &:hover {
      background: ${({ theme }) => theme.color.primaryHover};
      border-color: ${({ theme }) => theme.color.primaryHover};
    }
  `,
  danger: css`
    background: ${({ theme }) => theme.color.danger};
    border-color: ${({ theme }) => theme.color.danger};
    color: ${({ theme }) => theme.color.textInverse};

    &:hover {
      background: ${({ theme }) => theme.color.dangerHover};
      border-color: ${({ theme }) => theme.color.dangerHover};
    }
  `,
  ghost: css`
    background: transparent;
    border-color: ${({ theme }) => theme.color.borderSubtle};
    color: ${({ theme }) => theme.color.textPrimary};

    &:hover {
      background: ${({ theme }) => theme.color.surfaceSubtle};
    }
  `,
} satisfies Record<ButtonVariant, ReturnType<typeof css>>;

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};

  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid transparent;

  cursor: pointer;
  user-select: none;
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;

  ${({ $size = "md" }) => sizeStyles[$size]}
  ${({ $variant = "primary" }) => variantStyles[$variant]}

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

