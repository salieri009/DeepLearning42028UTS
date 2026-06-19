import styled from "styled-components";
import { AquaPillButton, Button, Icon } from "@/shared/ui";

type SettingsActionsProps = {
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[4]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.color.glass.border};
`;

export function SettingsActions({ dirty, onSave, onDiscard }: SettingsActionsProps) {
  return (
    <Actions>
      <Button type="button" $variant="ghost" onClick={onDiscard} disabled={!dirty}>
        Discard Changes
      </Button>
      <AquaPillButton type="button" onClick={onSave} disabled={!dirty}>
        <Icon name="save" size={18} />
        Save Changes
      </AquaPillButton>
    </Actions>
  );
}
