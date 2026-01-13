/**
 * Google Analytics 4 & Facebook Pixel Integration
 * Complete GA4 and Facebook Pixel setup with gtag and custom events
 */
'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
interface GA4Config {
  measurementId: string;
  debug?: boolean;
  anonymizeIp?: boolean;
  allowAdFeatures?: boolean;
  allowAdPersonalizationSignals?: boolean;
  facebookPixelId?: string;
  enableFacebookPixel?: boolean;
}

interface EventParams {
  [key: string]: any;
}

// Facebook Pixel Event Types
export type FacebookPixelStandardEvent =
  | 'PageView'
  | 'ViewContent'
  | 'Search'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Lead'
  | 'CompleteRegistration';

class GoogleAnalytics {
  private measurementId: string;
  private config: GA4Config;
  private initialized = false;
  private fbPixelInitialized = false;

  constructor(config: GA4Config) {
    this.measurementId = config.measurementId;
    this.config = config;
  }

  /**
   * Initialize GA4
   */
  init(): void {
    if (this.initialized || typeof window === 'undefined') return;

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    (window as any).dataLayer = (window as any).dataLayer || [];

    // Initialize gtag
    (window as any).gtag = function() {
      (window as any).dataLayer.push(arguments);
    };

    (window as any).gtag('js', new Date());

    // Configure GA4
    const gaConfig: any = {
      anonymize_ip: this.config.anonymizeIp,
      allow_google_signals: this.config.allowAdFeatures,
      allow_ad_personalization_signals: this.config.allowAdPersonalizationSignals,
    };

    if (this.config.debug) {
      gaConfig.debug_mode = true;
    }

    (window as any).gtag('config', this.measurementId, gaConfig);

    this.initialized = true;

    // Initialize Facebook Pixel if configured
    if (this.config.enableFacebookPixel && this.config.facebookPixelId) {
      this.initFacebookPixel();
    }
  }

  /**
   * Initialize Facebook Pixel
   */
  private initFacebookPixel(): void {
    if (this.fbPixelInitialized || typeof window === 'undefined') return;
    if (!this.config.facebookPixelId) return;

    // Load Facebook Pixel
    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      'script',
      'https://connect.facebook.net/en_US/fbevents.js'
    );

    if (window.fbq) {
      window.fbq('init', this.config.facebookPixelId);
      window.fbq('track', 'PageView');
    }

