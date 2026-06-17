import styled from "styled-components";

type RangeSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  displayValue: string;
  hint?: string;
  onChange: (value: number) => void;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.textPrimary};
`;

const Value = styled.span`
  color: ${({ theme }) => theme.color.primary};
`;

const Input = styled.input`
  width: 100%;
  appearance: none;
  height: 6px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.color.glass.border};
  cursor: pointer;

  &::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ theme }) => theme.gradient.aqua};
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${({ theme }) => theme.color.textInverse};
    border: 2px solid ${({ theme }) => theme.color.primary};
    box-shadow: 0 0 10px ${({ theme }) => theme.color.primary};
    margin-top: -6px;
    cursor: pointer;
  }
`;

const Hint = styled.p`
  margin: 0;
  font-size: 10px;
  color: ${({ theme }) => theme.color.textSecondary};
`;

export function RangeSlider({
  label,
  value,
  min,
  max,
  displayValue,
  hint,
  onChange,
}: RangeSliderProps) {
  return (
    <Wrapper>
      <Header>
        <span>{label}</span>
        <Value>{displayValue}</Value>
      </Header>
      <Input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <Hint>{hint}</Hint>}
    </Wrapper>
  );
}
