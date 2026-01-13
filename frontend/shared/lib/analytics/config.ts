/**
 * Analytics Configuration
 * Configurazione centralizzata per tutti i provider analytics
 */

import type { AnalyticsConfig } from './types';

export const getAnalyticsConfig = (): AnalyticsConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    enabled: isProduction,
    debug: !isProduction,
    providers: {
      googleAnalytics: {
        enabled: !!process.env.NEXT_PUBLIC_GA_ID,
        measurementId: process.env.NEXT_PUBLIC_GA_ID || '',
        options: {
          anonymizeIp: true,
          cookieFlags: 'SameSite=None;Secure',
          cookieDomain: 'auto',
          cookieExpires: 63072000, // 2 years
          sampleRate: isProduction ? 100 : 0, // No sampling in dev
        },
      },
      facebookPixel: {
        enabled: !!process.env.NEXT_PUBLIC_FB_PIXEL_ID,
        pixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID || '',
        options: {
          autoConfig: true,
          debug: !isProduction,
        },
      },
      custom: {
        enabled: !!process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
        endpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '',
        apiKey: process.env.NEXT_PUBLIC_ANALYTICS_API_KEY,
        batchSize: 10,
        flushInterval: 30000, // 30 seconds
      },
    },
    privacy: {
      gdprCompliant: true,
      cookieConsent: true,
      anonymizeIp: true,
      dataRetentionDays: 365,
      consentCategories: ['necessary', 'analytics', 'marketing', 'preferences'],
    },
  };
};

export const getSentryConfig = () => ({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development',
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
