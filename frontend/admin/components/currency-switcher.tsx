/**
 * Currency Switcher Component
 */
'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { currencies } from '@/lib/language';

export function CurrencySwitcher() {
  const { t } = useTranslation();
  const [currentCurrency, setCurrentCurrency] = React.useState('USD');

  React.useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('currency');
    if (saved) {
      setCurrentCurrency(saved);
    }
  }, []);

  const handleCurrencyChange = (currencyCode: string) => {
    setCurrentCurrency(currencyCode);
    localStorage.setItem('currency', currencyCode);
    
    // Emit custom event for other components to react
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: currencyCode }));
  };

  const currency = currencies.find((c) => c.code === currentCurrency) || currencies[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          <span className="font-medium">{currency.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => handleCurrencyChange(curr.code)}
            className={`gap-2 ${
              curr.code === currentCurrency ? 'bg-accent' : ''
            }`}
          >
            <span className="text-lg">{curr.symbol}</span>
            <div className="flex flex-col">
              <span className="font-medium">{curr.code}</span>
              <span className="text-xs text-muted-foreground">{curr.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
