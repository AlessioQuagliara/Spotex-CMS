/**
 * Dynamic robots.txt generation for multi-tenant stores
 * Supports tenant-specific rules and sitemap URLs
 */
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spotex.com";
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;

  // Base rules for all stores
  const rules: MetadataRoute.Robots["rules"] = [
    {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/_next/",
        "/checkout/success", // Don't index success pages
        "/account/", // Don't index user account pages
        "/cart", // Don't index cart
        "/*?*sort=", // Don't index filtered pages
        "/*?*page=", // Don't index paginated pages (canonical on first page)
      ],
    },
    {
      userAgent: "GPTBot", // OpenAI crawler
      disallow: "/",
    },
    {
      userAgent: "ChatGPT-User",
      disallow: "/",
    },
    {
      userAgent: "CCBot", // Common Crawl
      disallow: "/",
    },
    {
      userAgent: "anthropic-ai", // Claude
      disallow: "/",
    },
  ];

  // Sitemap URLs
  const sitemaps: string[] = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap-products.xml`,
    `${baseUrl}/sitemap-categories.xml`,
    `${baseUrl}/sitemap-pages.xml`,
  ];

  // Tenant-specific configuration
  if (tenantId) {
    // Add tenant-specific sitemaps
    sitemaps.push(`${baseUrl}/sitemap-${tenantId}.xml`);
  }

  // Environment-specific rules
  if (process.env.NODE_ENV === "development") {
    // Allow all for development
    rules.push({
      userAgent: "*",
      allow: "/",
      disallow: [],
    });
  }

  // Special rules for staging
  if (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development") {
    // Block all crawlers on staging
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
      sitemap: sitemaps,
    };
  }

  return {
    rules,
    sitemap: sitemaps,
    host: baseUrl,
  };
}
