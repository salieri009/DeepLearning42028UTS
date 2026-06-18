import styled from "styled-components";
import { ChromeText } from "@/shared/ui/ChromeText";

export const PageChromeTitle = styled(ChromeText)`
  font-size: ${({ theme }) => theme.typography.size[6]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  text-transform: uppercase;
`;
