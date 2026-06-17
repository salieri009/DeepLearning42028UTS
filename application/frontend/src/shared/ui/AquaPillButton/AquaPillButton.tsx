import styled from "styled-components";
import { Button } from "../Button/Button";

export const AquaPillButton = styled(Button).attrs({
  $variant: "primary" as const,
  $pill: true,
})``;
