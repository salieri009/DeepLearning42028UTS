import styled from "styled-components";

export type RadioOption<T extends string> = {
  value: T;
  label: string;
  tag?: string;
  tagMuted?: boolean;
  icon?: React.ReactNode;
};

type RadioGroupProps<T extends string> = {
  name: string;
  value: T;
  options: RadioOption<T>[];
  onChange: (value: T) => void;
  groupLabelId?: string;
};

const Fieldset = styled.fieldset`
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
`;

const Options = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const Option = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.tint.overlay};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.glass.fill};
  }
`;

const OptionLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
`;

const Tag = styled.span<{ $muted?: boolean }>`
  font-size: ${({ theme }) => theme.typography.size[1]};
  padding: 2px ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme, $muted }) =>
    $muted ? `${theme.color.textSecondary}33` : `${theme.color.primary}33`};
  color: ${({ theme, $muted }) => ($muted ? theme.color.textSecondary : theme.color.primary)};
`;

export function RadioGroup<T extends string>({
  name,
  value,
  options,
  onChange,
  groupLabelId,
}: RadioGroupProps<T>) {
  return (
    <Fieldset aria-labelledby={groupLabelId}>
      <Options role="radiogroup">
      {options.map((option) => (
        <Option key={option.value}>
          <OptionLeft>
            <input
              type="radio"
              name={name}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </OptionLeft>
          {option.icon ?? (option.tag ? <Tag $muted={option.tagMuted}>{option.tag}</Tag> : null)}
        </Option>
      ))}
      </Options>
    </Fieldset>
  );
}
