import styled from "styled-components";

type SelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  label?: string;
};

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const Label = styled.label`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.textSecondary};
`;

const Control = styled.select`
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.textPrimary};
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.color.focus};
  }
`;

export function Select({ id, value, onChange, children, label }: SelectProps) {
  return (
    <Field>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Control id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </Control>
    </Field>
  );
}
