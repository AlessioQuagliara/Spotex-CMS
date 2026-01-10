/**
 * Facebook Pixel Hooks
 * Custom React hooks for Facebook Pixel tracking
 */
'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { getGA } from '@/lib/analytics';

/**
 * Hook to track Facebook Pixel PageView automatically
 */
export function useFacebookPixelPageView() {
  const pathname = usePathname();

  useEffect(() => {
    const ga = getGA();
    if (ga) {
      // PageView is already tracked by the main pageview function
      // This hook is for additional custom tracking if needed
    }
  }, [pathname]);
}

/**
 * Hook for Facebook Pixel e-commerce tracking
 */
export function useFacebookPixelEcommerce() {
  const ga = getGA();

  const trackViewContent = useCallback(
    (params: {
      contentName: string;
      contentCategory?: string;
      contentIds?: string[];
      value?: number;
      currency?: string;
    }) => {
      ga?.fbViewContent(params);
    },
    [ga]
  );

  const trackAddToCart = useCallback(
    (params: {
      contentName: string;
      contentIds: string[];
      contentType?: string;
      value: number;
      currency?: string;
    }) => {
      ga?.fbAddToCart(params);
    },
    [ga]
  );

  const trackAddToWishlist = useCallback(
    (params: {
      contentName: string;
      contentIds: string[];
      value: number;
      currency?: string;
    }) => {
      ga?.fbAddToWishlist(params);
    },
    [ga]
  );

  const trackInitiateCheckout = useCallback(
    (params: {
      contentIds: string[];
      contents?: Array<{ id: string; quantity: number }>;
      numItems: number;
      value: number;
      currency?: string;
    }) => {
      ga?.fbInitiateCheckout(params);
    },
    [ga]
  );

  const trackPurchase = useCallback(
    (params: {
      contentIds: string[];
      contents?: Array<{ id: string; quantity: number; item_price?: number }>;
      value: number;
      currency?: string;
      numItems?: number;
    }) => {
      ga?.fbPurchase(params);
    },
    [ga]
  );

  return {
    trackViewContent,
    trackAddToCart,
    trackAddToWishlist,
    trackInitiateCheckout,
    trackPurchase,
  };
}

/**
 * Hook for Facebook Pixel lead generation tracking
 */
export function useFacebookPixelLeads() {
  const ga = getGA();

  const trackLead = useCallback(
    (params?: {
      contentName?: string;
      contentCategory?: string;
      value?: number;
      currency?: string;
    }) => {
      ga?.fbLead(params);
    },
    [ga]
  );

  const trackCompleteRegistration = useCallback(
    (params?: {
      contentName?: string;
      status?: boolean;
      value?: number;
      currency?: string;
    }) => {
      ga?.fbCompleteRegistration(params);
    },
    [ga]
  );

  return {
    trackLead,
    trackCompleteRegistration,
  };
}

/**
 * Hook for Facebook Pixel custom events
 */
export function useFacebookPixelCustomEvents() {
  const ga = getGA();

  const trackCustomEvent = useCallback(
    (eventName: string, params?: any) => {
      ga?.fbCustomEvent(eventName, params);
    },
    [ga]
  );

  return {
    trackCustomEvent,
  };
}

/**
 * Combined hook with all Facebook Pixel tracking methods
 */
export function useFacebookPixel() {
  const ecommerce = useFacebookPixelEcommerce();
  const leads = useFacebookPixelLeads();
  const custom = useFacebookPixelCustomEvents();

  return {
    ...ecommerce,
    ...leads,
    ...custom,
  };
}
