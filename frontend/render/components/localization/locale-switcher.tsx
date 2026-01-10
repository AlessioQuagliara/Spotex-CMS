"use client";

import { useLocalization, Locale, Currency } from "@/contexts/localization-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Globe, DollarSign } from "lucide-react";

const localeNames: Record<Locale, string> = {
  it: "Italiano",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
};

const localeFlags: Record<Locale, string> = {
  it: "🇮🇹",
  en: "🇬🇧",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
};

export function LocaleSwitcher() {
  const { locale, setLocale, currency, setCurrency } = useLocalization();

  return (
    <div className="flex gap-2">
      {/* Language Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Globe className="h-4 w-4 mr-2" />
            {localeFlags[locale]} {localeNames[locale]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(Object.keys(localeNames) as Locale[]).map((loc) => (
            <DropdownMenuItem
              key={loc}
              onClick={() => setLocale(loc)}
              className={locale === loc ? "bg-accent" : ""}
            >
              <span className="mr-2">{localeFlags[loc]}</span>
              {localeNames[loc]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Currency Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <DollarSign className="h-4 w-4 mr-2" />
            {currency}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(["EUR", "USD", "GBP"] as Currency[]).map((curr) => (
            <DropdownMenuItem
              key={curr}
              onClick={() => setCurrency(curr)}
              className={currency === curr ? "bg-accent" : ""}
            >
              {curr} - {curr === "EUR" ? "€" : curr === "USD" ? "$" : "£"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
