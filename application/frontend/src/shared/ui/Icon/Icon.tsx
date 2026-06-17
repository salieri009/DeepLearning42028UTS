import styled from "styled-components";

type IconProps = {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
};

const Symbol = styled.span<{ $size: number; $filled: boolean }>`
  font-size: ${({ $size }) => $size}px;
  font-variation-settings: ${({ $filled }) =>
    `'FILL' ${$filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`};
`;

export function Icon({ name, size = 24, filled = false, className }: IconProps) {
  return (
    <Symbol className={`material-symbols-outlined ${className ?? ""}`} $size={size} $filled={filled}>
      {name}
    </Symbol>
  );
}
