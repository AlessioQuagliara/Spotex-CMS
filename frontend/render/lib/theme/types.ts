/**
 * Theme System Types
 * Definizioni TypeScript per il sistema di temi
 */

export interface ThemeConfig {
  id: string
  name: string
  version: string
  author: string
  description?: string
  settings: ThemeSettings
  sections: Record<string, ThemeSection>
  templates: Record<string, ThemeTemplate>
  assets: ThemeAssets
  customCSS?: string
  customJS?: string
}

export interface ThemeSettings {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    mutedForeground: string
    border: string
    input: string
    ring: string
    destructive: string
    destructiveForeground: string
  }
  typography: {
    fontFamily: {
      heading: string
      body: string
    }
    fontSize: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      '2xl': string
      '3xl': string
      '4xl': string
    }
    fontWeight: {
      light: number
      normal: number
      medium: number
      semibold: number
      bold: number
    }
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    full: string
  }
  layout: {
    containerWidth: string
    headerHeight: string
    footerHeight: string
  }
}

export interface ThemeSection {
  id: string
  name: string
  description?: string
  schema: SectionSchema
  defaultSettings: Record<string, any>
  presets?: SectionPreset[]
}

export interface SectionSchema {
  settings: SectionSetting[]
  blocks?: BlockSchema[]
  max_blocks?: number
}

export interface SectionSetting {
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'color' | 'image' | 'url' | 'range' | 'richtext'
  id: string
  label: string
  default?: any
  info?: string
  options?: { label: string; value: string }[]
  min?: number
  max?: number
  step?: number
}

export interface BlockSchema {
  type: string
  name: string
  settings: SectionSetting[]
  limit?: number
}

export interface SectionPreset {
  name: string
  settings: Record<string, any>
  blocks?: any[]
}

export interface ThemeTemplate {
  name: string
  layout: string
  sections: string[]
  sectionSettings: Record<string, any>
}

export interface ThemeAssets {
  css?: string[]
  js?: string[]
  images?: Record<string, string>
  fonts?: Font[]
}

export interface Font {
  family: string
  variants: string[]
  url?: string
}

export interface ThemeVersion {
  version: string
  timestamp: number
  config: ThemeConfig
  changes?: string
}

export interface StorefrontTheme {
  storeId: string
  themeId: string
  activeVersion: string
  customizations: ThemeCustomizations
  publishedAt?: string
  updatedAt: string
}

export interface ThemeCustomizations {
  settings?: Partial<ThemeSettings>
  sectionSettings?: Record<string, any>
  customCSS?: string
  customJS?: string
}

// Editor Types
export interface DragSection {
  id: string
  sectionType: string
  settings: Record<string, any>
  blocks?: DragBlock[]
}

export interface DragBlock {
  id: string
  type: string
  settings: Record<string, any>
}

export interface EditorState {
  selectedSection: string | null
  selectedBlock: string | null
  previewMode: 'desktop' | 'tablet' | 'mobile'
  isDragging: boolean
}

// Legacy types for backwards compatibility
export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  card: string;
  cardForeground: string;
  destructive: string;
  destructiveForeground: string;
}

export interface Typography {
  fontFamily: {
    heading: string;
    body: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    "4xl": string;
    "5xl": string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface SpacingScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
}

export interface BorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: ColorScheme;
  typography: Typography;
  spacing: SpacingScale;
  borderRadius: BorderRadius;
  layout: {
    containerMaxWidth: string;
    headerHeight: string;
    footerHeight: string;
  };
}

export type SectionType =
  | "hero"
  | "features"
  | "products"
  | "cta"
  | "testimonials"
  | "gallery"
  | "content"
  | "newsletter"
  | "footer";

export interface SectionConfig {
  id: string;
  type: SectionType;
  order: number;
  enabled: boolean;
  settings: Record<string, any>;
}

export interface PageTemplate {
  id: string;
  name: string;
  type: "home" | "product" | "collection" | "page" | "blog";
  sections: SectionConfig[];
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}
