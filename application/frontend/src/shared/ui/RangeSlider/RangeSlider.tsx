import { useId } from "react";
import styled, { css } from "styled-components";

type RangeSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue: string;
  hint?: string;
  onChange: (value: number) => void;
};

const thumbStyles = css`
  width: calc(${({ theme }) => theme.spacing[4]} + 2px);
  height: calc(${({ theme }) => theme.spacing[4]} + 2px);
  border-radius: 50%;
  background: ${({ theme }) => theme.color.textInverse};
  border: 2px solid ${({ theme }) => theme.color.primary};
  box-shadow: 0 0 ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.color.primary};
  cursor: pointer;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.textPrimary};
`;

const Value = styled.span`
  color: ${({ theme }) => theme.color.primary};
  flex-shrink: 0;
`;

const Input = styled.input`
  width: 100%;
  appearance: none;
  height: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.full};
  background: transparent;
  cursor: pointer;

  &::-webkit-slider-runnable-track {
    height: ${({ theme }) => theme.spacing[2]};
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ theme }) => theme.gradient.aqua};
  }

  &::-webkit-slider-thumb {
    appearance: none;
    ${thumbStyles}
    margin-top: calc(
      (${({ theme }) => theme.spacing[2]} - ${({ theme }) => theme.spacing[4]} - 2px) / 2
    );
  }

  &::-moz-range-track {
    height: ${({ theme }) => theme.spacing[2]};
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ theme }) => theme.color.glass.border};
    border: none;
  }

  &::-moz-range-progress {
    height: ${({ theme }) => theme.spacing[2]};
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ theme }) => theme.gradient.aqua};
  }

  &::-moz-range-thumb {
    ${thumbStyles}
  }
`;

const Hint = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

export function RangeSlider({
  label,
  value,
  min,
  max,
  step = 1,
  displayValue,
  hint,
  onChange,
}: RangeSliderProps) {
  const inputId = useId();
  const labelId = `${inputId}-label`;

  return (
    <Wrapper>
      <Header>
        <span id={labelId}>{label}</span>
        <Value aria-hidden>{displayValue}</Value>
      </Header>
      <Input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-labelledby={labelId}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={displayValue}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <Hint>{hint}</Hint>}
    </Wrapper>
  );
}
