import styled, { css } from "styled-components";

export type TextTone = "primary" | "secondary";

type TextProps = {
  $tone?: TextTone;
};

const toneStyles = {
  primary: css`
    color: ${({ theme }) => theme.color.textPrimary};
  `,
  secondary: css`
    color: ${({ theme }) => theme.color.textSecondary};
  `,
} satisfies Record<TextTone, ReturnType<typeof css>>;

export const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.size[5]};
`;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.size[4]};
`;

export const Text = styled.p<TextProps>`
  font-size: ${({ theme }) => theme.typography.size[3]};
  ${({ $tone = "primary" }) => toneStyles[$tone]}
`;

export const Label = styled.span<TextProps>`
  font-size: ${({ theme }) => theme.typography.size[2]};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  ${({ $tone = "primary" }) => toneStyles[$tone]}
`;

export const Mono = styled.span<TextProps>`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  ${({ $tone = "primary" }) => toneStyles[$tone]}
`;

