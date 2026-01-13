/**
 * Analytics Types & Interfaces
 * Tipizzazione completa per tutti i provider analytics
 */

export interface AnalyticsConfig {
  enabled: boolean;
  debug?: boolean;
  providers: {
    googleAnalytics?: GoogleAnalyticsConfig;
    facebookPixel?: FacebookPixelConfig;
    custom?: CustomAnalyticsConfig;
  };
  privacy: PrivacyConfig;
}

export interface GoogleAnalyticsConfig {
  enabled: boolean;
  measurementId: string;
  options?: {
    anonymizeIp?: boolean;
    cookieFlags?: string;
    cookieDomain?: string;
    cookieExpires?: number;
    sampleRate?: number;
  };
}

export interface FacebookPixelConfig {
  enabled: boolean;
  pixelId: string;
  options?: {
    autoConfig?: boolean;
    debug?: boolean;
  };
}

export interface CustomAnalyticsConfig {
  enabled: boolean;
  endpoint: string;
  apiKey?: string;
  batchSize?: number;
  flushInterval?: number;
}

export interface PrivacyConfig {
  gdprCompliant: boolean;
  cookieConsent: boolean;
  anonymizeIp: boolean;
  dataRetentionDays?: number;
  consentCategories?: ConsentCategory[];
}

export type ConsentCategory = 
  | 'necessary'
  | 'analytics'
  | 'marketing'
  | 'preferences';

export interface ConsentStatus {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: number;
}

// Event Types
export interface AnalyticsEvent {
  name: string;
  category?: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export type EventName = 
  | 'page_view'
  | 'click'
  | 'form_submit'
  | 'search'
  | 'scroll'
  | 'video_play'
  | 'video_complete'
  | 'download'
  | 'outbound_link'
  | 'error'
  | 'purchase'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_item'
  | 'view_cart'
  | 'begin_checkout'
  | 'add_payment_info'
  | 'add_shipping_info'
  | 'login'
  | 'sign_up'
  | 'share'
  | string;

// Ecommerce Types
export interface EcommerceProduct {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  variant?: string;
  price: number;
  quantity: number;
  coupon?: string;
  position?: number;
  list?: string;
}

export interface EcommerceTransaction {
  transactionId: string;
  affiliation?: string;
  revenue: number;
  tax?: number;
  shipping?: number;
  coupon?: string;
  currency?: string;
  items: EcommerceProduct[];
}

export interface EcommerceImpression {
  id: string;
  name: string;
  list: string;
  brand?: string;
  category?: string;
  variant?: string;
  position?: number;
  price?: number;
}

export interface EcommercePromotion {
  id: string;
  name: string;
  creative?: string;
  position?: string;
}

// User Journey Types
export interface UserJourney {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  pages: PageView[];
  events: AnalyticsEvent[];
  referrer?: string;
  landingPage: string;
  exitPage?: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
  country?: string;
  city?: string;
}

export interface PageView {
  path: string;
  title: string;
  timestamp: number;
  duration?: number;
  scrollDepth?: number;
}

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// Performance Types
export interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  tti?: number;
  tbt?: number;
}

// Error Types
export interface ErrorEvent {
  message: string;
  stack?: string;
  filename?: string;
  line?: number;
  column?: number;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
}

// Provider Interface
export interface AnalyticsProvider {
  name: string;
  initialize: () => Promise<void>;
  trackPageView: (path: string, title?: string) => void;
  trackEvent: (event: AnalyticsEvent) => void;
  trackTransaction: (transaction: EcommerceTransaction) => void;
  setUserId: (userId: string) => void;
  setUserProperties: (properties: Record<string, any>) => void;
  enabled: boolean;
}

// Analytics Manager Interface
export interface AnalyticsManager {
  initialize: (config: AnalyticsConfig) => Promise<void>;
  trackPageView: (path: string, title?: string) => void;
  trackEvent: (name: EventName, properties?: Record<string, any>) => void;
  trackTransaction: (transaction: EcommerceTransaction) => void;
  trackError: (error: Error | ErrorEvent) => void;
  trackPerformance: (metrics: PerformanceMetrics) => void;
  setUserId: (userId: string) => void;
  setUserProperties: (properties: Record<string, any>) => void;
  updateConsent: (consent: Partial<ConsentStatus>) => void;
  getSessionId: () => string;
  getUserId: () => string | null;
}
