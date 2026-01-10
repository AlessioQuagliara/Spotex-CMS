/**
 * Advanced Structured Data Generators (JSON-LD)
 * Comprehensive schema.org types for rich snippets
 */

import { StructuredData } from './seo';

export interface ProductData {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued';
  sku?: string;
  brand?: string;
  ratingValue?: number;
  reviewCount?: number;
  url?: string;
}

export interface EventData {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  locationAddress?: string;
  image?: string;
  organizerName?: string;
  offersUrl?: string;
  price?: number;
  currency?: string;
}

export interface VideoData {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string; // ISO 8601 format: PT1H30M
  contentUrl?: string;
  embedUrl?: string;
  viewCount?: number;
}

export interface RecipeData {
  name: string;
  description: string;
  image: string;
  authorName: string;
  datePublished: string;
  prepTime: string; // ISO 8601: PT15M
  cookTime: string;
  totalTime: string;
  recipeYield: string;
  ingredients: string[];
  instructions: string[];
  recipeCategory?: string;
  recipeCuisine?: string;
  ratingValue?: number;
  reviewCount?: number;
}

export interface ReviewData {
  itemReviewedName: string;
  itemReviewedType: string;
  ratingValue: number;
  authorName: string;
  datePublished: string;
  reviewBody: string;
}

export interface LocalBusinessData {
  name: string;
  address: string;
  telephone: string;
  priceRange?: string;
  ratingValue?: number;
  reviewCount?: number;
  image?: string;
  url?: string;
  openingHours?: string[];
}

export interface CourseData {
  name: string;
  description: string;
  providerName: string;
  providerUrl: string;
  price?: number;
  currency?: string;
}

export interface JobPostingData {
  title: string;
  description: string;
  hiringOrganization: string;
  location: string;
  datePosted: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'TEMPORARY' | 'INTERN';
  salaryValue?: number;
  salaryCurrency?: string;
  salaryUnit?: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
}

/**
 * Generate Product structured data with rich details
 */
export function generateProductStructuredData(product: ProductData): StructuredData {
  const data: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: product.currency || 'EUR',
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      url: product.url,
    },
  };

  if (product.sku) {
    data.sku = product.sku;
  }

  if (product.brand) {
    data.brand = {
      '@type': 'Brand',
      name: product.brand,
    };
  }

  if (product.ratingValue && product.reviewCount) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.ratingValue,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return data;
}

/**
 * Generate Event structured data
 */
export function generateEventStructuredData(event: EventData): StructuredData {
  const data: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    location: {
      '@type': 'Place',
      name: event.location,
    },
  };

  if (event.endDate) {
    data.endDate = event.endDate;
  }

  if (event.locationAddress) {
    data.location.address = {
      '@type': 'PostalAddress',
      streetAddress: event.locationAddress,
    };
  }

  if (event.image) {
    data.image = event.image;
  }

  if (event.organizerName) {
    data.organizer = {
      '@type': 'Organization',
      name: event.organizerName,
    };
  }

  if (event.offersUrl || event.price) {
    data.offers = {
      '@type': 'Offer',
      url: event.offersUrl,
      price: event.price?.toString(),
      priceCurrency: event.currency || 'EUR',
      availability: 'https://schema.org/InStock',
    };
  }

  return data;
}

/**
 * Generate VideoObject structured data
 */
export function generateVideoStructuredData(video: VideoData): StructuredData {
  const data: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    duration: video.duration,
  };

  if (video.contentUrl) {
    data.contentUrl = video.contentUrl;
  }

  if (video.embedUrl) {
    data.embedUrl = video.embedUrl;
  }

  if (video.viewCount) {
    data.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
      userInteractionCount: video.viewCount,
    };
  }

  return data;
}

/**
 * Generate Recipe structured data
 */
export function generateRecipeStructuredData(recipe: RecipeData): StructuredData {
  const data: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    description: recipe.description,
    image: recipe.image,
    author: {
      '@type': 'Person',
      name: recipe.authorName,
    },
    datePublished: recipe.datePublished,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    totalTime: recipe.totalTime,
    recipeYield: recipe.recipeYield,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.instructions.map((instruction) => ({
      '@type': 'HowToStep',
      text: instruction,
    })),
  };

  if (recipe.recipeCategory) {
    data.recipeCategory = recipe.recipeCategory;
  }

  if (recipe.recipeCuisine) {
    data.recipeCuisine = recipe.recipeCuisine;
  }

  if (recipe.ratingValue && recipe.reviewCount) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: recipe.ratingValue,
      reviewCount: recipe.reviewCount,
      bestRating: 5,
    };
  }

  return data;
}

/**
 * Generate Review structured data
 */
export function generateReviewStructuredData(review: ReviewData): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': review.itemReviewedType,
      name: review.itemReviewedName,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.ratingValue,
      bestRating: 5,
    },
    author: {
      '@type': 'Person',
      name: review.authorName,
    },
    datePublished: review.datePublished,
    reviewBody: review.reviewBody,
  };
}

/**
 * Generate LocalBusiness structured data
 */
export function generateLocalBusinessStructuredData(business: LocalBusinessData): StructuredData {
  const data: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address,
    },
    telephone: business.telephone,
    priceRange: business.priceRange || '$$',
  };

  if (business.image) {
    data.image = business.image;
  }

  if (business.url) {
    data.url = business.url;
  }

  if (business.openingHours) {
    data.openingHours = business.openingHours;
  }

  if (business.ratingValue && business.reviewCount) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: business.ratingValue,
      reviewCount: business.reviewCount,
    };
  }

  return data;
}

/**
 * Generate Course structured data
 */
export function generateCourseStructuredData(course: CourseData): StructuredData {
  const data: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: course.providerName,
      url: course.providerUrl,
    },
  };

  if (course.price) {
    data.offers = {
      '@type': 'Offer',
      price: course.price.toString(),
      priceCurrency: course.currency || 'EUR',
    };
  }

  return data;
}

/**
 * Generate JobPosting structured data
 */
export function generateJobPostingStructuredData(job: JobPostingData): StructuredData {
  const data: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.datePosted,
    employmentType: job.employmentType || 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.hiringOrganization,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
      },
    },
  };

  if (job.salaryValue) {
    data.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.salaryCurrency || 'EUR',
      value: {
        '@type': 'QuantitativeValue',
        value: job.salaryValue.toString(),
        unitText: job.salaryUnit || 'YEAR',
      },
    };
  }

  return data;
}

/**
 * Generate WebSite structured data with search action
 */
export function generateWebSiteStructuredData(
  name: string,
  url: string,
  description?: string,
  searchUrl?: string
): StructuredData {
  const data: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
  };

  if (description) {
    data.description = description;
  }

  if (searchUrl) {
    data.potentialAction = {
      '@type': 'SearchAction',
      target: `${searchUrl}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    };
  }

  return data;
}

/**
 * Generate HowTo structured data
 */
export function generateHowToStructuredData(
  name: string,
  description: string,
  image: string,
  totalTime: string,
  steps: Array<{ name: string; text: string }>,
  tools?: string[],
  supplies?: string[]
): StructuredData {
  const data: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    image,
    totalTime,
    step: steps.map((step) => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.text,
    })),
  };

  if (tools) {
    data.tool = tools.map((tool) => ({
      '@type': 'HowToTool',
      name: tool,
    }));
  }

  if (supplies) {
    data.supply = supplies.map((supply) => ({
      '@type': 'HowToSupply',
      name: supply,
    }));
  }

  return data;
}
