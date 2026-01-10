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