    this.fbPixelInitialized = true;
  }

  /**
   * Track page view
   */
  pageview(path: string, title?: string): void {
    if (!this.initialized) return;

    (window as any).gtag('config', this.measurementId, {
      page_title: title,
      page_location: window.location.href,
      page_path: path,
    });

    // Track on Facebook Pixel too
    if (this.fbPixelInitialized && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }

  /**
   * Track custom event
   */
  event(eventName: string, parameters: EventParams = {}): void {
    if (!this.initialized) return;

    (window as any).gtag('event', eventName, {
      ...parameters,
      timestamp: Date.now(),
    });
  }

  /**
   * Track user engagement
   */
  engagement(action: string, category: string, label?: string, value?: number): void {
    this.event('engagement', {
      action,
      category,
      label,
      value,
    });
  }

  /**
   * Track scroll depth
   */
  scrollDepth(percentage: number): void {
    this.event('scroll', {
      percent_scrolled: percentage,
    });
  }

  /**
   * Track time spent on page
   */
  timeOnPage(seconds: number, page: string): void {
    this.event('time_on_page', {
      time_seconds: seconds,
      page_path: page,
    });
  }

  /**
   * Track search
   */
  search(searchTerm: string, resultsCount?: number): void {
    this.event('search', {
      search_term: searchTerm,
      results_count: resultsCount,
    });

    // Track on Facebook Pixel
    if (this.fbPixelInitialized && window.fbq) {
      window.fbq('track', 'Search', {
        search_string: searchTerm,
      });
    }
  }

  /**
   * Track content interaction
   */
  contentInteraction(action: 'view' | 'share' | 'download' | 'print', contentType: string, contentId: string): void {
    this.event('content_interaction', {
      action,
      content_type: contentType,
      content_id: contentId,
    });

    // Track ViewContent on Facebook Pixel
    if (this.fbPixelInitialized && window.fbq && action === 'view') {
      window.fbq('track', 'ViewContent', {
        content_type: contentType,
        content_ids: [contentId],
      });
    }
  }

  /**
   * Facebook Pixel - Track ViewContent
   */
  fbViewContent(params: {
    contentName: string;
    contentCategory?: string;
    contentIds?: string[];
    value?: number;
    currency?: string;
  }): void {
    if (!this.fbPixelInitialized || !window.fbq) return;

    window.fbq('track', 'ViewContent', {
      content_name: params.contentName,
      content_category: params.contentCategory,
      content_ids: params.contentIds,
      value: params.value,
      currency: params.currency || 'USD',
    });
  }

  /**
   * Facebook Pixel - Track AddToCart
   */
  fbAddToCart(params: {
    contentName: string;
    contentIds: string[];
    contentType?: string;
    value: number;
    currency?: string;
  }): void {
    if (!this.fbPixelInitialized || !window.fbq) return;

    window.fbq('track', 'AddToCart', {
      content_name: params.contentName,
      content_ids: params.contentIds,
      content_type: params.contentType || 'product',
      value: params.value,
      currency: params.currency || 'USD',
    });
  }

  /**
   * Facebook Pixel - Track AddToWishlist
   */
  fbAddToWishlist(params: {
    contentName: string;
    contentIds: string[];
    value: number;
    currency?: string;
  }): void {
    if (!this.fbPixelInitialized || !window.fbq) return;

    window.fbq('track', 'AddToWishlist', {
      content_name: params.contentName,
      content_ids: params.contentIds,
      value: params.value,
      currency: params.currency || 'USD',
    });
  }

  /**
   * Facebook Pixel - Track InitiateCheckout
   */
  fbInitiateCheckout(params: {
    contentIds: string[];
    contents?: Array<{ id: string; quantity: number }>;
    numItems: number;
    value: number;
    currency?: string;
  }): void {
    if (!this.fbPixelInitialized || !window.fbq) return;

    window.fbq('track', 'InitiateCheckout', {
      content_ids: params.contentIds,
      contents: params.contents,
      num_items: params.numItems,
      value: params.value,
      currency: params.currency || 'USD',
    });
  }

  /**
   * Facebook Pixel - Track Purchase
   */
  fbPurchase(params: {
    contentIds: string[];
    contents?: Array<{ id: string; quantity: number; item_price?: number }>;
    value: number;
    currency?: string;
    numItems?: number;
  }): void {
    if (!this.fbPixelInitialized || !window.fbq) return;

    window.fbq('track', 'Purchase', {
      content_ids: params.contentIds,
      contents: params.contents,
      value: params.value,
      currency: params.currency || 'USD',
      num_items: params.numItems,
    });
  }

  /**
   * Facebook Pixel - Track Lead
   */
  fbLead(params?: {
    contentName?: string;
    contentCategory?: string;
    value?: number;
    currency?: string;
  }): void {
    if (!this.fbPixelInitialized || !window.fbq) return;

    window.fbq('track', 'Lead', params);
  }

  /**
   * Facebook Pixel - Track CompleteRegistration
   */
  fbCompleteRegistration(params?: {
    contentName?: string;
    status?: boolean;
    value?: number;
    currency?: string;
  }): void {
    if (!this.fbPixelInitialized || !window.fbq) return;

    window.fbq('track', 'CompleteRegistration', params);
  }

  /**
   * Facebook Pixel - Track custom event
   */
  fbCustomEvent(eventName: string, params?: any): void {
    if (!this.fbPixelInitialized || !window.fbq) return;

    window.fbq('trackCustom', eventName, params);
  }

  /**
   * Track form interaction
   */
  formInteraction(formId: string, action: 'start' | 'complete' | 'abandon', step?: number): void {
    this.event('form_interaction', {
      form_id: formId,
      action,
      step,
    });
  }

  /**
   * Track e-commerce events (future implementation)
   */
  purchase(transactionId: string, value: number, currency: string, items: any[]): void {
    this.event('purchase', {
      transaction_id: transactionId,
      value,
      currency,
      items,
    });
  }

  /**
   * Track custom conversion
   */
  conversion(conversionName: string, value?: number): void {
    this.event('conversion', {
      conversion_name: conversionName,
      value,
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: { [key: string]: any }): void {
    if (!this.initialized) return;

    (window as any).gtag('config', this.measurementId, {
      custom_map: properties,
    });
  }

  /**
   * Track error
   */
  error(errorMessage: string, errorType: string, fatal: boolean = false): void {
    this.event('exception', {
      description: errorMessage,
      error_type: errorType,
      fatal,
    });
  }

  /**
   * Track performance metrics
   */
  performance(metric: string, value: number): void {
    this.event('performance', {
      metric_name: metric,
      metric_value: value,
    });
  }
}

// Global GA instance
let gaInstance: GoogleAnalytics | null = null;

/**
 * Initialize Google Analytics
 */
export function initGA(config: GA4Config): GoogleAnalytics {
  if (!gaInstance) {
    gaInstance = new GoogleAnalytics(config);
    gaInstance.init();
  }
  return gaInstance;
}

/**
 * Get GA instance
 */
export function getGA(): GoogleAnalytics | null {
  return gaInstance;
}

/**
 * Hook for automatic pageview tracking
 */
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ga = getGA();
    if (ga) {
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      ga.pageview(url, document.title);
    }
  }, [pathname, searchParams]);
}

