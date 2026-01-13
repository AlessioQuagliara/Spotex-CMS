/**
 * Analytics Hook for Render Frontend
 * React hook per tracking completo con pageview, events, ecommerce
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@/shared/lib/analytics';
import type { EventName, EcommerceProduct, EcommerceTransaction } from '@/shared/lib/analytics';

export interface UseAnalyticsOptions {
  trackPageViews?: boolean;
  trackScrollDepth?: boolean;
  trackTimeOnPage?: boolean;
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    trackPageViews = true,
    trackScrollDepth = true,
    trackTimeOnPage = true,
  } = options;

  const pageStartTime = useRef<number>(Date.now());
  const scrollDepthTracked = useRef<Set<number>>(new Set());

  // Track page views
  useEffect(() => {
    if (!trackPageViews) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    analytics.trackPageView(url);

    // Reset page start time
    pageStartTime.current = Date.now();
    scrollDepthTracked.current.clear();
  }, [pathname, searchParams, trackPageViews]);

  // Track scroll depth
  useEffect(() => {
    if (!trackScrollDepth) return;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercentage = Math.round(
        ((scrollTop + windowHeight) / documentHeight) * 100
      );

      // Track at 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];
      const milestone = milestones.find(
        (m) => scrollPercentage >= m && !scrollDepthTracked.current.has(m)
      );

      if (milestone) {
        scrollDepthTracked.current.add(milestone);
        analytics.trackEvent('scroll_depth', {
          depth: milestone,
          page: pathname,
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname, trackScrollDepth]);

  // Track time on page
  useEffect(() => {
    if (!trackTimeOnPage) return;

    return () => {
      const timeOnPage = Date.now() - pageStartTime.current;
      analytics.trackEvent('time_on_page', {
        duration: timeOnPage,
        page: pathname,
      });
    };
  }, [pathname, trackTimeOnPage]);

  // Track event
  const trackEvent = useCallback((name: EventName, properties?: Record<string, any>) => {
    analytics.trackEvent(name, properties);
  }, []);

  // Track click
  const trackClick = useCallback((elementId: string, label?: string) => {
    analytics.trackEvent('click', {
      element_id: elementId,
      label,
      page: pathname,
    });
  }, [pathname]);

  // Track search
  const trackSearch = useCallback((query: string, results?: number) => {
    analytics.trackEvent('search', {
      query,
      results,
      page: pathname,
    });
  }, [pathname]);

  // Track product view
  const trackProductView = useCallback((product: {
    id: string;
    name: string;
    price: number;
    category?: string;
    brand?: string;
  }) => {
    analytics.trackEvent('view_item', {
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category,
        item_brand: product.brand,
      }],
      value: product.price,
      currency: 'EUR',
    });
  }, []);

  // Track add to cart
  const trackAddToCart = useCallback((product: EcommerceProduct) => {
    const ecommerceTracker = analytics.getEcommerceTracker();
    ecommerceTracker.addToCart(product);

    analytics.trackEvent('add_to_cart', {
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: product.quantity,
        item_category: product.category,
        item_brand: product.brand,
      }],
      value: product.price * product.quantity,
      currency: 'EUR',
    });
  }, []);

  // Track remove from cart
  const trackRemoveFromCart = useCallback((product: EcommerceProduct) => {
    const ecommerceTracker = analytics.getEcommerceTracker();
    ecommerceTracker.removeFromCart(product.id, product.quantity);

    analytics.trackEvent('remove_from_cart', {
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: product.quantity,
      }],
      value: product.price * product.quantity,
      currency: 'EUR',
    });
  }, []);

  // Track begin checkout
  const trackBeginCheckout = useCallback((items: EcommerceProduct[], value: number) => {
    analytics.trackEvent('begin_checkout', {
      items: items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      value,
      currency: 'EUR',
    });
  }, []);

  // Track purchase
  const trackPurchase = useCallback((transaction: EcommerceTransaction) => {
    analytics.trackTransaction(transaction);

    analytics.trackEvent('purchase', {
      transaction_id: transaction.transactionId,
      value: transaction.revenue,
      tax: transaction.tax,
      shipping: transaction.shipping,
      currency: transaction.currency || 'EUR',
      coupon: transaction.coupon,
      items: transaction.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
        item_brand: item.brand,
      })),
    });
  }, []);

  // Track form submission
  const trackFormSubmit = useCallback((formId: string, success: boolean = true) => {
    analytics.trackEvent('form_submit', {
      form_id: formId,
      success,
      page: pathname,
    });
  }, [pathname]);

  // Track video interaction
  const trackVideo = useCallback((
    action: 'play' | 'pause' | 'complete',
    videoTitle: string,
    currentTime?: number
  ) => {
    analytics.trackEvent(`video_${action}` as EventName, {
      video_title: videoTitle,
      current_time: currentTime,
      page: pathname,
    });
  }, [pathname]);

  // Track share
  const trackShare = useCallback((method: string, contentType: string, itemId: string) => {
    analytics.trackEvent('share', {
      method,
      content_type: contentType,
      item_id: itemId,
    });
  }, []);

  // Track user login
  const trackLogin = useCallback((method: string) => {
    analytics.trackEvent('login', {
      method,
    });
  }, []);

  // Track user signup
  const trackSignUp = useCallback((method: string) => {
    analytics.trackEvent('sign_up', {
      method,
    });
  }, []);

  return {
    // General tracking
    trackEvent,
    trackClick,
    trackSearch,
    trackFormSubmit,
    trackVideo,
    trackShare,
    
    // User tracking
    trackLogin,
    trackSignUp,
    
    // Ecommerce tracking
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackBeginCheckout,
    trackPurchase,
    
    // Utilities
    analytics,
  };
}
