/**
 * Analytics Integration in Layout
 * Add analytics to the main layout
 */
'use client';

import { useEffect } from 'react';
import { AnalyticsProvider, AnalyticsScript, FacebookPixelScript } from '@/components/analytics/analytics-provider';
import { initGA } from '@/lib/analytics';

interface AnalyticsLayoutProps {
  children: React.ReactNode;
  config?: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    enableTracking?: boolean;
    enableFacebookPixel?: boolean;
    debug?: boolean;
  };
}

export function AnalyticsLayout({ children, config }: AnalyticsLayoutProps) {
  // Initialize GA on mount
  useEffect(() => {
    if (config?.enableTracking && config.googleAnalyticsId) {
      initGA({
        measurementId: config.googleAnalyticsId,
        facebookPixelId: config.facebookPixelId,
        enableFacebookPixel: config.enableFacebookPixel,
        debug: config.debug,
        anonymizeIp: true,
        allowAdFeatures: false,
        allowAdPersonalizationSignals: false,
      });
    }
  }, [config]);

  return (
    <>
      {/* Analytics Script in Head */}
      {config?.googleAnalyticsId && (
        <AnalyticsScript measurementId={config.googleAnalyticsId} />
      )}

      {/* Facebook Pixel Script in Head */}
      {config?.facebookPixelId && config?.enableFacebookPixel && (
        <FacebookPixelScript 
          pixelId={config.facebookPixelId} 
          enabled={config.enableFacebookPixel} 
        />
      )}

      {/* Analytics Provider */}
      <AnalyticsProvider
        config={{
          googleAnalyticsId: config?.googleAnalyticsId,
          facebookPixelId: config?.facebookPixelId,
          enableTracking: config?.enableTracking ?? true,
          enableFacebookPixel: config?.enableFacebookPixel ?? false,
          debug: config?.debug ?? false,
          anonymizeIp: true,
          allowAdFeatures: false,
          allowAdPersonalizationSignals: false,
        }}
      >
        {children}
      </AnalyticsProvider>
    </>
  );
}
