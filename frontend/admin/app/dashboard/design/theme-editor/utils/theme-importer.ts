/**
 * Theme Importer
 * Importa e valida configurazioni tema
 */

import { ThemeConfig } from '@/lib/theme/types'
import { ThemeValidator } from '@/lib/theme/engine/theme-validator'

export class ThemeImporter {
  /**
   * Import theme from JSON file
   */
  static async importTheme(file: File): Promise<ThemeConfig> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const json = e.target?.result as string
          const theme = JSON.parse(json) as ThemeConfig

          // Validate theme
          const errors = ThemeValidator.validateTheme(theme)

          if (errors.length > 0) {
            const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join('\n')
            reject(new Error(`Theme validation failed:\n${errorMessages}`))
            return
          }

          resolve(theme)
        } catch (error) {
          reject(new Error('Invalid JSON file'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsText(file)
    })
  }

  /**
   * Import theme from URL
   */
  static async importThemeFromURL(url: string): Promise<ThemeConfig> {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch theme')
      }

      const theme = (await response.json()) as ThemeConfig

      // Validate theme
      const errors = ThemeValidator.validateTheme(theme)

      if (errors.length > 0) {
        const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join('\n')
        throw new Error(`Theme validation failed:\n${errorMessages}`)
      }

      return theme
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to import theme from URL'
      )
    }
  }

  /**
   * Import theme package (ZIP)
   */
  static async importThemePackage(file: File): Promise<ThemeConfig> {
    // TODO: Implement ZIP import with assets
    // This would require a library like JSZip

    console.log('Importing theme package:', file.name)

    // For now, treat as JSON
    return this.importTheme(file)
  }

  /**
   * Merge imported settings with existing theme
   */
  static mergeSettings(
    existing: ThemeConfig,
    imported: Partial<ThemeConfig>
  ): ThemeConfig {
    return {
      ...existing,
      settings: {
        ...existing.settings,
        ...imported.settings,
      },
      customCSS: imported.customCSS ?? existing.customCSS,
      customJS: imported.customJS ?? existing.customJS,
    }
  }

  /**
   * Preview theme before import
   */
  static generatePreview(theme: ThemeConfig): string {
    // Generate HTML preview
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            :root {
              --color-primary: ${theme.settings.colors.primary};
              --color-secondary: ${theme.settings.colors.secondary};
              --font-heading: ${theme.settings.typography.fontFamily.heading};
            }
            body {
              font-family: var(--font-heading);
              color: ${theme.settings.colors.foreground};
              background: ${theme.settings.colors.background};
            }
            h1 { color: var(--color-primary); }
            button {
              background: var(--color-primary);
              color: white;
              padding: 0.5rem 1rem;
              border: none;
              border-radius: ${theme.settings.borderRadius.md};
            }
          </style>
        </head>
        <body>
          <h1>${theme.name}</h1>
          <p>Version: ${theme.version}</p>
          <button>Preview Button</button>
        </body>
      </html>
    `
  }

  /**
   * Validate file before import
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.name.endsWith('.json') && !file.name.endsWith('.zip')) {
      return {
        valid: false,
        error: 'Invalid file type. Only JSON and ZIP files are supported.',
      }
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File too large. Maximum size is 10MB.',
      }
    }

    return { valid: true }
  }
}
