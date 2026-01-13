'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  effectiveTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')
  const [isMounted, setIsMounted] = useState(false)

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    setIsMounted(true)

    // Get stored theme preference
    const storedTheme = localStorage.getItem('theme') as Theme | null
    const initialTheme = storedTheme || 'system'
    setThemeState(initialTheme)

    // Apply theme
    applyTheme(initialTheme)
  }, [])

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement

    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', isDark)
      setEffectiveTheme(isDark ? 'dark' : 'light')
    } else {
      root.classList.toggle('dark', theme === 'dark')
      setEffectiveTheme(theme)
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  // Listen for system theme changes
  useEffect(() => {
    if (!isMounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, isMounted])

  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
