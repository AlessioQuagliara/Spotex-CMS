/**
 * Theme Provider
 * Context provider per applicare tema allo storefront
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { ThemeConfig, StorefrontTheme } from './types'
import { themeLoader } from './engine/theme-loader'
import { ThemeCompiler } from './engine/theme-compiler'
import { defaultTheme } from './default-theme'

interface ThemeContextValue {
  theme: ThemeConfig | null
  isLoading: boolean
  error: string | null
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: null,
  isLoading: true,
  error: null,
})

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  storeId: string
  children: React.ReactNode
}

export function ThemeProvider({ storeId, children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTheme()
  }, [storeId])

  const loadTheme = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load storefront theme with customizations
      const storefrontTheme = await themeLoader.loadStorefrontTheme(storeId)

      if (!storefrontTheme) {
        // Fallback to default theme
        console.warn('No theme found for store, using default')
        setTheme(defaultTheme as any)
        applyThemeStyles(defaultTheme as any)
        return
      }

      // Load base theme
      const baseTheme = await themeLoader.loadTheme(storefrontTheme.themeId)

      if (!baseTheme) {
        throw new Error(`Theme not found: ${storefrontTheme.themeId}`)
      }

      // Apply customizations
      const customizedTheme = ThemeCompiler.applyCustomizations(
        baseTheme,
        storefrontTheme.customizations
      )

      setTheme(customizedTheme)
      applyThemeStyles(customizedTheme)
    } catch (err) {
      console.error('Error loading theme:', err)
      setError(err instanceof Error ? err.message : 'Failed to load theme')
      
      // Fallback to default theme on error
      setTheme(defaultTheme as any)
      applyThemeStyles(defaultTheme as any)
    } finally {
      setIsLoading(false)
    }
  }

  const applyThemeStyles = (theme: ThemeConfig) => {
    // Generate CSS from theme
    const css = ThemeCompiler.generateStyleTag(theme)

    // Check if style element already exists
    let styleEl = document.getElementById('theme-styles')

    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'theme-styles'
      document.head.appendChild(styleEl)
    }

    styleEl.textContent = css

    // Apply custom JS if present
    if (theme.customJS) {
      let scriptEl = document.getElementById('theme-scripts')

      if (!scriptEl) {
        scriptEl = document.createElement('script')
        scriptEl.id = 'theme-scripts'
        document.body.appendChild(scriptEl)
      }

      scriptEl.textContent = theme.customJS
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, isLoading, error }}>
      {children}
    </ThemeContext.Provider>
  )
}
