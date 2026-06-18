import styled from "styled-components";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/shared/ui/Button";
import { GlassPanel } from "@/shared/ui/GlassPanel";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
};

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.layout.zIndex.chrome + 10};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.color.tint.labelBackdrop};
`;

const Dialog = styled(GlassPanel)<{ $width: string }>`
  width: min(100%, ${({ $width }) => $width});
  max-height: min(85vh, 720px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.color.glass.border};
`;

const Title = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[3]};
  color: ${({ theme }) => theme.color.textPrimary};
`;

const Body = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  overflow-y: auto;
`;

export function Modal({ open, title, onClose, children, width = "560px" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Backdrop role="presentation" onClick={onClose}>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        $width={width}
        onClick={(e) => e.stopPropagation()}
      >
        <Header>
          <Title id="modal-title">{title}</Title>
          <Button type="button" $variant="ghost" onClick={onClose} aria-label="Close dialog">
            Close
          </Button>
        </Header>
        <Body>{children}</Body>
      </Dialog>
    </Backdrop>
  );
}
