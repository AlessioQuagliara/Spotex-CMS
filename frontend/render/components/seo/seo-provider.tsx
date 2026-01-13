"use client";

import { createContext, useContext, ReactNode } from "react";

export interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultImage: string;
  defaultLocale: string;
  twitterHandle?: string;
  facebookAppId?: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
}

interface SEOContextType {
  config: SEOConfig;
}

const SEOContext = createContext<SEOContextType | undefined>(undefined);

interface SEOProviderProps {
  children: ReactNode;
  config: SEOConfig;
}

/**
 * SEO Provider for managing global SEO configuration
 * Provides context for site-wide SEO settings
 */
export function SEOProvider({ children, config }: SEOProviderProps) {
  return <SEOContext.Provider value={{ config }}>{children}</SEOContext.Provider>;
}

/**
 * Hook to access SEO configuration
 */
export function useSEO() {
  const context = useContext(SEOContext);
  
  if (!context) {
    throw new Error("useSEO must be used within SEOProvider");
  }
  
  return context;
}

/**
 * Default SEO configuration
 */
export const defaultSEOConfig: SEOConfig = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Spotex",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://spotex.com",
  defaultTitle: "Spotex - Il tuo negozio online",
  defaultDescription: "Scopri i migliori prodotti nel nostro negozio online",
  defaultImage: "/images/og-image.jpg",
  defaultLocale: "it_IT",
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
  facebookAppId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
  googleSiteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  bingSiteVerification: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
};
