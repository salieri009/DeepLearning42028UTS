import styled, { css } from "styled-components";

export type CardVariant = "opaque" | "glass";

type CardProps = {
  $variant?: CardVariant;
};

const opaqueStyles = css`
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.borderSubtle};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

const glassStyles = css`
  background: ${({ theme }) => theme.color.glass.fill};
  backdrop-filter: blur(12px) saturate(120%);
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.glass}, inset 0 1px 0 ${({ theme }) => theme.color.glass.highlight};
`;

export const Card = styled.section<CardProps>`
  ${({ $variant = "opaque" }) => ($variant === "glass" ? glassStyles : opaqueStyles)}
`;

export const CardHeader = styled.header<{ $chrome?: boolean }>`
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.color.glass.border};

  ${({ $chrome, theme }) =>
    $chrome &&
    css`
      background: ${theme.gradient.chrome};
      -webkit-background-clip: text;
      background-clip: text;
    `}
`;

export const CardBody = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;
