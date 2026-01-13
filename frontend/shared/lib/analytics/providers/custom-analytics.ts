/**
 * Custom Analytics Provider
 * Provider personalizzato per backend Spotex
 */

import type {
  AnalyticsProvider,
  AnalyticsEvent,
  EcommerceTransaction,
  CustomAnalyticsConfig,
} from '../types';

interface QueuedEvent {
  type: 'pageview' | 'event' | 'transaction' | 'error';
  data: any;
  timestamp: number;
}

export class CustomAnalyticsProvider implements AnalyticsProvider {
  name = 'Custom Analytics';
  enabled = false;
  private config: CustomAnalyticsConfig;
  private queue: QueuedEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private userId: string | null = null;

  constructor(config: CustomAnalyticsConfig) {
    this.config = config;
    this.enabled = config.enabled;
  }

  async initialize(): Promise<void> {
    if (!this.enabled) return;

    // Start flush timer
    this.startFlushTimer();

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });

      // Flush on visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.flush(true);
        }
      });
    }

    console.log('[Custom Analytics] Initialized successfully');
  }

  trackPageView(path: string, title?: string): void {
    if (!this.enabled) return;

    this.queueEvent({
      type: 'pageview',
      data: {
        path,
        title: title || document.title,
        referrer: document.referrer,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!this.enabled) return;

    this.queueEvent({
      type: 'event',
      data: {
        ...event,
        timestamp: event.timestamp || Date.now(),
        userId: this.userId,
      },
      timestamp: Date.now(),
    });
  }

  trackTransaction(transaction: EcommerceTransaction): void {
    if (!this.enabled) return;

    this.queueEvent({
      type: 'transaction',
      data: {
        ...transaction,
        timestamp: Date.now(),
        userId: this.userId,
      },
      timestamp: Date.now(),
    });
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this.enabled) return;

    this.queueEvent({
      type: 'event',
      data: {
        name: 'user_properties_set',
        properties,
        userId: this.userId,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
  }

  private queueEvent(event: QueuedEvent): void {
    this.queue.push(event);

    // Auto-flush if batch size reached
    const batchSize = this.config.batchSize || 10;
    if (this.queue.length >= batchSize) {
      this.flush();
    }
  }

  private startFlushTimer(): void {
    const interval = this.config.flushInterval || 30000; // 30 seconds default

    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, interval);
  }

  private async flush(useBeacon = false): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    const payload = {
      events,
      userId: this.userId,
      sessionId: this.getSessionId(),
      timestamp: Date.now(),
      metadata: this.getMetadata(),
    };

    try {
      if (useBeacon && navigator.sendBeacon) {
        // Use sendBeacon for page unload
        const blob = new Blob([JSON.stringify(payload)], {
          type: 'application/json',
        });
        navigator.sendBeacon(this.config.endpoint, blob);
      } else {
        // Use fetch for normal requests
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && {
              Authorization: `Bearer ${this.config.apiKey}`,
            }),
          },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }
    } catch (error) {
      console.error('[Custom Analytics] Failed to send events:', error);
      // Re-queue events on error
      this.queue.unshift(...events);
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private getMetadata() {
    if (typeof window === 'undefined') return {};

    return {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(true);
  }
}
