"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeConfig, PageTemplate } from "@/lib/theme/types";
import { defaultTheme } from "@/lib/theme/default-theme";

interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  currentTemplate: PageTemplate | null;
  setCurrentTemplate: (template: PageTemplate | null) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme as ThemeConfig);
  const [currentTemplate, setCurrentTemplate] = useState<PageTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load theme from API or localStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const response = await fetch("/api/theme/active");
        if (response.ok) {
          const data = await response.json();
          setTheme(data.theme);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    };

    loadTheme();
  }, []);

  // Apply CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply typography
    root.style.setProperty("--font-heading", theme.typography.fontFamily.heading);
    root.style.setProperty("--font-body", theme.typography.fontFamily.body);

    // Apply spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Apply border radius
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentTemplate,
        setCurrentTemplate,
        isEditing,
        setIsEditing,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
