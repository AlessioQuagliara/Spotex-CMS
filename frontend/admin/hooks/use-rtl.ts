/**
 * RTL Support Hook
 */
'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isRTL } from '@/lib/language';

export function useRTL() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const rtl = isRTL(currentLanguage);

  useEffect(() => {
    // Apply RTL/LTR to document
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;

    // Add RTL class to body for specific styling
    if (rtl) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [currentLanguage, rtl]);

  return {
    isRTL: rtl,
    direction: rtl ? 'rtl' : 'ltr',
    currentLanguage,
  };
}
