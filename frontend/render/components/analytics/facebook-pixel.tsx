/**
 * Facebook Pixel Integration Component
 * Provides Facebook Pixel tracking functionality
 */
'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

interface FacebookPixelProps {
  pixelId: string;
  enabled?: boolean;
}

/**
 * Facebook Pixel Script Component
 * Add this to your layout or page to load Facebook Pixel
 */
export function FacebookPixelScript({ pixelId, enabled = true }: FacebookPixelProps) {
  if (!enabled || !pixelId) return null;

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
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
        `}
      </Script>
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

/**
 * Hook to initialize Facebook Pixel
 */
export function useFacebookPixel(pixelId: string, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || !pixelId || typeof window === 'undefined') return;

    // Initialize if not already loaded
    if (!window.fbq) {
      // Facebook Pixel Code
      (function(f: any, b: any, e: any, v: any, n: any, t: any, s: any) {
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

      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }
  }, [pixelId, enabled]);
}

/**
 * Facebook Pixel Event Types
 */
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
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'Schedule'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe';

export interface FacebookPixelEventParams {
  content_category?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
  currency?: string;
  num_items?: number;
  predicted_ltv?: number;
  search_string?: string;
  status?: boolean;
  value?: number;
  [key: string]: any;
}

/**
 * Facebook Pixel Tracking Class
 */
export class FacebookPixel {
  private pixelId: string;
  private initialized: boolean = false;

  constructor(pixelId: string) {
    this.pixelId = pixelId;
  }

  /**
   * Initialize Facebook Pixel
   */
  init(): void {
    if (this.initialized || typeof window === 'undefined') return;

    if (!window.fbq) {
      console.warn('Facebook Pixel script not loaded');
      return;
    }

    window.fbq('init', this.pixelId);
    this.initialized = true;
  }

  /**
   * Track standard event
   */
  track(eventName: FacebookPixelStandardEvent, params?: FacebookPixelEventParams): void {
    if (typeof window === 'undefined' || !window.fbq) {
      console.warn('Facebook Pixel not available');
      return;
    }

    window.fbq('track', eventName, params);
  }

  /**
   * Track custom event
   */
  trackCustom(eventName: string, params?: FacebookPixelEventParams): void {
    if (typeof window === 'undefined' || !window.fbq) {
      console.warn('Facebook Pixel not available');
      return;
    }

    window.fbq('trackCustom', eventName, params);
  }

  /**
   * Track PageView
   */
  pageView(): void {
    this.track('PageView');
  }

  /**
   * Track ViewContent
   */
  viewContent(params: {
    contentName: string;
    contentCategory?: string;
    contentIds?: string[];
    value?: number;
    currency?: string;
  }): void {
    this.track('ViewContent', {
      content_name: params.contentName,
      content_category: params.contentCategory,
      content_ids: params.contentIds,
      value: params.value,
      currency: params.currency || 'USD',
    });
  }

  /**
   * Track Search
   */
  search(searchString: string, value?: number): void {
    this.track('Search', {
      search_string: searchString,
      value,
    });
  }

  /**
   * Track AddToCart
   */
  addToCart(params: {
    contentName: string;
    contentIds: string[];
    contentType?: string;
    value: number;
    currency?: string;
  }): void {
    this.track('AddToCart', {
      content_name: params.contentName,
      content_ids: params.contentIds,
      content_type: params.contentType || 'product',
      value: params.value,
      currency: params.currency || 'USD',
    });
  }

  /**
   * Track AddToWishlist
   */
  addToWishlist(params: {
    contentName: string;
    contentIds: string[];
    value: number;
    currency?: string;
  }): void {
    this.track('AddToWishlist', {
      content_name: params.contentName,
      content_ids: params.contentIds,
      value: params.value,
      currency: params.currency || 'USD',
    });
  }

  /**
   * Track InitiateCheckout
   */
  initiateCheckout(params: {
    contentIds: string[];
    contents?: Array<{ id: string; quantity: number }>;
    numItems: number;
    value: number;
    currency?: string;
  }): void {
    this.track('InitiateCheckout', {
      content_ids: params.contentIds,
      contents: params.contents,
      num_items: params.numItems,
      value: params.value,
      currency: params.currency || 'USD',
    });
  }

  /**
   * Track Purchase
   */
  purchase(params: {
    contentIds: string[];
    contents?: Array<{ id: string; quantity: number; item_price?: number }>;
    value: number;
    currency?: string;
    numItems?: number;
  }): void {
    this.track('Purchase', {
      content_ids: params.contentIds,
      contents: params.contents,
      value: params.value,
      currency: params.currency || 'USD',
      num_items: params.numItems,
    });
  }

  /**
   * Track Lead
   */
  lead(params?: {
    contentName?: string;
    contentCategory?: string;
    value?: number;
    currency?: string;
  }): void {
    this.track('Lead', params);
  }

  /**
   * Track CompleteRegistration
   */
  completeRegistration(params?: {
    contentName?: string;
    status?: boolean;
    value?: number;
    currency?: string;
  }): void {
    this.track('CompleteRegistration', params);
  }

  /**
   * Track Contact
   */
  contact(): void {
    this.track('Contact');
  }

  /**
   * Track Subscribe
   */
  subscribe(params?: {
    value?: number;
    currency?: string;
    predictedLtv?: number;
  }): void {
    this.track('Subscribe', {
      value: params?.value,
      currency: params?.currency || 'USD',
      predicted_ltv: params?.predictedLtv,
    });
  }
}

/**
 * Helper function to track Facebook Pixel events
 */
export const trackFBEvent = (
  eventName: FacebookPixelStandardEvent,
  params?: FacebookPixelEventParams
): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
};

/**
 * Helper function to track custom Facebook Pixel events
 */
export const trackFBCustomEvent = (
  eventName: string,
  params?: FacebookPixelEventParams
): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params);
  }
};
