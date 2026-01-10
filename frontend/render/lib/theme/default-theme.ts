import { ThemeConfig } from "./types";

export const defaultTheme: ThemeConfig = {
  id: "default",
  name: "Default Theme",
  colors: {
    primary: "#3b82f6",
    secondary: "#64748b",
    accent: "#f59e0b",
    background: "#ffffff",
    foreground: "#0f172a",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    border: "#e2e8f0",
    card: "#ffffff",
    cardForeground: "#0f172a",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
  },
  typography: {
    fontFamily: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },
  spacing: {
    xs: "0.5rem",
    sm: "1rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "3rem",
    "2xl": "4rem",
  },
  borderRadius: {
    none: "0",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px",
  },
  layout: {
    containerMaxWidth: "1280px",
    headerHeight: "4rem",
    footerHeight: "auto",
  },
};

export const darkTheme: ThemeConfig = {
  ...defaultTheme,
  id: "dark",
  name: "Dark Theme",
  colors: {
    primary: "#3b82f6",
    secondary: "#64748b",
    accent: "#f59e0b",
    background: "#0f172a",
    foreground: "#f8fafc",
    muted: "#1e293b",
    mutedForeground: "#94a3b8",
    border: "#334155",
    card: "#1e293b",
    cardForeground: "#f8fafc",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
  },
};
