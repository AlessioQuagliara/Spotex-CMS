/**
 * Event Tracker
 * Sistema centralizzato per il tracking degli eventi
 */

import type { AnalyticsEvent, EventName } from '../types';

export class EventTracker {
  private listeners: Map<string, Set<(event: AnalyticsEvent) => void>> = new Map();
  private eventHistory: AnalyticsEvent[] = [];
  private maxHistorySize = 100;

  /**
   * Track un evento
   */
  track(name: EventName, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
    };

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify listeners
    this.notifyListeners(event);
  }

  /**
   * Track evento con categoria e label
   */
  trackWithCategory(
    name: EventName,
    category: string,
    label?: string,
    value?: number,
    properties?: Record<string, any>
  ): void {
    const event: AnalyticsEvent = {
      name,
      category,
      label,
      value,
      properties,
      timestamp: Date.now(),
    };

    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    this.notifyListeners(event);
  }

  /**
   * Track click event
   */
  trackClick(
    elementId: string,
    elementType: string,
    label?: string,
    properties?: Record<string, any>
  ): void {
    this.track('click', {
      element_id: elementId,
      element_type: elementType,
      label,
      ...properties,
    });
  }

  /**
   * Track form submit
   */
  trackFormSubmit(
    formId: string,
    formName?: string,
    success: boolean = true,
    properties?: Record<string, any>
  ): void {
    this.track('form_submit', {
      form_id: formId,
      form_name: formName,
      success,
      ...properties,
    });
  }

  /**
   * Track search
   */
  trackSearch(
    query: string,
    results?: number,
    filters?: Record<string, any>
  ): void {
    this.track('search', {
      query,
      results,
      filters,
    });
  }

  /**
   * Track download
   */
  trackDownload(
    fileName: string,
    fileType: string,
    fileSize?: number
  ): void {
    this.track('download', {
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
    });
  }

  /**
   * Track video interaction
   */
  trackVideo(
    action: 'play' | 'pause' | 'complete' | 'seek',
    videoTitle: string,
    currentTime?: number,
    duration?: number
  ): void {
    this.track(`video_${action}` as EventName, {
      video_title: videoTitle,
      current_time: currentTime,
      duration,
      percentage: duration ? (currentTime! / duration) * 100 : undefined,
    });
  }

  /**
   * Track scroll depth
   */
  trackScrollDepth(depth: number): void {
    this.track('scroll', {
      depth,
      page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    });
  }

  /**
   * Track outbound link
   */
  trackOutboundLink(url: string, label?: string): void {
    this.track('outbound_link', {
      url,
      label: label || url,
    });
  }

  /**
   * Track error
   */
  trackError(
    error: Error | string,
    context?: Record<string, any>
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'object' ? error.stack : undefined;

    this.track('error', {
      error_message: errorMessage,
      error_stack: stack,
      ...context,
    });
  }

  /**
   * Track timing
   */
  trackTiming(
    category: string,
    variable: string,
    value: number,
    label?: string
  ): void {
    this.trackWithCategory(
      'timing',
      category,
      label,
      value,
      { variable }
    );
  }

  /**
   * Subscribe to eventi
   */
  on(eventName: string, callback: (event: AnalyticsEvent) => void): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventName)?.delete(callback);
    };
  }

  /**
   * Subscribe a tutti gli eventi
   */
  onAll(callback: (event: AnalyticsEvent) => void): () => void {
    return this.on('*', callback);
  }

  /**
   * Get event history
   */
  getHistory(): AnalyticsEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Get eventi filtrati
   */
  getEventsByName(name: EventName): AnalyticsEvent[] {
    return this.eventHistory.filter((event) => event.name === name);
  }

  /**
   * Get eventi per categoria
   */
  getEventsByCategory(category: string): AnalyticsEvent[] {
    return this.eventHistory.filter((event) => event.category === category);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  private notifyListeners(event: AnalyticsEvent): void {
    // Notify specific event listeners
    this.listeners.get(event.name)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[EventTracker] Listener error:', error);
      }
    });

    // Notify wildcard listeners
    this.listeners.get('*')?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[EventTracker] Wildcard listener error:', error);
      }
    });
  }
}

// Export singleton instance
export const eventTracker = new EventTracker();
