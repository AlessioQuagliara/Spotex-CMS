/**
 * Facebook Pixel Provider
 * Implementazione completa con eventi standard e custom
 */

import type {
  AnalyticsProvider,
  AnalyticsEvent,
  EcommerceTransaction,
  FacebookPixelConfig,
} from '../types';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export class FacebookPixelProvider implements AnalyticsProvider {
  name = 'Facebook Pixel';
  enabled = false;
  private config: FacebookPixelConfig;
  private initialized = false;

  constructor(config: FacebookPixelConfig) {
    this.config = config;
    this.enabled = config.enabled;
  }

  async initialize(): Promise<void> {
    if (!this.enabled || this.initialized) return;

    try {
      // Inject Facebook Pixel script
      const script = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
      `;

      const scriptElement = document.createElement('script');
      scriptElement.innerHTML = script;
      document.head.appendChild(scriptElement);

      // Initialize pixel
      if (window.fbq) {
        window.fbq('init', this.config.pixelId, {
          autoConfig: this.config.options?.autoConfig ?? true,
          debug: this.config.options?.debug ?? false,
        });

        // Track initial page view
        window.fbq('track', 'PageView');

        this.initialized = true;
        console.log('[Facebook Pixel] Initialized successfully');
      }
    } catch (error) {
      console.error('[Facebook Pixel] Initialization failed:', error);
      this.enabled = false;
    }
  }

  trackPageView(path: string, title?: string): void {
    if (!this.enabled || !window.fbq) return;

    window.fbq('track', 'PageView', {
      page_path: path,
      page_title: title,
    });
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!this.enabled || !window.fbq) return;

    const { name, properties } = event;

    // Map to Facebook standard events
    const standardEvents = [
      'AddPaymentInfo',
      'AddToCart',
      'AddToWishlist',
      'CompleteRegistration',
      'Contact',
      'CustomizeProduct',
      'Donate',
      'FindLocation',
      'InitiateCheckout',
      'Lead',
      'Purchase',
      'Schedule',
      'Search',
      'StartTrial',
      'SubmitApplication',
      'Subscribe',
      'ViewContent',
    ];

    const eventName = this.mapEventName(name);
    const isStandard = standardEvents.includes(eventName);

    if (isStandard) {
      window.fbq('track', eventName, properties);
    } else {
      window.fbq('trackCustom', name, properties);
    }
  }

  trackTransaction(transaction: EcommerceTransaction): void {
    if (!this.enabled || !window.fbq) return;

    window.fbq('track', 'Purchase', {
      value: transaction.revenue,
      currency: transaction.currency || 'EUR',
      content_type: 'product',
      content_ids: transaction.items.map((item) => item.id),
      contents: transaction.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        item_price: item.price,
      })),
      num_items: transaction.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }

  trackAddToCart(product: any): void {
    if (!this.enabled || !window.fbq) return;

    window.fbq('track', 'AddToCart', {
      content_type: 'product',
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      value: product.price * product.quantity,
      currency: 'EUR',
      contents: [{
        id: product.id,
        quantity: product.quantity,
        item_price: product.price,
      }],
    });
  }

  trackViewContent(product: any): void {
    if (!this.enabled || !window.fbq) return;

    window.fbq('track', 'ViewContent', {
      content_type: 'product',
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      value: product.price,
      currency: 'EUR',
    });
  }

  trackInitiateCheckout(items: any[], value: number): void {
    if (!this.enabled || !window.fbq) return;

    window.fbq('track', 'InitiateCheckout', {
      content_type: 'product',
      content_ids: items.map((item) => item.id),
      value: value,
      currency: 'EUR',
      num_items: items.reduce((sum, item) => sum + item.quantity, 0),
      contents: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        item_price: item.price,
      })),
    });
  }

  trackSearch(searchTerm: string): void {
    if (!this.enabled || !window.fbq) return;

    window.fbq('track', 'Search', {
      search_string: searchTerm,
    });
  }

  trackLead(value?: number): void {
    if (!this.enabled || !window.fbq) return;

    window.fbq('track', 'Lead', {
      value: value,
      currency: 'EUR',
    });
  }

  trackCompleteRegistration(): void {
    if (!this.enabled || !window.fbq) return;

    window.fbq('track', 'CompleteRegistration', {
      status: 'completed',
    });
  }

  setUserId(userId: string): void {
    if (!this.enabled || !window.fbq) return;

    // Facebook Pixel doesn't have a direct setUserId method
    // Use external_id in advanced matching
    window.fbq('init', this.config.pixelId, {
      external_id: userId,
    });
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this.enabled || !window.fbq) return;

    // Facebook Pixel uses advanced matching for user properties
    const advancedMatching: any = {};

    if (properties.email) advancedMatching.em = properties.email;
    if (properties.phone) advancedMatching.ph = properties.phone;
    if (properties.firstName) advancedMatching.fn = properties.firstName;
    if (properties.lastName) advancedMatching.ln = properties.lastName;
    if (properties.city) advancedMatching.ct = properties.city;
    if (properties.state) advancedMatching.st = properties.state;
    if (properties.zipCode) advancedMatching.zp = properties.zipCode;
    if (properties.country) advancedMatching.country = properties.country;

    if (Object.keys(advancedMatching).length > 0) {
      window.fbq('init', this.config.pixelId, advancedMatching);
    }
  }

  private mapEventName(name: string): string {
    const eventMap: Record<string, string> = {
      add_to_cart: 'AddToCart',
      add_to_wishlist: 'AddToWishlist',
      begin_checkout: 'InitiateCheckout',
      purchase: 'Purchase',
      search: 'Search',
      view_item: 'ViewContent',
      sign_up: 'CompleteRegistration',
      login: 'Login',
      add_payment_info: 'AddPaymentInfo',
    };

    return eventMap[name.toLowerCase()] || name;
  }
}
