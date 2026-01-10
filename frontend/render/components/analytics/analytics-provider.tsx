/**
 * Analytics Provider Component
 * Provides analytics context and automatic tracking
 */
'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { initGA, usePageTracking, useScrollTracking, useTimeTracking } from '@/lib/analytics';

interface AnalyticsConfig {
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  enableTracking?: boolean;
  enableFacebookPixel?: boolean;
  debug?: boolean;
  anonymizeIp?: boolean;
  allowAdFeatures?: boolean;
  allowAdPersonalizationSignals?: boolean;
}

interface AnalyticsContextType {
  config: AnalyticsConfig;
  trackEvent: (eventName: string, parameters?: any) => void;
  trackFBEvent: (eventName: string, parameters?: any) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  config: AnalyticsConfig;
}

export function AnalyticsProvider({ children, config }: AnalyticsProviderProps) {
  // Initialize GA if enabled
  useEffect(() => {
    if (config.enableTracking && config.googleAnalyticsId) {
      initGA({
        measurementId: config.googleAnalyticsId,
        facebookPixelId: config.facebookPixelId,
        enableFacebookPixel: config.enableFacebookPixel,
        debug: config.debug,
        anonymizeIp: config.anonymizeIp,
        allowAdFeatures: config.allowAdFeatures,
        allowAdPersonalizationSignals: config.allowAdPersonalizationSignals,
      });
    }
  }, [config]);

  // Automatic tracking hooks
  usePageTracking();
  useScrollTracking();
  useTimeTracking();

  const trackEvent = (eventName: string, parameters: any = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  };

  const trackFBEvent = (eventName: string, parameters: any = {}) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', eventName, parameters);
    }
  };

  const value = {
    config,
    trackEvent,
    trackFBEvent,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Hook to use analytics context
 */
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

/**
 * Analytics script component for head
 */
export function AnalyticsScript({ measurementId }: { measurementId: string }) {
  if (!measurementId) return null;

  return (
    <>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              anonymize_ip: true,
              allow_google_signals: true,
              allow_ad_personalization_signals: true
            });
          `,
        }}
      />
    </>
  );
}

/**
 * Facebook Pixel script component for head
 */
export function FacebookPixelScript({ pixelId, enabled = true }: { pixelId: string; enabled?: boolean }) {
  if (!enabled || !pixelId) return null;

  return (
    <>
      <script
        id="facebook-pixel"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
