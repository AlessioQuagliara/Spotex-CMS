/**
 * Theme Compiler
 * Compila configurazione tema in CSS e variabili applicabili
 */

import { ThemeConfig, ThemeSettings, ThemeCustomizations } from '../types'

export class ThemeCompiler {
  /**
   * Compile theme settings to CSS variables
   */
  static compileToCSSVariables(settings: ThemeSettings): string {
    const { colors, typography, spacing, borderRadius } = settings

    const cssVars: string[] = [
      ':root {',
      // Colors
      `  --color-primary: ${colors.primary};`,
      `  --color-secondary: ${colors.secondary};`,
      `  --color-accent: ${colors.accent};`,
      `  --color-background: ${colors.background};`,
      `  --color-foreground: ${colors.foreground};`,
      `  --color-muted: ${colors.muted};`,
      `  --color-muted-foreground: ${colors.mutedForeground};`,
      `  --color-border: ${colors.border};`,
      `  --color-input: ${colors.input};`,
      `  --color-ring: ${colors.ring};`,
      `  --color-destructive: ${colors.destructive};`,
      `  --color-destructive-foreground: ${colors.destructiveForeground};`,
      '',
      // Typography
      `  --font-heading: ${typography.fontFamily.heading};`,
      `  --font-body: ${typography.fontFamily.body};`,
      `  --text-xs: ${typography.fontSize.xs};`,
      `  --text-sm: ${typography.fontSize.sm};`,
      `  --text-base: ${typography.fontSize.base};`,
      `  --text-lg: ${typography.fontSize.lg};`,
      `  --text-xl: ${typography.fontSize.xl};`,
      `  --text-2xl: ${typography.fontSize['2xl']};`,
      `  --text-3xl: ${typography.fontSize['3xl']};`,
      `  --text-4xl: ${typography.fontSize['4xl']};`,
      `  --font-light: ${typography.fontWeight.light};`,
      `  --font-normal: ${typography.fontWeight.normal};`,
      `  --font-medium: ${typography.fontWeight.medium};`,
      `  --font-semibold: ${typography.fontWeight.semibold};`,
      `  --font-bold: ${typography.fontWeight.bold};`,
      '',
      // Spacing
      `  --spacing-xs: ${spacing.xs};`,
      `  --spacing-sm: ${spacing.sm};`,
      `  --spacing-md: ${spacing.md};`,
      `  --spacing-lg: ${spacing.lg};`,
      `  --spacing-xl: ${spacing.xl};`,
      '',
      // Border Radius
      `  --radius-sm: ${borderRadius.sm};`,
      `  --radius-md: ${borderRadius.md};`,
      `  --radius-lg: ${borderRadius.lg};`,
      `  --radius-full: ${borderRadius.full};`,
      '}',
    ]

    return cssVars.join('\n')
  }

  /**
   * Apply customizations to theme
   */
  static applyCustomizations(
    theme: ThemeConfig,
    customizations: ThemeCustomizations
  ): ThemeConfig {
    const customizedTheme = { ...theme }

    // Merge settings
    if (customizations.settings) {
      customizedTheme.settings = this.mergeSettings(
        theme.settings,
        customizations.settings
      )
    }

    // Apply section settings
    if (customizations.sectionSettings) {
      Object.keys(customizations.sectionSettings).forEach((sectionId) => {
        if (customizedTheme.sections[sectionId]) {
          customizedTheme.sections[sectionId].defaultSettings = {
            ...customizedTheme.sections[sectionId].defaultSettings,
            ...customizations.sectionSettings![sectionId],
          }
        }
      })
    }

    // Append custom CSS/JS
    if (customizations.customCSS) {
      customizedTheme.customCSS = (customizedTheme.customCSS || '') + '\n' + customizations.customCSS
    }

    if (customizations.customJS) {
      customizedTheme.customJS = (customizedTheme.customJS || '') + '\n' + customizations.customJS
    }

    return customizedTheme
  }

  /**
   * Deep merge theme settings
   */
  private static mergeSettings(
    base: ThemeSettings,
    custom: Partial<ThemeSettings>
  ): ThemeSettings {
    return {
      colors: { ...base.colors, ...custom.colors },
      typography: {
        fontFamily: { ...base.typography.fontFamily, ...custom.typography?.fontFamily },
        fontSize: { ...base.typography.fontSize, ...custom.typography?.fontSize },
        fontWeight: { ...base.typography.fontWeight, ...custom.typography?.fontWeight },
      },
      spacing: { ...base.spacing, ...custom.spacing },
      borderRadius: { ...base.borderRadius, ...custom.borderRadius },
      layout: { ...base.layout, ...custom.layout },
    }
  }

  /**
   * Generate complete CSS bundle
   */
  static compileThemeCSS(theme: ThemeConfig): string {
    const cssVariables = this.compileToCSSVariables(theme.settings)
    const customCSS = theme.customCSS || ''

    return `${cssVariables}\n\n${customCSS}`
  }

  /**
   * Minify CSS (basic implementation)
   */
  static minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Replace multiple spaces
      .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around symbols
      .trim()
  }

  /**
   * Generate style tag content
   */
  static generateStyleTag(theme: ThemeConfig, minify = false): string {
    let css = this.compileThemeCSS(theme)

    if (minify) {
      css = this.minifyCSS(css)
    }

    return css
  }
}
