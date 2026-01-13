/**
 * Theme Validator
 * Valida configurazione tema e sezioni
 */

import { ThemeConfig, ThemeSection, SectionSetting } from '../types'

export interface ValidationError {
  field: string
  message: string
}

export class ThemeValidator {
  /**
   * Validate theme configuration
   */
  static validateTheme(theme: ThemeConfig): ValidationError[] {
    const errors: ValidationError[] = []

    // Required fields
    if (!theme.id) {
      errors.push({ field: 'id', message: 'Theme ID is required' })
    }

    if (!theme.name) {
      errors.push({ field: 'name', message: 'Theme name is required' })
    }

    if (!theme.version) {
      errors.push({ field: 'version', message: 'Theme version is required' })
    }

    // Validate version format (semver)
    if (theme.version && !this.isValidVersion(theme.version)) {
      errors.push({ field: 'version', message: 'Invalid version format. Use semver (e.g., 1.0.0)' })
    }

    // Validate settings
    if (!theme.settings) {
      errors.push({ field: 'settings', message: 'Theme settings are required' })
    } else {
      errors.push(...this.validateSettings(theme.settings))
    }

    // Validate sections
    if (theme.sections) {
      Object.entries(theme.sections).forEach(([id, section]) => {
        errors.push(...this.validateSection(section, `sections.${id}`))
      })
    }

    return errors
  }

  /**
   * Validate theme settings
   */
  private static validateSettings(settings: any): ValidationError[] {
    const errors: ValidationError[] = []

    // Validate colors
    if (!settings.colors) {
      errors.push({ field: 'settings.colors', message: 'Color settings are required' })
    } else {
      const requiredColors = [
        'primary',
        'secondary',
        'background',
        'foreground',
        'muted',
        'border',
      ]

      requiredColors.forEach((color) => {
        if (!settings.colors[color]) {
          errors.push({
            field: `settings.colors.${color}`,
            message: `Color ${color} is required`,
          })
        } else if (!this.isValidColor(settings.colors[color])) {
          errors.push({
            field: `settings.colors.${color}`,
            message: `Invalid color value: ${settings.colors[color]}`,
          })
        }
      })
    }

    // Validate typography
    if (!settings.typography) {
      errors.push({ field: 'settings.typography', message: 'Typography settings are required' })
    }

    return errors
  }

  /**
   * Validate section schema
   */
  static validateSection(section: ThemeSection, prefix = ''): ValidationError[] {
    const errors: ValidationError[] = []

    if (!section.id) {
      errors.push({ field: `${prefix}.id`, message: 'Section ID is required' })
    }

    if (!section.name) {
      errors.push({ field: `${prefix}.name`, message: 'Section name is required' })
    }

    if (!section.schema) {
      errors.push({ field: `${prefix}.schema`, message: 'Section schema is required' })
    } else {
      // Validate settings
      if (section.schema.settings) {
        section.schema.settings.forEach((setting, index) => {
          errors.push(
            ...this.validateSetting(setting, `${prefix}.schema.settings[${index}]`)
          )
        })
      }

      // Validate blocks
      if (section.schema.blocks) {
        section.schema.blocks.forEach((block, index) => {
          if (!block.type) {
            errors.push({
              field: `${prefix}.schema.blocks[${index}].type`,
              message: 'Block type is required',
            })
          }

          if (block.settings) {
            block.settings.forEach((setting, settingIndex) => {
              errors.push(
                ...this.validateSetting(
                  setting,
                  `${prefix}.schema.blocks[${index}].settings[${settingIndex}]`
                )
              )
            })
          }
        })
      }
    }

    return errors
  }

  /**
   * Validate section setting
   */
  private static validateSetting(
    setting: SectionSetting,
    prefix: string
  ): ValidationError[] {
    const errors: ValidationError[] = []

    if (!setting.type) {
      errors.push({ field: `${prefix}.type`, message: 'Setting type is required' })
    }

    if (!setting.id) {
      errors.push({ field: `${prefix}.id`, message: 'Setting ID is required' })
    }

    if (!setting.label) {
      errors.push({ field: `${prefix}.label`, message: 'Setting label is required' })
    }

    // Validate setting type
    const validTypes = [
      'text',
      'textarea',
      'select',
      'radio',
      'checkbox',
      'color',
      'image',
      'url',
      'range',
      'richtext',
    ]

    if (setting.type && !validTypes.includes(setting.type)) {
      errors.push({
        field: `${prefix}.type`,
        message: `Invalid setting type: ${setting.type}`,
      })
    }

    // Validate select/radio options
    if ((setting.type === 'select' || setting.type === 'radio') && !setting.options) {
      errors.push({
        field: `${prefix}.options`,
        message: 'Options are required for select/radio settings',
      })
    }

    // Validate range min/max
    if (setting.type === 'range') {
      if (setting.min === undefined) {
        errors.push({ field: `${prefix}.min`, message: 'Min value is required for range' })
      }
      if (setting.max === undefined) {
        errors.push({ field: `${prefix}.max`, message: 'Max value is required for range' })
      }
    }

    return errors
  }

  /**
   * Validate section settings values
   */
  static validateSectionSettings(
    section: ThemeSection,
    settings: Record<string, any>
  ): ValidationError[] {
    const errors: ValidationError[] = []

    section.schema.settings.forEach((settingSchema) => {
      const value = settings[settingSchema.id]

      // Check required (if default not provided)
      if (
        value === undefined &&
        settingSchema.default === undefined &&
        settingSchema.type !== 'checkbox'
      ) {
        errors.push({
          field: settingSchema.id,
          message: `Setting ${settingSchema.label} is required`,
        })
        return
      }

      // Validate by type
      switch (settingSchema.type) {
        case 'color':
          if (value && !this.isValidColor(value)) {
            errors.push({
              field: settingSchema.id,
              message: `Invalid color value: ${value}`,
            })
          }
          break

        case 'url':
          if (value && !this.isValidURL(value)) {
            errors.push({
              field: settingSchema.id,
              message: `Invalid URL: ${value}`,
            })
          }
          break

        case 'range':
          if (value !== undefined) {
            const numValue = Number(value)
            if (
              isNaN(numValue) ||
              numValue < settingSchema.min! ||
              numValue > settingSchema.max!
            ) {
              errors.push({
                field: settingSchema.id,
                message: `Value must be between ${settingSchema.min} and ${settingSchema.max}`,
              })
            }
          }
          break

        case 'select':
        case 'radio':
          if (
            value &&
            settingSchema.options &&
            !settingSchema.options.some((opt) => opt.value === value)
          ) {
            errors.push({
              field: settingSchema.id,
              message: `Invalid option selected`,
            })
          }
          break
      }
    })

    return errors
  }

  /**
   * Helper: validate color format
   */
  private static isValidColor(color: string): boolean {
    // Hex color
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return true
    }

    // RGB/RGBA
    if (/^rgba?\([\d\s,\.]+\)$/.test(color)) {
      return true
    }

    // HSL/HSLA
    if (/^hsla?\([\d\s,%\.]+\)$/.test(color)) {
      return true
    }

    // Named colors
    const namedColors = ['transparent', 'currentColor', 'inherit']
    if (namedColors.includes(color)) {
      return true
    }

    return false
  }

  /**
   * Helper: validate URL format
   */
  private static isValidURL(url: string): boolean {
    // Relative URLs
    if (url.startsWith('/')) {
      return true
    }

    // Absolute URLs
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Helper: validate version format (semver)
   */
  private static isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/.test(version)
  }
}
