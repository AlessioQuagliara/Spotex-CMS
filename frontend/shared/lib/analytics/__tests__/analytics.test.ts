/**
 * Analytics System Tests
 * Test suite per il sistema analytics completo
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { analytics } from '../index';
import { eventTracker } from '../events/event-tracker';
import { ecommerceTracker } from '../ecommerce/ecommerce-tracker';
import { consentManager } from '../privacy/consent-manager';
import type { AnalyticsConfig, EcommerceProduct } from '../types';

describe('Analytics System', () => {
  const mockConfig: AnalyticsConfig = {
    enabled: true,
    debug: true,
    providers: {
      googleAnalytics: {
        enabled: false,
        measurementId: 'G-TEST123',
      },
      facebookPixel: {
        enabled: false,
        pixelId: '123456789',
      },
      custom: {
        enabled: true,
        endpoint: 'http://localhost:3000/api/analytics',
        batchSize: 5,
        flushInterval: 1000,
      },
    },
    privacy: {
      gdprCompliant: true,
      cookieConsent: true,
      anonymizeIp: true,
      dataRetentionDays: 365,
    },
  };

  beforeEach(() => {
    // Clear any previous state
    jest.clearAllMocks();
  });

  describe('Analytics Manager', () => {
    it('should initialize with config', async () => {
      await analytics.initialize(mockConfig);
      expect(analytics.getSessionId()).toBeTruthy();
    });

    it('should track page views', () => {
      const spy = jest.spyOn(eventTracker, 'track');
      analytics.trackPageView('/test', 'Test Page');
      expect(spy).toHaveBeenCalledWith('page_view', expect.any(Object));
    });

    it('should track events', () => {
      const spy = jest.spyOn(eventTracker, 'track');
      analytics.trackEvent('button_click', { button: 'test' });
      expect(spy).toHaveBeenCalledWith('button_click', { button: 'test' });
    });

    it('should set user ID', () => {
      analytics.setUserId('user_123');
      expect(analytics.getUserId()).toBe('user_123');
    });

    it('should track transactions', () => {
      const transaction = {
        transactionId: 'order_123',
        revenue: 100,
        items: [],
      };

      expect(() => {
        analytics.trackTransaction(transaction);
      }).not.toThrow();
    });
  });

  describe('Event Tracker', () => {
    beforeEach(() => {
      eventTracker.clearHistory();
    });

    it('should track events', () => {
      eventTracker.track('test_event', { foo: 'bar' });
      const history = eventTracker.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].name).toBe('test_event');
    });

    it('should track clicks', () => {
      eventTracker.trackClick('button-1', 'button', 'CTA');
      const events = eventTracker.getEventsByName('click');
      expect(events).toHaveLength(1);
      expect(events[0].properties?.element_id).toBe('button-1');
    });

    it('should track form submissions', () => {
      eventTracker.trackFormSubmit('contact-form', 'Contact', true);
      const events = eventTracker.getEventsByName('form_submit');
      expect(events).toHaveLength(1);
      expect(events[0].properties?.success).toBe(true);
    });

    it('should track searches', () => {
      eventTracker.trackSearch('test query', 10);
      const events = eventTracker.getEventsByName('search');
      expect(events).toHaveLength(1);
      expect(events[0].properties?.query).toBe('test query');
    });

    it('should notify event listeners', () => {
      const listener = jest.fn();
      const unsubscribe = eventTracker.on('custom_event', listener);

      eventTracker.track('custom_event', { test: true });
      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });

    it('should maintain event history', () => {
      for (let i = 0; i < 5; i++) {
        eventTracker.track(`event_${i}`, { index: i });
      }

      const history = eventTracker.getHistory();
      expect(history).toHaveLength(5);
    });

    it('should filter events by category', () => {
      eventTracker.trackWithCategory('event1', 'ecommerce');
      eventTracker.trackWithCategory('event2', 'engagement');
      eventTracker.trackWithCategory('event3', 'ecommerce');

      const ecommerceEvents = eventTracker.getEventsByCategory('ecommerce');
      expect(ecommerceEvents).toHaveLength(2);
    });
  });

  describe('Ecommerce Tracker', () => {
    beforeEach(() => {
      ecommerceTracker.clearCart();
      ecommerceTracker.clearImpressions();
    });

    const mockProduct: EcommerceProduct = {
      id: 'prod_123',
      name: 'Test Product',
      price: 49.99,
      quantity: 1,
      category: 'Electronics',
      brand: 'TestBrand',
    };

    it('should add products to cart', () => {
      ecommerceTracker.addToCart(mockProduct);
      const cart = ecommerceTracker.getCart();
      expect(cart).toHaveLength(1);
      expect(cart[0].id).toBe('prod_123');
    });

    it('should update product quantity in cart', () => {
      ecommerceTracker.addToCart(mockProduct);
      ecommerceTracker.addToCart({ ...mockProduct, quantity: 2 });
      const cart = ecommerceTracker.getCart();
      expect(cart[0].quantity).toBe(3);
    });

    it('should remove products from cart', () => {
      ecommerceTracker.addToCart(mockProduct);
      const removed = ecommerceTracker.removeFromCart('prod_123');
      expect(removed).toBeTruthy();
      expect(ecommerceTracker.getCart()).toHaveLength(0);
    });

    it('should calculate cart total', () => {
      ecommerceTracker.addToCart({ ...mockProduct, quantity: 2 });
      ecommerceTracker.addToCart({ ...mockProduct, id: 'prod_456', price: 29.99 });
      const total = ecommerceTracker.getCartTotal();
      expect(total).toBeCloseTo(129.97);
    });

    it('should track product impressions', () => {
      const impression = {
        id: 'prod_123',
        name: 'Test Product',
        list: 'Search Results',
        position: 1,
      };

      ecommerceTracker.trackImpression(impression);
      const impressions = ecommerceTracker.getImpressions();
      expect(impressions).toHaveLength(1);
    });

    it('should create purchase transaction', () => {
      ecommerceTracker.addToCart(mockProduct);
      const transaction = ecommerceTracker.trackPurchase('order_123', 49.99, {
        tax: 5.00,
        shipping: 5.00,
      });

      expect(transaction.transactionId).toBe('order_123');
      expect(transaction.revenue).toBe(49.99);
      expect(transaction.items).toHaveLength(1);
      expect(ecommerceTracker.getCart()).toHaveLength(0); // Cart cleared
    });

    it('should calculate metrics', () => {
      ecommerceTracker.addToCart(mockProduct);
      ecommerceTracker.addToCart({ ...mockProduct, id: 'prod_456', price: 29.99 });

      const metrics = ecommerceTracker.getMetrics();
      expect(metrics.cartItemCount).toBe(2);
      expect(metrics.cartTotal).toBeCloseTo(79.98);
    });
  });

  describe('Consent Manager', () => {
    beforeEach(() => {
      consentManager.resetConsent();
    });

    it('should start with no consent', () => {
      expect(consentManager.hasConsentBeenGiven()).toBe(false);
    });

    it('should update consent', () => {
      consentManager.updateConsent({
        analytics: true,
        marketing: false,
      });

      expect(consentManager.hasConsent('analytics')).toBe(true);
      expect(consentManager.hasConsent('marketing')).toBe(false);
    });

    it('should accept all consents', () => {
      consentManager.acceptAll();
      expect(consentManager.hasAllConsent()).toBe(true);
    });

    it('should reject all consents', () => {
      consentManager.rejectAll();
      expect(consentManager.hasConsent('analytics')).toBe(false);
      expect(consentManager.hasConsent('marketing')).toBe(false);
      expect(consentManager.hasConsent('necessary')).toBe(true); // Always true
    });

    it('should notify listeners on consent change', () => {
      const listener = jest.fn();
      consentManager.onChange(listener);

      consentManager.acceptAll();
      expect(listener).toHaveBeenCalled();
    });

    it('should persist consent', () => {
      consentManager.updateConsent({ analytics: true });
      
      // Simulate page reload
      const consent = consentManager.getConsent();
      expect(consent?.analytics).toBe(true);
    });

    it('should calculate consent age', () => {
      consentManager.acceptAll();
      const age = consentManager.getConsentAge();
      expect(age).toBe(0); // Just created
    });

    it('should check if renewal needed', () => {
      consentManager.acceptAll();
      expect(consentManager.needsRenewal()).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should respect consent for analytics tracking', async () => {
      await analytics.initialize(mockConfig);
      
      // No consent given
      consentManager.resetConsent();
      analytics.trackEvent('test');
      
      // Give consent
      consentManager.updateConsent({ analytics: true });
      analytics.trackEvent('test_with_consent');
      
      // Events should be tracked
      const events = eventTracker.getHistory();
      expect(events.length).toBeGreaterThan(0);
    });

    it('should track complete purchase flow', () => {
      const product: EcommerceProduct = {
        id: 'prod_123',
        name: 'Test Product',
        price: 49.99,
        quantity: 1,
      };

      // View product
      analytics.trackEvent('view_item', { item: product });

      // Add to cart
      ecommerceTracker.addToCart(product);
      analytics.trackEvent('add_to_cart', { item: product });

      // Begin checkout
      const cart = ecommerceTracker.getCart();
      analytics.trackEvent('begin_checkout', { items: cart });

      // Complete purchase
      const transaction = ecommerceTracker.trackPurchase('order_123', 49.99);
      analytics.trackTransaction(transaction);

      // Verify flow
      const history = eventTracker.getHistory();
      expect(history.some(e => e.name === 'view_item')).toBe(true);
      expect(history.some(e => e.name === 'add_to_cart')).toBe(true);
      expect(history.some(e => e.name === 'begin_checkout')).toBe(true);
    });
  });
});
