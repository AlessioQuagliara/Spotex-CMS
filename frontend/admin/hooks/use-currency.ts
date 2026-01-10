/**
 * Currency Hook
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { convertCurrency, formatCurrency } from '@/lib/language';

interface UseCurrencyOptions {
  baseCurrency?: string;
  autoConvert?: boolean;
}

export function useCurrency(options: UseCurrencyOptions = {}) {
  const { baseCurrency = 'USD', autoConvert = false } = options;
  const [currentCurrency, setCurrentCurrency] = useState<string>(baseCurrency);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load saved currency from localStorage
    const saved = localStorage.getItem('currency');
    if (saved) {
      setCurrentCurrency(saved);
    }

    // Listen for currency changes
    const handleCurrencyChange = (event: CustomEvent) => {
      setCurrentCurrency(event.detail);
    };

    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);

    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
    };
  }, []);

  const convert = useCallback(
    async (amount: number, from?: string, to?: string): Promise<number> => {
      const fromCurrency = from || baseCurrency;
      const toCurrency = to || currentCurrency;

      if (fromCurrency === toCurrency) {
        return amount;
      }

      setLoading(true);
      try {
        const converted = await convertCurrency(amount, fromCurrency, toCurrency);
        return converted;
      } catch (error) {
        console.error('Currency conversion error:', error);
        return amount;
      } finally {
        setLoading(false);
      }
    },
    [baseCurrency, currentCurrency]
  );

  const format = useCallback(
    (amount: number, currency?: string, locale?: string): string => {
      return formatCurrency(amount, currency || currentCurrency, locale);
    },
    [currentCurrency]
  );

  const changeCurrency = useCallback((currency: string) => {
    setCurrentCurrency(currency);
    localStorage.setItem('currency', currency);
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: currency }));
  }, []);

  return {
    currentCurrency,
    changeCurrency,
    convert,
    format,
    loading,
  };
}
