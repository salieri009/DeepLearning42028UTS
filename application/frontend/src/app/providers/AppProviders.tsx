import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { AlertHistoryProvider } from "@/app/providers/AlertHistoryProvider";
import { GlobalStyle, theme } from "@/shared/config/theme";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AlertHistoryProvider>{children}</AlertHistoryProvider>
    </ThemeProvider>
  );
}
