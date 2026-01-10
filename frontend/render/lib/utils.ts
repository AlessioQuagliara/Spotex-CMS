import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date, format: "short" | "long" = "short"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (format === "long") {
    return new Intl.DateTimeFormat("it-IT", {
      dateStyle: "long",
    }).format(dateObj);
  }
  
  return new Intl.DateTimeFormat("it-IT").format(dateObj);
}
