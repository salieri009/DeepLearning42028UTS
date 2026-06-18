import styled from "styled-components";
import { VisuallyHidden } from "./VisuallyHidden";

type LiveRegionProps = {
  message: string;
  politeness?: "polite" | "assertive";
};

export function LiveRegion({ message, politeness = "polite" }: LiveRegionProps) {
  return (
    <VisuallyHidden aria-live={politeness} role="status">
      {message}
    </VisuallyHidden>
  );
}

const SkipAnchor = styled.a`
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.textPrimary};
  font-family: ${({ theme }) => theme.typography.family.mono};
  text-decoration: none;

  &:focus {
    position: fixed;
    left: ${({ theme }) => theme.spacing[4]};
    top: ${({ theme }) => theme.spacing[4]};
    width: auto;
    height: auto;
    overflow: visible;
    outline: 2px solid ${({ theme }) => theme.color.focus};
    outline-offset: 2px;
  }
`;

type SkipLinkProps = {
  targetId?: string;
  label?: string;
};

export function SkipLink({
  targetId = "main-content",
  label = "Skip to main content",
}: SkipLinkProps) {
  return <SkipAnchor href={`#${targetId}`}>{label}</SkipAnchor>;
}
