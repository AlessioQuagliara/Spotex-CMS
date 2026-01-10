"use client";

import { LocalizationProvider } from "@/contexts/localization-context";
import { BlogList } from "@/components/blog/blog-list";
import { LocaleSwitcher } from "@/components/localization/locale-switcher";

const samplePosts = [
  {
    id: 1,
    title: "Le ultime tendenze della moda 2026",
    slug: "tendenze-moda-2026",
    excerpt: "Scopri le tendenze che domineranno il mondo della moda quest'anno...",
    content: "",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600",
    author: "Maria Rossi",
    publishedAt: "2026-01-05",
    category: "Moda",
    readTime: 5,
    tags: ["moda", "tendenze", "2026"],
  },
  {
    id: 2,
    title: "Guida all'acquisto: Come scegliere il prodotto giusto",
    slug: "guida-acquisto-prodotto",
    excerpt: "Consigli pratici per fare acquisti consapevoli e scegliere prodotti di qualità...",
    content: "",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600",
    author: "Luca Bianchi",
    publishedAt: "2026-01-03",
    category: "Guide",
    readTime: 8,
    tags: ["shopping", "guide", "consigli"],
  },
  {
    id: 3,
    title: "Sostenibilità nel fashion: Il futuro è green",
    slug: "sostenibilita-fashion",
    excerpt: "Come la moda sta diventando più sostenibile e responsabile...",
    content: "",
    image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=600",
    author: "Anna Verde",
    publishedAt: "2026-01-01",
    category: "Sostenibilità",
    readTime: 6,
    tags: ["sostenibilità", "ambiente", "moda"],
  },
];

export default function BlogPage() {
  return (
    <LocalizationProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b p-4">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">Blog</h1>
            <LocaleSwitcher />
          </div>
        </header>
        <main className="container mx-auto p-8">
          <BlogList posts={samplePosts} />
        </main>
      </div>
    </LocalizationProvider>
  );
}
