import { tokens } from "./tokens";

export const theme = {
  tokens,
  color: {
    neutral: tokens.color.neutral,
    bg: tokens.color.neutral[0],
    surface: tokens.color.neutral[0],
    surfaceSubtle: tokens.color.neutral[10],
    borderSubtle: tokens.color.neutral[20],
    textPrimary: tokens.color.neutral[90],
    textSecondary: tokens.color.neutral[60],
    textInverse: tokens.color.neutral[0],
    primary: tokens.color.primary[60],
    primaryHover: tokens.color.primary[70],
    danger: tokens.color.danger[60],
    dangerHover: tokens.color.danger[70],
    successText: tokens.color.success[70],
    overlayBorder: tokens.color.success[60],
    overlayBorderSubtle: "rgba(36, 161, 72, 0.65)",
    focus: tokens.color.focus,
  },
  spacing: tokens.spacing,
  radius: tokens.radius,
  shadow: tokens.shadow,
  typography: {
    family: tokens.typography.family,
    size: tokens.typography.size,
    weight: tokens.typography.weight,
    lineHeight: tokens.typography.lineHeight,
  },
  layout: {
    maxWidth: "1120px",
    mediaMaxWidth: "760px",
  },
} as const;

export type AppTheme = typeof theme;

