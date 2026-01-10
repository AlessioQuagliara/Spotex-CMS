/**
 * Multi-language and RTL support utilities
 */

export type Direction = 'ltr' | 'rtl';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: Direction;
  flag: string;
}

export const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇬🇧' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', flag: '🇮🇹' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', flag: '🇵🇹' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', flag: '🇸🇦' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl', flag: '🇮🇱' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', flag: '🇯🇵' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr', flag: '🇷🇺' },
];

export const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

export function isRTL(languageCode: string): boolean {
  return rtlLanguages.includes(languageCode);
}

export function getLanguage(code: string): Language | undefined {
  return languages.find((lang) => lang.code === code);
}

export function getDirection(languageCode: string): Direction {
  return isRTL(languageCode) ? 'rtl' : 'ltr';
}

export function applyDirection(languageCode: string) {
  const direction = getDirection(languageCode);
  document.documentElement.dir = direction;
  document.documentElement.lang = languageCode;
}

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

export function formatCurrency(
  amount: number,
  currency: string,
  locale?: string
): string {
  try {
    return new Intl.NumberFormat(locale || 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (error) {
    const currencyObj = currencies.find((c) => c.code === currency);
    return `${currencyObj?.symbol || currency} ${amount.toFixed(2)}`;
  }
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  try {
    const response = await fetch('/api/i18n/currency/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, from_currency: from, to_currency: to }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.converted_amount;
    }
  } catch (error) {
    console.error('Currency conversion failed:', error);
  }

  return amount; // Fallback to original amount
}

export function formatDate(
  date: Date | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    return dateObj.toLocaleDateString();
  }
}

export function formatNumber(
  number: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(number);
  } catch (error) {
    return number.toString();
  }
}
