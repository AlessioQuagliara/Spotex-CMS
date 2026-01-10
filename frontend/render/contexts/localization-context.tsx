"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Locale = "it" | "en" | "es" | "fr" | "de";
export type Currency = "EUR" | "USD" | "GBP";

interface Translations {
  [key: string]: string;
}

interface LocalizationContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  t: (key: string) => string;
  formatPrice: (amount: number) => string;
  formatDate: (date: Date | string) => string;
}

const LocalizationContext = createContext<LocalizationContextValue | undefined>(
  undefined
);

const translations: Record<Locale, Translations> = {
  it: {
    "nav.home": "Home",
    "nav.products": "Prodotti",
    "nav.blog": "Blog",
    "nav.about": "Chi Siamo",
    "nav.contact": "Contatti",
    "product.addToCart": "Aggiungi al Carrello",
    "product.addToWishlist": "Aggiungi alla Wishlist",
    "product.outOfStock": "Esaurito",
    "product.inStock": "Disponibile",
    "product.reviews": "Recensioni",
    "wishlist.title": "La Mia Wishlist",
    "wishlist.empty": "La tua wishlist è vuota",
    "cart.title": "Carrello",
    "cart.empty": "Il tuo carrello è vuoto",
    "checkout.title": "Checkout",
    "blog.readMore": "Leggi di più",
    "blog.latestPosts": "Ultimi Articoli",
    "faq.title": "Domande Frequenti",
    "common.search": "Cerca",
    "common.filter": "Filtra",
    "common.sort": "Ordina",
    "common.save": "Salva",
    "common.cancel": "Annulla",
  },
  en: {
    "nav.home": "Home",
    "nav.products": "Products",
    "nav.blog": "Blog",
    "nav.about": "About Us",
    "nav.contact": "Contact",
    "product.addToCart": "Add to Cart",
    "product.addToWishlist": "Add to Wishlist",
    "product.outOfStock": "Out of Stock",
    "product.inStock": "In Stock",
    "product.reviews": "Reviews",
    "wishlist.title": "My Wishlist",
    "wishlist.empty": "Your wishlist is empty",
    "cart.title": "Cart",
    "cart.empty": "Your cart is empty",
    "checkout.title": "Checkout",
    "blog.readMore": "Read More",
    "blog.latestPosts": "Latest Posts",
    "faq.title": "Frequently Asked Questions",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.sort": "Sort",
    "common.save": "Save",
    "common.cancel": "Cancel",
  },
  es: {
    "nav.home": "Inicio",
    "nav.products": "Productos",
    "nav.blog": "Blog",
    "nav.about": "Sobre Nosotros",
    "nav.contact": "Contacto",
    "product.addToCart": "Agregar al Carrito",
    "product.addToWishlist": "Agregar a Favoritos",
    "product.outOfStock": "Agotado",
    "product.inStock": "Disponible",
    "product.reviews": "Reseñas",
    "wishlist.title": "Mis Favoritos",
    "wishlist.empty": "Tu lista de favoritos está vacía",
    "cart.title": "Carrito",
    "cart.empty": "Tu carrito está vacío",
    "checkout.title": "Finalizar Compra",
    "blog.readMore": "Leer Más",
    "blog.latestPosts": "Últimas Publicaciones",
    "faq.title": "Preguntas Frecuentes",
    "common.search": "Buscar",
    "common.filter": "Filtrar",
    "common.sort": "Ordenar",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.products": "Produits",
    "nav.blog": "Blog",
    "nav.about": "À Propos",
    "nav.contact": "Contact",
    "product.addToCart": "Ajouter au Panier",
    "product.addToWishlist": "Ajouter aux Favoris",
    "product.outOfStock": "Épuisé",
    "product.inStock": "En Stock",
    "product.reviews": "Avis",
    "wishlist.title": "Ma Liste de Souhaits",
    "wishlist.empty": "Votre liste est vide",
    "cart.title": "Panier",
    "cart.empty": "Votre panier est vide",
    "checkout.title": "Commander",
    "blog.readMore": "Lire la Suite",
    "blog.latestPosts": "Derniers Articles",
    "faq.title": "Questions Fréquentes",
    "common.search": "Rechercher",
    "common.filter": "Filtrer",
    "common.sort": "Trier",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
  },
  de: {
    "nav.home": "Startseite",
    "nav.products": "Produkte",
    "nav.blog": "Blog",
    "nav.about": "Über Uns",
    "nav.contact": "Kontakt",
    "product.addToCart": "In den Warenkorb",
    "product.addToWishlist": "Zur Wunschliste",
    "product.outOfStock": "Ausverkauft",
    "product.inStock": "Auf Lager",
    "product.reviews": "Bewertungen",
    "wishlist.title": "Meine Wunschliste",
    "wishlist.empty": "Ihre Wunschliste ist leer",
    "cart.title": "Warenkorb",
    "cart.empty": "Ihr Warenkorb ist leer",
    "checkout.title": "Kasse",
    "blog.readMore": "Mehr Lesen",
    "blog.latestPosts": "Neueste Beiträge",
    "faq.title": "Häufig Gestellte Fragen",
    "common.search": "Suchen",
    "common.filter": "Filtern",
    "common.sort": "Sortieren",
    "common.save": "Speichern",
    "common.cancel": "Abbrechen",
  },
};

const currencySymbols: Record<Currency, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
};

const exchangeRates: Record<Currency, number> = {
  EUR: 1,
  USD: 1.09,
  GBP: 0.86,
};

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("it");
  const [currency, setCurrency] = useState<Currency>("EUR");

  // Load from localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale;
    const savedCurrency = localStorage.getItem("currency") as Currency;
    if (savedLocale) setLocale(savedLocale);
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("locale", locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  const t = (key: string): string => {
    return translations[locale][key] || key;
  };

  const formatPrice = (amount: number): string => {
    const convertedAmount = amount * exchangeRates[currency];
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(convertedAmount);
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  };

  return (
    <LocalizationContext.Provider
      value={{
        locale,
        setLocale,
        currency,
        setCurrency,
        t,
        formatPrice,
        formatDate,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within LocalizationProvider");
  }
  return context;
}
