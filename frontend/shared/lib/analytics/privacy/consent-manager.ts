/**
 * Consent Manager
 * Gestione consensi GDPR per cookie e tracking
 */

import type { ConsentStatus, ConsentCategory } from '../types';

const CONSENT_COOKIE_NAME = 'spotex_consent';
const CONSENT_VERSION = '1.0';

export class ConsentManager {
  private consent: ConsentStatus | null = null;
  private listeners: Set<(consent: ConsentStatus) => void> = new Set();

  constructor() {
    this.loadConsent();
  }

  /**
   * Get current consent status
   */
  getConsent(): ConsentStatus | null {
    return this.consent;
  }

  /**
   * Check if category is consented
   */
  hasConsent(category: ConsentCategory): boolean {
    if (!this.consent) return false;
    return this.consent[category] === true;
  }

  /**
   * Check if all categories are consented
   */
  hasAllConsent(): boolean {
    if (!this.consent) return false;
    return (
      this.consent.necessary &&
      this.consent.analytics &&
      this.consent.marketing &&
      this.consent.preferences
    );
  }

  /**
   * Update consent
   */
  updateConsent(partial: Partial<ConsentStatus>): void {
    const newConsent: ConsentStatus = {
      necessary: true, // Always true
      analytics: partial.analytics ?? this.consent?.analytics ?? false,
      marketing: partial.marketing ?? this.consent?.marketing ?? false,
      preferences: partial.preferences ?? this.consent?.preferences ?? false,
      timestamp: Date.now(),
    };

    this.consent = newConsent;
    this.saveConsent(newConsent);
    this.notifyListeners(newConsent);
  }

  /**
   * Accept all categories
   */
  acceptAll(): void {
    this.updateConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  }

  /**
   * Reject all (except necessary)
   */
  rejectAll(): void {
    this.updateConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  }

  /**
   * Reset consent (clear cookie)
   */
  resetConsent(): void {
    this.consent = null;
    this.deleteCookie(CONSENT_COOKIE_NAME);
    this.notifyListeners(null as any);
  }

  /**
   * Check if consent was given
   */
  hasConsentBeenGiven(): boolean {
    return this.consent !== null;
  }

  /**
   * Subscribe to consent changes
   */
  onChange(callback: (consent: ConsentStatus) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get consent age in days
   */
  getConsentAge(): number | null {
    if (!this.consent) return null;

    const age = Date.now() - this.consent.timestamp;
    return Math.floor(age / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if consent needs renewal (older than 365 days)
   */
  needsRenewal(): boolean {
    const age = this.getConsentAge();
    return age !== null && age > 365;
  }

  private loadConsent(): void {
    try {
      const cookieValue = this.getCookie(CONSENT_COOKIE_NAME);
      if (cookieValue) {
        const data = JSON.parse(decodeURIComponent(cookieValue));
        
        // Verify version
        if (data.version === CONSENT_VERSION) {
          this.consent = data.consent;
        }
      }
    } catch (error) {
      console.error('[ConsentManager] Failed to load consent:', error);
    }
  }

  private saveConsent(consent: ConsentStatus): void {
    try {
      const data = {
        version: CONSENT_VERSION,
        consent,
      };

      const cookieValue = encodeURIComponent(JSON.stringify(data));
      
      // Set cookie for 1 year
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);

      document.cookie = `${CONSENT_COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
    } catch (error) {
      console.error('[ConsentManager] Failed to save consent:', error);
    }
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const matches = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
    );

    return matches ? matches[1] : null;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  private notifyListeners(consent: ConsentStatus): void {
    this.listeners.forEach((callback) => {
      try {
        callback(consent);
      } catch (error) {
        console.error('[ConsentManager] Listener error:', error);
      }
    });
  }

  /**
   * Get consent summary for display
   */
  getConsentSummary() {
    if (!this.consent) {
      return {
        status: 'pending',
        message: 'Consenso non ancora fornito',
      };
    }

    const accepted = Object.entries(this.consent).filter(
      ([key, value]) => key !== 'timestamp' && value === true
    ).length;

    const total = 4; // necessary, analytics, marketing, preferences

    return {
      status: accepted === total ? 'all' : accepted === 1 ? 'minimal' : 'partial',
      accepted,
      total,
      age: this.getConsentAge(),
      needsRenewal: this.needsRenewal(),
    };
  }
}

// Export singleton instance
export const consentManager = new ConsentManager();
