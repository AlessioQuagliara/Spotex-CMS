/**
 * Theme Loader
 * Caricamento dinamico dei temi
 */

import { ThemeConfig, ThemeSection, StorefrontTheme } from '../types'

export class ThemeLoader {
  private static instance: ThemeLoader
  private themeCache: Map<string, ThemeConfig> = new Map()
  private sectionCache: Map<string, ThemeSection> = new Map()

  private constructor() {}

  static getInstance(): ThemeLoader {
    if (!ThemeLoader.instance) {
      ThemeLoader.instance = new ThemeLoader()
    }
    return ThemeLoader.instance
  }

  /**
   * Load theme configuration
   */
  async loadTheme(themeId: string): Promise<ThemeConfig | null> {
    // Check cache
    if (this.themeCache.has(themeId)) {
      return this.themeCache.get(themeId)!
    }

    try {
      // TODO: Load from API
      const response = await fetch(`/api/themes/${themeId}`)
      if (!response.ok) {
        throw new Error(`Failed to load theme: ${themeId}`)
      }

      const theme: ThemeConfig = await response.json()
      this.themeCache.set(themeId, theme)
      return theme
    } catch (error) {
      console.error('Error loading theme:', error)
      return null
    }
  }

  /**
   * Load storefront theme (with customizations)
   */
  async loadStorefrontTheme(storeId: string): Promise<StorefrontTheme | null> {
    try {
      // TODO: Load from API
      const response = await fetch(`/api/stores/${storeId}/theme`)
      if (!response.ok) {
        throw new Error(`Failed to load storefront theme for store: ${storeId}`)
      }

      const storefrontTheme: StorefrontTheme = await response.json()
      return storefrontTheme
    } catch (error) {
      console.error('Error loading storefront theme:', error)
      return null
    }
  }

  /**
   * Load section schema
   */
  async loadSection(sectionId: string): Promise<ThemeSection | null> {
    // Check cache
    if (this.sectionCache.has(sectionId)) {
      return this.sectionCache.get(sectionId)!
    }

    try {
      // TODO: Load from registry or API
      const { sectionSchemas } = await import('../schemas/section-schemas')
      const section = sectionSchemas[sectionId]

      if (section) {
        this.sectionCache.set(sectionId, section)
        return section
      }

      return null
    } catch (error) {
      console.error('Error loading section:', error)
      return null
    }
  }

  /**
   * Preload all sections for a theme
   */
  async preloadSections(sectionIds: string[]): Promise<void> {
    const loadPromises = sectionIds.map((id) => this.loadSection(id))
    await Promise.all(loadPromises)
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.themeCache.clear()
    this.sectionCache.clear()
  }

  /**
   * Get cached theme
   */
  getCachedTheme(themeId: string): ThemeConfig | undefined {
    return this.themeCache.get(themeId)
  }
}

export const themeLoader = ThemeLoader.getInstance()
