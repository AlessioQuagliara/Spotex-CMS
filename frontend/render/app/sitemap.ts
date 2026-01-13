/**
 * Dynamic sitemap generation with products, categories, and pages
 * Automatically generates sitemap.xml with data from API
 */
import { MetadataRoute } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://spotex.com";

interface Product {
  id: string;
  slug: string;
  updated_at: string;
}

interface Category {
  id: string;
  slug: string;
  updated_at: string;
}

interface Page {
  id: string;
  slug: string;
  updated_at: string;
}

/**
 * Fetch products from API
 */
async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}/api/products?limit=1000`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching products for sitemap:", error);
    return [];
  }
}

/**
 * Fetch categories from API
 */
async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_URL}/api/categories?limit=1000`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching categories for sitemap:", error);
    return [];
  }
}

/**
 * Fetch pages from API
 */
async function getPages(): Promise<Page[]> {
  try {
    const response = await fetch(`${API_URL}/api/pages?limit=1000`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch pages");
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching pages for sitemap:", error);
    return [];
  }
}

/**
 * Generate dynamic sitemap with products, categories, and pages
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch data in parallel
  const [products, categories, pages] = await Promise.all([
    getProducts(),
    getCategories(),
    getPages(),
  ]);

  const now = new Date().toISOString();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Product pages
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    lastModified: product.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    lastModified: category.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Dynamic pages
  const dynamicPages: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${SITE_URL}/${page.slug}`,
    lastModified: page.updated_at,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...dynamicPages];
}

/**
 * Generate product-specific sitemap
 */
export async function generateProductSitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();

  return products.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    lastModified: product.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.8,
    images: [`${SITE_URL}/images/products/${product.slug}.jpg`],
  }));
}

/**
 * Generate category-specific sitemap
 */
export async function generateCategorySitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getCategories();

  return categories.map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    lastModified: category.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
}
