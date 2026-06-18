import styled from "styled-components";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
  disabled?: boolean;
};

const Row = styled.label<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing[2]} 0`};
  border-bottom: 1px solid ${({ theme }) => theme.color.glass.border};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};
`;

const Label = styled.span`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.textPrimary};
`;

const Thumb = styled.div<{ $checked: boolean }>`
  position: absolute;
  top: 2px;
  left: ${({ $checked }) => ($checked ? "22px" : "2px")};
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.textInverse};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  transition: left 120ms ease;
  pointer-events: none;
`;

const HiddenInput = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 1;

  &:focus-visible + ${Thumb} {
    outline: 2px solid ${({ theme }) => theme.color.focus};
    outline-offset: 2px;
  }
`;

const Track = styled.div<{ $checked: boolean }>`
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $checked }) =>
    $checked ? theme.color.primary : theme.color.glass.border};
  transition: background 120ms ease;
  flex-shrink: 0;
`;

export function Toggle({ checked, onChange, label, id, disabled = false }: ToggleProps) {
  const inputId = id ?? label.replace(/\s+/g, "-").toLowerCase();

  return (
    <Row htmlFor={inputId} $disabled={disabled}>
      <Label>{label}</Label>
      <Track $checked={checked}>
        <HiddenInput
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <Thumb $checked={checked} />
      </Track>
    </Row>
  );
}