/**
 * Hook for scroll depth tracking
 */
export function useScrollTracking(thresholds: number[] = [25, 50, 75, 90]) {
  useEffect(() => {
    const ga = getGA();
    if (!ga) return;

    let maxScroll = 0;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;

        // Check if we've crossed any thresholds
        thresholds.forEach(threshold => {
          if (maxScroll >= threshold && maxScroll - 1 < threshold) {
            ga.scrollDepth(threshold);
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [thresholds]);
}

/**
 * Hook for time on page tracking
 */
export function useTimeTracking() {
  const pathname = usePathname();

  useEffect(() => {
    const ga = getGA();
    if (!ga) return;

    const startTime = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      ga.timeOnPage(timeSpent, pathname);
    };
  }, [pathname]);
}

/**
 * Hook for form tracking
 */
export function useFormTracking(formId: string) {
  const ga = getGA();

  const trackFormStart = useCallback(() => {
    ga?.formInteraction(formId, 'start');
  }, [ga, formId]);

  const trackFormComplete = useCallback(() => {
    ga?.formInteraction(formId, 'complete');
  }, [ga, formId]);

  const trackFormAbandon = useCallback(() => {
    ga?.formInteraction(formId, 'abandon');
  }, [ga, formId]);

  return {
    trackFormStart,
    trackFormComplete,
    trackFormAbandon,
  };
}

/**
 * Hook for content interaction tracking
 */
export function useContentTracking(contentType: string, contentId: string) {
  const ga = getGA();

  const trackView = useCallback(() => {
    ga?.contentInteraction('view', contentType, contentId);
  }, [ga, contentType, contentId]);

  const trackShare = useCallback(() => {
    ga?.contentInteraction('share', contentType, contentId);
  }, [ga, contentType, contentId]);

  const trackDownload = useCallback(() => {
    ga?.contentInteraction('download', contentType, contentId);
  }, [ga, contentType, contentId]);

  return {
    trackView,
    trackShare,
    trackDownload,
  };
}

/**
 * Track search with debouncing
 */
export function useSearchTracking() {
  const ga = getGA();

  const trackSearch = useCallback((searchTerm: string, resultsCount?: number) => {
    if (ga && searchTerm.length > 2) {
      ga.search(searchTerm, resultsCount);
    }
  }, [ga]);

  return trackSearch;
}

/**
 * Track errors globally
 */
export function trackError(error: Error, errorType: string = 'javascript', fatal: boolean = false) {
  const ga = getGA();
  ga?.error(error.message, errorType, fatal);
}

/**
 * Track performance metrics
 */
export function trackPerformance(metric: string, value: number) {
  const ga = getGA();
  ga?.performance(metric, value);
}
