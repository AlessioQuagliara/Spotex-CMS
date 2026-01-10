"use client";

import { LocalizationProvider } from "@/contexts/localization-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { WishlistWidget } from "@/components/wishlist/wishlist-widget";
import { LocaleSwitcher } from "@/components/localization/locale-switcher";

export default function WishlistPage() {
  return (
    <LocalizationProvider>
      <WishlistProvider>
        <div className="min-h-screen bg-background">
          <header className="border-b p-4">
            <div className="container mx-auto flex items-center justify-between">
              <h1 className="text-2xl font-bold">Store</h1>
              <LocaleSwitcher />
            </div>
          </header>
          <main className="container mx-auto p-8">
            <WishlistWidget />
          </main>
        </div>
      </WishlistProvider>
    </LocalizationProvider>
  );
}
