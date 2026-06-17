import styled from "styled-components";
import { Icon } from "@/shared/ui";

const Nav = styled.nav`
  display: flex;
  position: fixed;
  bottom: ${({ theme }) => theme.spacing[6]};
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  min-width: 320px;
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[6]}`};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.color.glass.fill};
  backdrop-filter: blur(24px);
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  box-shadow: ${({ theme }) => theme.shadow.glow};
  justify-content: space-around;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (min-width: 768px) {
    display: none;
  }
`;

const NavButton = styled.button<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $active }) => ($active ? theme.gradient.aqua : "transparent")};
  color: ${({ theme, $active }) =>
    $active ? theme.color.textInverse : theme.color.textSecondary};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  cursor: not-allowed;
  opacity: ${({ $active }) => ($active ? 1 : 0.7)};
`;

export function BottomNav() {
  return (
    <Nav aria-label="Mobile controls">
      <NavButton type="button" disabled title="Coming soon">
        <Icon name="play_circle" size={22} />
        Start
      </NavButton>
      <NavButton type="button" disabled title="Coming soon">
        <Icon name="photo_camera" size={22} />
        Snap
      </NavButton>
      <NavButton type="button" $active disabled title="Coming soon">
        <Icon name="mic" size={22} />
        Voice
      </NavButton>
      <NavButton type="button" disabled title="Coming soon">
        <Icon name="stop_circle" size={22} />
        End
      </NavButton>
    </Nav>
  );
}
