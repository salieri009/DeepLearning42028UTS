export const tokens = {
  color: {
    primary: {
      60: "#0F62FE",
      70: "#0043CE",
      80: "#002D9C",
    },
    neutral: {
      0: "#FFFFFF",
      10: "#F4F4F4",
      20: "#E0E0E0",
      30: "#C6C6C6",
      40: "#A8A8A8",
      60: "#6F6F6F",
      80: "#262626",
      90: "#161616",
      100: "#0F0F0F",
    },
    danger: {
      60: "#DA1E28",
      70: "#A2191F",
    },
    success: {
      60: "#24A148",
      70: "#198038",
    },
    info: {
      60: "#0F62FE",
      70: "#0043CE",
    },
    focus: "#0F62FE",
  },
  spacing: {
    0: "0px",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "24px",
    6: "32px",
    7: "40px",
  },
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
  },
  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.12)",
    md: "0 4px 12px rgba(0,0,0,0.14)",
  },
  typography: {
    family: {
      sans:
        'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    size: {
      1: "12px",
      2: "14px",
      3: "16px",
      4: "20px",
      5: "24px",
      6: "32px",
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.45,
    },
  },
} as const;

