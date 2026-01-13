/**
 * Analytics Provider
 * Provider React per inizializzare e gestire analytics nell'app
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { analytics, type AnalyticsConfig } from '@/shared/lib/analytics';
// import { sentry, performanceMonitor } from '@/shared/lib/monitoring';

interface AnalyticsContextValue {
  initialized: boolean;
  trackEvent: typeof analytics.trackEvent;
  trackPageView: typeof analytics.trackPageView;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  config: AnalyticsConfig;
  sentryDsn?: string;
  environment?: string;
}

export function AnalyticsProvider({
  children,
  config,
  sentryDsn,
  environment = 'production',
}: AnalyticsProviderProps) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        // Initialize analytics
        await analytics.initialize(config);

        // Initialize Sentry if configured
        // if (sentryDsn) {
        //   sentry.initialize({
        //     dsn: sentryDsn,
        //     environment,
        //     enabled: true,
        //     tracesSampleRate: 0.1,
        //     replaysSessionSampleRate: 0.1,
        //     replaysOnErrorSampleRate: 1.0,
        //   });
        // }

        // Initialize performance monitoring
        // performanceMonitor.initialize();

        // Subscribe to performance metrics
        // performanceMonitor.onMetric((metrics) => {
        //   analytics.trackPerformance(metrics);
        // });

        setInitialized(true);
        console.log('[Analytics Provider] Initialized successfully');
      } catch (error) {
        console.error('[Analytics Provider] Initialization failed:', error);
      }
    };

    initializeAnalytics();
  }, [config, sentryDsn, environment]);

  const value: AnalyticsContextValue = {
    initialized,
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }

  return context;
}
