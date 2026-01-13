/**
 * Analytics Manager
 * Centralizza tutti i provider analytics con gestione consensi GDPR
 */

import type {
  AnalyticsConfig,
  AnalyticsManager as IAnalyticsManager,
  AnalyticsProvider,
  AnalyticsEvent,
  EcommerceTransaction,
  PerformanceMetrics,
  ErrorEvent,
  EventName,
  ConsentStatus,
} from './types';

import { GoogleAnalyticsProvider } from './providers/google-analytics';
import { FacebookPixelProvider } from './providers/facebook-pixel';
import { CustomAnalyticsProvider } from './providers/custom-analytics';
import { consentManager } from './privacy/consent-manager';
import { eventTracker } from './events/event-tracker';
import { ecommerceTracker } from './ecommerce/ecommerce-tracker';

export class AnalyticsManager implements IAnalyticsManager {
  private config: AnalyticsConfig | null = null;
  private providers: AnalyticsProvider[] = [];
  private initialized = false;
  private sessionId: string;
  private userId: string | null = null;
  private queue: Array<() => void> = [];

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize analytics with config
   */
  async initialize(config: AnalyticsConfig): Promise<void> {
    if (this.initialized) {
      console.warn('[Analytics] Already initialized');
      return;
    }

    this.config = config;

    // Setup consent listener
    consentManager.onChange((consent) => {
      this.handleConsentChange(consent);
    });

    // Initialize providers based on consent
    await this.initializeProviders();

    // Process queued events
    this.processQueue();

    this.initialized = true;
    console.log('[Analytics] Initialized successfully');
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string): void {
    if (!this.canTrack('analytics')) return;

    // Track with event tracker
    eventTracker.track('page_view', {
      path,
      title: title || document.title,
      referrer: document.referrer,
    });

    // Track with all providers
    this.executeOnProviders((provider) => {
      provider.trackPageView(path, title);
    });
  }

  /**
   * Track event
   */
  trackEvent(name: EventName, properties?: Record<string, any>): void {
    if (!this.canTrack('analytics')) return;

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
      userId: this.userId || undefined,
      sessionId: this.sessionId,
    };

    // Track with event tracker
    eventTracker.track(name, properties);

    // Track with all providers
    this.executeOnProviders((provider) => {
      provider.trackEvent(event);
    });
  }

  /**
   * Track ecommerce transaction
   */
  trackTransaction(transaction: EcommerceTransaction): void {
    if (!this.canTrack('marketing')) return;

    // Track with all providers
    this.executeOnProviders((provider) => {
      provider.trackTransaction(transaction);
    });
  }

  /**
   * Track error
   */
  trackError(error: Error | ErrorEvent): void {
    // Errors are always tracked (necessary)
    const errorEvent: ErrorEvent = 
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            timestamp: Date.now(),
            userId: this.userId || undefined,
            sessionId: this.sessionId,
          }
        : error;

    eventTracker.trackError(errorEvent.message, {
      stack: errorEvent.stack,
      ...errorEvent.context,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metrics: PerformanceMetrics): void {
    if (!this.canTrack('analytics')) return;

    this.trackEvent('performance_metrics', metrics);
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    this.userId = userId;

    this.executeOnProviders((provider) => {
      provider.setUserId(userId);
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.canTrack('analytics')) return;

    this.executeOnProviders((provider) => {
      provider.setUserProperties(properties);
    });
  }

  /**
   * Update consent
   */
  updateConsent(consent: Partial<ConsentStatus>): void {
    consentManager.updateConsent(consent);
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Get event tracker
   */
  getEventTracker() {
    return eventTracker;
  }

  /**
   * Get ecommerce tracker
   */
  getEcommerceTracker() {
    return ecommerceTracker;
  }

  /**
   * Get consent manager
   */
  getConsentManager() {
    return consentManager;
  }

  private async initializeProviders(): Promise<void> {
    if (!this.config) return;

    const { providers } = this.config;

    // Initialize Google Analytics
    if (providers.googleAnalytics?.enabled) {
      const ga = new GoogleAnalyticsProvider(providers.googleAnalytics);
      
      if (this.canTrack('analytics')) {
        await ga.initialize();
      }
      
      this.providers.push(ga);
    }

    // Initialize Facebook Pixel
    if (providers.facebookPixel?.enabled) {
      const fb = new FacebookPixelProvider(providers.facebookPixel);
      
      if (this.canTrack('marketing')) {
        await fb.initialize();
      }
      
      this.providers.push(fb);
    }

    // Initialize Custom Analytics
    if (providers.custom?.enabled) {
      const custom = new CustomAnalyticsProvider(providers.custom);
      await custom.initialize(); // Always initialize (uses necessary cookies)
      this.providers.push(custom);
    }
  }

  private handleConsentChange(consent: ConsentStatus): void {
    // Re-initialize providers based on new consent
    this.providers.forEach(async (provider) => {
      if (provider.name === 'Google Analytics' && consent.analytics) {
        await provider.initialize();
      } else if (provider.name === 'Facebook Pixel' && consent.marketing) {
        await provider.initialize();
      }
    });
  }

  private canTrack(category: 'analytics' | 'marketing'): boolean {
    if (!this.config?.privacy.gdprCompliant) return true;

    if (!this.config.privacy.cookieConsent) return true;

    return consentManager.hasConsent(category);
  }

  private executeOnProviders(fn: (provider: AnalyticsProvider) => void): void {
    if (!this.initialized) {
      // Queue for later
      this.queue.push(() => this.executeOnProviders(fn));
      return;
    }

    this.providers.forEach((provider) => {
      if (provider.enabled) {
        try {
          fn(provider);
        } catch (error) {
          console.error(`[Analytics] Provider ${provider.name} error:`, error);
        }
      }
    });
  }

  private processQueue(): void {
    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      fn?.();
    }
  }

  private generateSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = sessionStorage.getItem('analytics_session_id');
    
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }

    return sessionId;
  }
}

// Export singleton instance
export const analytics = new AnalyticsManager();

// Export classes for custom usage
export {
  GoogleAnalyticsProvider,
  FacebookPixelProvider,
  CustomAnalyticsProvider,
  consentManager,
  eventTracker,
  ecommerceTracker,
};

// Export types
export * from './types';
