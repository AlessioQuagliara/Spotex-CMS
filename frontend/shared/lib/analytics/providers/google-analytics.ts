/**
 * Google Analytics 4 Provider
 * Implementazione completa GA4 con enhanced ecommerce
 */

import type {
  AnalyticsProvider,
  AnalyticsEvent,
  EcommerceTransaction,
  GoogleAnalyticsConfig,
} from '../types';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export class GoogleAnalyticsProvider implements AnalyticsProvider {
  name = 'Google Analytics';
  enabled = false;
  private config: GoogleAnalyticsConfig;
  private initialized = false;

  constructor(config: GoogleAnalyticsConfig) {
    this.config = config;
    this.enabled = config.enabled;
  }

  async initialize(): Promise<void> {
    if (!this.enabled || this.initialized) return;

    try {
      // Inject gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.measurementId}`;
      document.head.appendChild(script);

      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer?.push(arguments);
      };

      // Configure GA4
      window.gtag('js', new Date());
      window.gtag('config', this.config.measurementId, {
        anonymize_ip: this.config.options?.anonymizeIp ?? true,
        cookie_flags: this.config.options?.cookieFlags ?? 'SameSite=None;Secure',
        cookie_domain: this.config.options?.cookieDomain ?? 'auto',
        cookie_expires: this.config.options?.cookieExpires ?? 63072000, // 2 years
        sample_rate: this.config.options?.sampleRate ?? 100,
      });

      this.initialized = true;
      console.log('[GA4] Initialized successfully');
    } catch (error) {
      console.error('[GA4] Initialization failed:', error);
      this.enabled = false;
    }
  }

  trackPageView(path: string, title?: string): void {
    if (!this.enabled || !window.gtag) return;

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!this.enabled || !window.gtag) return;

    const { name, category, label, value, properties } = event;

    window.gtag('event', name, {
      event_category: category,
      event_label: label,
      value: value,
      ...properties,
    });
  }

  trackTransaction(transaction: EcommerceTransaction): void {
    if (!this.enabled || !window.gtag) return;

    // GA4 purchase event
    window.gtag('event', 'purchase', {
      transaction_id: transaction.transactionId,
      affiliation: transaction.affiliation,
      value: transaction.revenue,
      tax: transaction.tax,
      shipping: transaction.shipping,
      currency: transaction.currency || 'EUR',
      coupon: transaction.coupon,
      items: transaction.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        item_brand: item.brand,
        item_variant: item.variant,
        price: item.price,
        quantity: item.quantity,
        coupon: item.coupon,
        index: item.position,
        item_list_name: item.list,
      })),
    });
  }

  trackAddToCart(product: any): void {
    if (!this.enabled || !window.gtag) return;

    window.gtag('event', 'add_to_cart', {
      currency: 'EUR',
      value: product.price * product.quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        item_brand: product.brand,
        item_variant: product.variant,
        price: product.price,
        quantity: product.quantity,
      }],
    });
  }

  trackRemoveFromCart(product: any): void {
    if (!this.enabled || !window.gtag) return;

    window.gtag('event', 'remove_from_cart', {
      currency: 'EUR',
      value: product.price * product.quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: product.quantity,
      }],
    });
  }

  trackViewItem(product: any): void {
    if (!this.enabled || !window.gtag) return;

    window.gtag('event', 'view_item', {
      currency: 'EUR',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        item_brand: product.brand,
        price: product.price,
      }],
    });
  }

  trackBeginCheckout(items: any[], value: number): void {
    if (!this.enabled || !window.gtag) return;

    window.gtag('event', 'begin_checkout', {
      currency: 'EUR',
      value: value,
      items: items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  trackSearch(searchTerm: string, results?: number): void {
    if (!this.enabled || !window.gtag) return;

    window.gtag('event', 'search', {
      search_term: searchTerm,
      search_results: results,
    });
  }

  setUserId(userId: string): void {
    if (!this.enabled || !window.gtag) return;

    window.gtag('set', { user_id: userId });
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this.enabled || !window.gtag) return;

    window.gtag('set', 'user_properties', properties);
  }

  // Enhanced Measurement Events
  trackScroll(percentage: number): void {
    if (!this.enabled || !window.gtag) return;

    window.gtag('event', 'scroll', {
      scroll_depth: percentage,
      page_path: window.location.pathname,
    });
  }

  trackOutboundLink(url: string, label?: string): void {
    if (!this.enabled || !window.gtag) return;

    window.gtag('event', 'click', {
      event_category: 'outbound',
      event_label: label || url,
      transport_type: 'beacon',
    });
  }

  trackFormSubmit(formId: string, formName?: string): void {
    if (!this.enabled || !window.gtag) return;

    window.gtag('event', 'form_submit', {
      form_id: formId,
      form_name: formName,
    });
  }

  trackVideoPlay(videoTitle: string, videoUrl?: string): void {
    if (!this.enabled || !window.gtag) return;

    window.gtag('event', 'video_start', {
      video_title: videoTitle,
      video_url: videoUrl,
    });
  }

  trackVideoComplete(videoTitle: string, duration?: number): void {
    if (!this.enabled || !window.gtag) return;

    window.gtag('event', 'video_complete', {
      video_title: videoTitle,
      video_duration: duration,
    });
  }
}
