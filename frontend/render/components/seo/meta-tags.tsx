import { Metadata } from "next";

export interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  locale?: string;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://spotex.com";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Spotex";

/**
 * Generate comprehensive meta tags for SEO
 * Includes Open Graph, Twitter Cards, and standard meta tags
 */
export function generateMetaTags(props: MetaTagsProps): Metadata {
  const {
    title,
    description,
    image = `${SITE_URL}/images/og-image.jpg`,
    url = SITE_URL,
    type = "website",
    locale = "it_IT",
    keywords = [],
    author,
    publishedTime,
    modifiedTime,
    noindex = false,
    nofollow = false,
    canonical,
  } = props;

  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;
  const canonicalUrl = canonical || url;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    applicationName: SITE_NAME,
    authors: author ? [{ name: author }] : undefined,
    keywords: keywords.join(", "),
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "it-IT": canonicalUrl,
        "en-US": canonicalUrl.replace("/it/", "/en/"),
      },
    },
    openGraph: {
      type: type === 'product' ? 'website' : type,
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title || SITE_NAME,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
      site: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      other: {
        "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "",
      },
    },
  };

  return metadata;
}

/**
 * Generate meta tags for product pages
 */
export function generateProductMetaTags(product: {
  name: string;
  description: string;
  price: number;
  currency?: string;
  image?: string;
  slug: string;
  brand?: string;
  availability?: string;
}): Metadata {
  const url = `${SITE_URL}/products/${product.slug}`;
  const imageUrl = product.image || `${SITE_URL}/images/products/default.jpg`;

  return generateMetaTags({
    title: product.name,
    description: product.description,
    image: imageUrl,
    url,
    type: "product",
    keywords: [product.name, product.brand || "", "shop", "online"].filter(Boolean),
  });
}

/**
 * Generate meta tags for category pages
 */
export function generateCategoryMetaTags(category: {
  name: string;
  description?: string;
  slug: string;
  image?: string;
}): Metadata {
  const url = `${SITE_URL}/categories/${category.slug}`;
  const title = `${category.name} - Prodotti Online`;
  const description =
    category.description || `Scopri tutti i prodotti nella categoria ${category.name}`;

  return generateMetaTags({
    title,
    description,
    url,
    image: category.image,
    keywords: [category.name, "prodotti", "shop", "online"],
  });
}

/**
 * Generate meta tags for blog posts
 */
export function generateBlogPostMetaTags(post: {
  title: string;
  excerpt: string;
  image?: string;
  slug: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  tags?: string[];
}): Metadata {
  const url = `${SITE_URL}/blog/${post.slug}`;

  return generateMetaTags({
    title: post.title,
    description: post.excerpt,
    image: post.image,
    url,
    type: "article",
    author: post.author,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    keywords: post.tags || [],
  });
}
