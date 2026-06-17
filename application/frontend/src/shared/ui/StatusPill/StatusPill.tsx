import styled, { css } from "styled-components";

type StatusPillProps = {
  $live?: boolean;
};

const Pill = styled.div<StatusPillProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.color.glass.fill};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.full};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
`;

const Dot = styled.span<{ $live: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $live }) => ($live ? theme.color.success : theme.color.textSecondary)};
  ${({ $live }) =>
    $live &&
    css`
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `}
`;

const Text = styled.span`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.textPrimary};
`;

type Props = {
  live?: boolean;
  label?: string;
};

export function StatusPill({ live = false, label }: Props) {
  const text = label ?? (live ? "SYSTEM READY // LIVE" : "SYSTEM IDLE");
  return (
    <Pill $live={live}>
      <Dot $live={live} />
      <Text>{text}</Text>
    </Pill>
  );
}
