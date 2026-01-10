/**
 * SEO utilities for frontend
 */

export interface MetaTags {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

/**
 * Generate meta tags for Next.js metadata API
 */
export function generateMetadata(tags: MetaTags, baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || '') {
  const {
    title,
    description,
    keywords,
    canonical,
    image,
    ogType = 'website',
    twitterCard = 'summary_large_image',
    publishedTime,
    modifiedTime,
    author,
    section,
  } = tags;

  const metadata: any = {
    title,
    description,
  };

  if (keywords) {
    metadata.keywords = keywords;
  }

  if (canonical) {
    metadata.alternates = {
      canonical: canonical.startsWith('http') ? canonical : `${baseUrl}${canonical}`,
    };
  }

  // Open Graph
  metadata.openGraph = {
    title,
    description,
    type: ogType,
    url: canonical,
    siteName: 'CMS',
  };

  if (image) {
    metadata.openGraph.images = [
      {
        url: image.startsWith('http') ? image : `${baseUrl}${image}`,
        width: 1200,
        height: 630,
        alt: title,
      },
    ];
  }

  if (ogType === 'article') {
    metadata.openGraph.article = {
      publishedTime,
      modifiedTime,
      authors: author ? [author] : undefined,
      section,
    };
  }

  // Twitter Card
  metadata.twitter = {
    card: twitterCard,
    title,
    description,
  };

  if (image) {
    metadata.twitter.images = [image.startsWith('http') ? image : `${baseUrl}${image}`];
  }

  return metadata;
}

/**
 * Generate Article structured data (JSON-LD)
 */
export function generateArticleStructuredData(
  article: {
    title: string;
    description: string;
    url: string;
    publishedDate: string;
    modifiedDate?: string;
    authorName: string;
    image?: string;
  },
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || ''
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image ? `${baseUrl}${article.image}` : undefined,
    datePublished: article.publishedDate,
    dateModified: article.modifiedDate || article.publishedDate,
    author: {
      '@type': 'Person',
      name: article.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CMS',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
  };
}

/**
 * Generate Organization structured data (JSON-LD)
 */
export function generateOrganizationStructuredData(
  org: {
    name: string;
    url: string;
    logo?: string;
    socialUrls?: string[];
  }
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    url: org.url,
    logo: org.logo,
    sameAs: org.socialUrls,
  };
}

/**
 * Generate Breadcrumb structured data (JSON-LD)
 */
export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>,
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || ''
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

/**
 * Generate FAQ structured data (JSON-LD)
 */
export function generateFAQStructuredData(
  faqs: Array<{ question: string; answer: string }>
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Product structured data (JSON-LD)
 */
export function generateProductStructuredData(
  product: {
    name: string;
    description: string;
    image: string;
    price: number;
    currency: string;
    availability: 'InStock' | 'OutOfStock' | 'PreOrder';
    rating?: number;
    reviewCount?: number;
  },
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || ''
): StructuredData {
  const data: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: `${baseUrl}${product.image}`,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: `https://schema.org/${product.availability}`,
    },
  };

  if (product.rating && product.reviewCount) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    };
  }

  return data;
}

/**
 * Clean text for meta description
 */
export function cleanTextForMeta(text: string, maxLength: number = 160): string {
  if (!text) return '';

  // Remove HTML tags
  let cleaned = text.replace(/<[^>]+>/g, '');

  // Remove multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Trim
  cleaned = cleaned.trim();

  // Limit length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength).split(' ').slice(0, -1).join(' ') + '...';
  }

  return cleaned;
}

/**
 * Generate slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Calculate reading time
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  if (!content) return 0;

  // Remove HTML tags
  const text = content.replace(/<[^>]+>/g, '');

  // Count words
  const words = text.split(/\s+/).length;

  // Calculate minutes
  return Math.max(1, Math.round(words / wordsPerMinute));
}

/**
 * Validate meta tags
 */
export function validateMetaTags(meta: MetaTags): { warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Title validation
  if (!meta.title) {
    errors.push('Missing meta title');
  } else if (meta.title.length > 60) {
    warnings.push(`Meta title too long (${meta.title.length} chars, recommended: 50-60)`);
  } else if (meta.title.length < 30) {
    warnings.push(`Meta title too short (${meta.title.length} chars, recommended: 50-60)`);
  }

  // Description validation
  if (!meta.description) {
    errors.push('Missing meta description');
  } else if (meta.description.length > 160) {
    warnings.push(
      `Meta description too long (${meta.description.length} chars, recommended: 150-160)`
    );
  } else if (meta.description.length < 120) {
    warnings.push(
      `Meta description too short (${meta.description.length} chars, recommended: 150-160)`
    );
  }

  // Image validation
  if (!meta.image) {
    warnings.push('Missing Open Graph image');
  }

  return { warnings, errors };
}
