/**
 * Font Optimization Configuration
 * Next.js font optimization with variable fonts and preloading
 */

import { Inter, Roboto, Poppins, Open_Sans, Montserrat, Lato } from "next/font/google";
import localFont from "next/font/local";

/**
 * Primary font - Inter (Variable font)
 * Modern, highly legible typeface with excellent kerning
 */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap", // Prevent FOIT (Flash of Invisible Text)
  variable: "--font-inter",
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: true, // Adjust fallback font to minimize layout shift
  weight: ["300", "400", "500", "600", "700"],
});

/**
 * Secondary font - Roboto
 * Clean and modern, great for body text
 */
export const roboto = Roboto({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
  preload: false,
  fallback: ["system-ui", "arial"],
  weight: ["300", "400", "500", "700"],
});

/**
 * Display font - Poppins
 * Bold and modern, great for headings
 */
export const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  preload: false,
  fallback: ["system-ui", "arial"],
  weight: ["400", "500", "600", "700", "800"],
});

/**
 * Alternative - Open Sans
 * Friendly and open, excellent readability
 */
export const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
  preload: false,
  fallback: ["system-ui", "arial"],
});

/**
 * Alternative - Montserrat
 * Geometric sans-serif, modern and elegant
 */
export const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  preload: false,
  fallback: ["system-ui", "arial"],
});

/**
 * Alternative - Lato
 * Warm and stable, great for long reading
 */
export const lato = Lato({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lato",
  preload: false,
  fallback: ["system-ui", "arial"],
  weight: ["300", "400", "700", "900"],
});

/**
 * Custom local font
 * Use for brand-specific fonts
 */
export const customFont = localFont({
  src: [
    {
      path: "../../../public/fonts/custom-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/custom-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../public/fonts/custom-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-custom",
  display: "swap",
  fallback: ["system-ui", "arial"],
  preload: true,
});

/**
 * Font configuration for CSS variables
 */
export const fontVariables = {
  inter: inter.variable,
  roboto: roboto.variable,
  poppins: poppins.variable,
  openSans: openSans.variable,
  montserrat: montserrat.variable,
  lato: lato.variable,
  custom: customFont.variable,
};

/**
 * Font preload configuration
 * Add to <head> for critical fonts
 */
export const fontPreloadLinks = [
  // Preload Inter (primary font)
  {
    rel: "preload",
    as: "font",
    type: "font/woff2",
    href: "/_next/static/media/inter-latin-400.woff2",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    as: "font",
    type: "font/woff2",
    href: "/_next/static/media/inter-latin-700.woff2",
    crossOrigin: "anonymous",
  },
];

/**
 * Font display strategies
 */
export const fontDisplayStrategies = {
  // Swap: Show fallback immediately, swap when font loads (recommended)
  swap: "swap",
  
  // Optional: Use fallback if font doesn't load in 100ms
  optional: "optional",
  
  // Block: Block rendering until font loads (up to 3s)
  block: "block",
  
  // Fallback: Block 100ms, show fallback, swap when loaded
  fallback: "fallback",
  
  // Auto: Let browser decide
  auto: "auto",
};

/**
 * Font loading optimization utilities
 */
export class FontLoader {
  private static loadedFonts = new Set<string>();
  
  /**
   * Preload a font
   */
  static preload(fontFamily: string, weight = "400", style = "normal"): void {
    if (typeof window === "undefined") return;
    
    const fontKey = `${fontFamily}-${weight}-${style}`;
    
    if (this.loadedFonts.has(fontKey)) {
      return;
    }
    
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "font";
    link.type = "font/woff2";
    link.crossOrigin = "anonymous";
    link.href = `/fonts/${fontFamily}-${weight}-${style}.woff2`;
    
    document.head.appendChild(link);
    this.loadedFonts.add(fontKey);
  }
  
  /**
   * Load font using Font Loading API
   */
  static async load(
    fontFamily: string,
    weight = "400",
    style = "normal"
  ): Promise<FontFace | null> {
    if (typeof window === "undefined" || !("FontFace" in window)) {
      return null;
    }
    
    const fontKey = `${fontFamily}-${weight}-${style}`;
    
    if (this.loadedFonts.has(fontKey)) {
      return null;
    }
    
    try {
      const fontFace = new FontFace(
        fontFamily,
        `url(/fonts/${fontFamily}-${weight}-${style}.woff2) format('woff2')`,
        {
          weight,
          style,
          display: "swap",
        }
      );
      
      await fontFace.load();
      document.fonts.add(fontFace);
      this.loadedFonts.add(fontKey);
      
      return fontFace;
    } catch (error) {
      console.error(`Failed to load font ${fontKey}:`, error);
      return null;
    }
  }
  
  /**
   * Check if font is loaded
   */
  static isLoaded(fontFamily: string, weight = "400", style = "normal"): boolean {
    if (typeof window === "undefined" || !document.fonts) {
      return false;
    }
    
    return document.fonts.check(`${weight} ${style} 12px ${fontFamily}`);
  }
  
  /**
   * Wait for fonts to load
   */
  static async waitForFonts(timeout = 3000): Promise<void> {
    if (typeof window === "undefined" || !document.fonts) {
      return;
    }
    
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, timeout)),
      ]);
    } catch (error) {
      console.error("Font loading timeout:", error);
    }
  }
}

/**
 * React hook for font loading
 */
export function useFontLoader(fonts: Array<{ family: string; weight?: string; style?: string }>) {
  if (typeof window === "undefined") return;
  
  fonts.forEach((font) => {
    FontLoader.preload(font.family, font.weight, font.style);
  });
}

/**
 * Font subsetting configuration
 * Reduce font file size by including only needed characters
 */
export const fontSubsets = {
  latin: "U+0020-007E", // Basic Latin
  latinExt: "U+0100-017F", // Latin Extended
  numbers: "U+0030-0039", // Numbers only
  punctuation: "U+0020-002F,U+003A-0040,U+005B-0060,U+007B-007E", // Punctuation
};

/**
 * Generate font-face CSS with subsetting
 */
export function generateFontFaceCSS(
  fontFamily: string,
  fontPath: string,
  weight = "400",
  style = "normal",
  subset?: string
): string {
  return `
@font-face {
  font-family: '${fontFamily}';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url('${fontPath}.woff2') format('woff2'),
       url('${fontPath}.woff') format('woff');
  ${subset ? `unicode-range: ${subset};` : ""}
}
  `.trim();
}

/**
 * Font optimization recommendations
 */
export const fontOptimizationTips = [
  "Use variable fonts to reduce HTTP requests",
  "Preload critical fonts in <head>",
  "Use font-display: swap to prevent FOIT",
  "Subset fonts to include only needed characters",
  "Use WOFF2 format for best compression",
  "Limit font weights and styles to reduce file size",
  "Use system fonts as fallbacks",
  "Self-host fonts for better control and privacy",
  "Use adjustFontFallback to minimize layout shift",
  "Defer non-critical font loading",
];

/**
 * System font stack (fastest loading, zero bytes)
 */
export const systemFontStack = [
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Roboto",
  "Helvetica Neue",
  "Arial",
  "Noto Sans",
  "sans-serif",
  "Apple Color Emoji",
  "Segoe UI Emoji",
  "Segoe UI Symbol",
  "Noto Color Emoji",
].join(", ");

/**
 * Monospace font stack for code
 */
export const monospaceFontStack = [
  "ui-monospace",
  "SFMono-Regular",
  "SF Mono",
  "Menlo",
  "Consolas",
  "Liberation Mono",
  "monospace",
].join(", ");
