import { useMap } from "react-leaflet";
import styled from "styled-components";
import { Icon } from "@/shared/ui";

const Hud = styled.div`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing[6]};
  right: ${({ theme }) => theme.spacing[6]};
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  z-index: 1000;
`;

const HudButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.glass.scrim};
  backdrop-filter: blur(12px);
  color: ${({ theme }) => theme.color.textPrimary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.color.glass.fillStrong};
  }
`;

export function MapControls() {
  const map = useMap();

  return (
    <Hud>
      <HudButton type="button" aria-label="Zoom in" onClick={() => map.zoomIn()}>
        <Icon name="zoom_in" size={20} />
      </HudButton>
      <HudButton type="button" aria-label="Zoom out" onClick={() => map.zoomOut()}>
        <Icon name="zoom_out" size={20} />
      </HudButton>
      <HudButton
        type="button"
        aria-label="My location"
        onClick={() => map.setView([-33.8834, 151.2005], 16)}
      >
        <Icon name="my_location" size={20} />
      </HudButton>
    </Hud>
  );
}
