/**
 * Structured Data Components - Schema.org Implementation
 * Renders JSON-LD structured data for comprehensive SEO
 */
import Script from "next/script";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://spotex.com";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Spotex";

/**
 * Organization Schema.org structured data
 */
export interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  description?: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
    email?: string;
  };
  sameAs?: string[]; // Social media profiles
}

export function OrganizationStructuredData({
  name = SITE_NAME,
  url = SITE_URL,
  logo = `${SITE_URL}/logo.png`,
  description,
  contactPoint,
  sameAs = [],
}: Partial<OrganizationSchema>) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo: {
      "@type": "ImageObject",
      url: logo,
    },
    description,
    contactPoint: contactPoint
      ? {
          "@type": "ContactPoint",
          telephone: contactPoint.telephone,
          contactType: contactPoint.contactType,
          email: contactPoint.email,
        }
      : undefined,
    sameAs,
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Product Schema.org structured data
 */
export interface ProductSchema {
  name: string;
  description: string;
  image: string[];
  sku: string;
  brand?: string;
  offers: {
    price: number;
    priceCurrency: string;
    availability: string;
    url: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export function ProductStructuredData(product: ProductSchema) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    brand: product.brand
      ? {
          "@type": "Brand",
          name: product.brand,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      price: product.offers.price,
      priceCurrency: product.offers.priceCurrency,
      availability: `https://schema.org/${product.offers.availability}`,
      url: product.offers.url,
    },
    aggregateRating: product.aggregateRating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.aggregateRating.ratingValue,
          reviewCount: product.aggregateRating.reviewCount,
        }
      : undefined,
  };

  return (
    <Script
      id="product-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Breadcrumb Schema.org structured data
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Article Schema.org structured data
 */
export interface ArticleSchema {
  headline: string;
  description: string;
  image: string[];
  author: string;
  publisher: {
    name: string;
    logo: string;
  };
  datePublished: string;
  dateModified?: string;
}

export function ArticleStructuredData(article: ArticleSchema) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.headline,
    description: article.description,
    image: article.image,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: article.publisher.name,
      logo: {
        "@type": "ImageObject",
        url: article.publisher.logo,
      },
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
  };

  return (
    <Script
      id="article-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * WebSite Schema.org structured data with SearchAction
 */
export function WebSiteStructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQ Schema.org structured data
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export function FAQStructuredData({ items }: { items: FAQItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Review Schema.org structured data
 */
export interface ReviewSchema {
  itemReviewed: {
    name: string;
    image?: string;
  };
  author: string;
  reviewRating: {
    ratingValue: number;
    bestRating?: number;
  };
  reviewBody: string;
  datePublished: string;
}

export function ReviewStructuredData(review: ReviewSchema) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Product",
      name: review.itemReviewed.name,
      image: review.itemReviewed.image,
    },
    author: {
      "@type": "Person",
      name: review.author,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.reviewRating.ratingValue,
      bestRating: review.reviewRating.bestRating || 5,
    },
    reviewBody: review.reviewBody,
    datePublished: review.datePublished,
  };

  return (
    <Script
      id="review-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * LocalBusiness Schema.org structured data
 */
export interface LocalBusinessSchema {
  name: string;
  image: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  telephone: string;
  priceRange?: string;
  openingHours?: string[];
}

export function LocalBusinessStructuredData(business: LocalBusinessSchema) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    image: business.image,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.streetAddress,
      addressLocality: business.address.addressLocality,
      addressRegion: business.address.addressRegion,
      postalCode: business.address.postalCode,
      addressCountry: business.address.addressCountry,
    },
    geo: business.geo
      ? {
          "@type": "GeoCoordinates",
          latitude: business.geo.latitude,
          longitude: business.geo.longitude,
        }
      : undefined,
    telephone: business.telephone,
    priceRange: business.priceRange,
    openingHoursSpecification: business.openingHours?.map((hours) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: hours,
    })),
  };

  return (
    <Script
      id="local-business-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Generic Structured Data Component
 * Renders any structured data object as JSON-LD
 */
export function StructuredDataComponent({ data, id = "structured-data" }: { data: any; id?: string }) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
