/**
 * API Client Configuration for Render/Storefront
 * Public API with multi-tenant support and caching
 */
import axios, { AxiosError, AxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number
  perMilliseconds: number
}

class RateLimiter {
  private requests: number[] = []
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  canMakeRequest(): boolean {
    const now = Date.now()
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < this.config.perMilliseconds
    )

    if (this.requests.length < this.config.maxRequests) {
      this.requests.push(now)
      return true
    }

    return false
  }

  async waitForSlot(): Promise<void> {
    while (!this.canMakeRequest()) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}

// Initialize rate limiter (100 requests per 60 seconds)
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  perMilliseconds: 60000,
})

// Get tenant identifier from subdomain or custom header
const getTenantId = (): string | null => {
  if (typeof window === 'undefined') return null

  // Try to get tenant from subdomain
  const hostname = window.location.hostname
  const parts = hostname.split('.')

  // If subdomain exists and is not 'www'
  if (parts.length > 2 && parts[0] !== 'www') {
    return parts[0]
  }

  // Try to get from custom header or config
  return process.env.NEXT_PUBLIC_TENANT_ID || null
}

// Simple in-memory cache for public data
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>()

  set<T>(key: string, data: T, ttl: number = 300000): void {
    // Default 5 minutes TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }
}

const apiCache = new SimpleCache()

// Create axios instance for public API
export const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
})

// Request interceptor - Add tenant ID and rate limiting
publicApi.interceptors.request.use(
  async (config) => {
    // Apply rate limiting
    await rateLimiter.waitForSlot()

    // Add tenant header if available
    const tenantId = getTenantId()
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
publicApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please slow down requests.')
    }

    if (error.response?.status === 500) {
      console.error('Server error occurred')
    }

    return Promise.reject(error)
  }
)

// Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt?: string
  featured_image?: string
  category?: Category
  author?: Author
  is_published: boolean
  published_at: string
  created_at: string
  views: number
  meta_title?: string
  meta_description?: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
}

export interface Author {
  id: number
  username: string
  full_name?: string
  profile_picture?: string
}

export interface Page {
  id: number
  title: string
  slug: string
  content: string
  template?: string
  meta_title?: string
  meta_description?: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: number
  sale_price?: number
  sku: string
  stock: number
  images: string[]
  category?: Category
  is_active: boolean
}

// Helper functions with caching support
export const publicApiClient = {
  /**
   * GET request with optional caching
   */
  get: async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig & { cache?: boolean; cacheTTL?: number }
  ): Promise<T> => {
    const cacheKey = `GET:${url}:${JSON.stringify(config?.params || {})}`

    // Check cache if enabled
    if (config?.cache) {
      const cached = apiCache.get<T>(cacheKey)
      if (cached) {
        return cached
      }
    }

    const response = await publicApi.get<T>(url, config)

    // Store in cache if enabled
    if (config?.cache) {
      apiCache.set(cacheKey, response.data, config.cacheTTL)
    }

    return response.data
  },

  /**
   * POST request (no caching)
   */
  post: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await publicApi.post<T>(url, data, config)
    return response.data
  },

  /**
   * Clear cache for specific pattern or all
   */
  clearCache: (pattern?: string): void => {
    if (pattern) {
      // Clear specific cache entries
      apiCache.delete(pattern)
    } else {
      // Clear all cache
      apiCache.clear()
    }
  },
}

// Posts API (public)
export const postsPublicApi = {
  /**
   * Get published posts list
   */
  list: (params?: {
    page?: number
    per_page?: number
    category?: string
    search?: string
  }) =>
    publicApiClient.get<PaginatedResponse<Post>>('/public/posts', {
      params,
      cache: true,
      cacheTTL: 300000, // 5 minutes
    }),

  /**
   * Get single post by slug
   */
  getBySlug: (slug: string) =>
    publicApiClient.get<Post>(`/public/posts/${slug}`, {
      cache: true,
      cacheTTL: 300000,
    }),

  /**
   * Get featured posts
   */
  getFeatured: (limit: number = 5) =>
    publicApiClient.get<Post[]>(`/public/posts/featured`, {
      params: { limit },
      cache: true,
      cacheTTL: 600000, // 10 minutes
    }),

  /**
   * Get related posts
   */
  getRelated: (postId: number, limit: number = 5) =>
    publicApiClient.get<Post[]>(`/public/posts/${postId}/related`, {
      params: { limit },
      cache: true,
      cacheTTL: 600000,
    }),
}

// Categories API (public)
export const categoriesPublicApi = {
  /**
   * Get all categories
   */
  list: () =>
    publicApiClient.get<Category[]>('/public/categories', {
      cache: true,
      cacheTTL: 600000, // 10 minutes
    }),

  /**
   * Get category by slug
   */
  getBySlug: (slug: string) =>
    publicApiClient.get<Category>(`/public/categories/${slug}`, {
      cache: true,
      cacheTTL: 600000,
    }),
}

// Pages API (public)
export const pagesPublicApi = {
  /**
   * Get page by slug
   */
  getBySlug: (slug: string) =>
    publicApiClient.get<Page>(`/public/pages/${slug}`, {
      cache: true,
      cacheTTL: 300000,
    }),
}

// Products API (public)
export const productsPublicApi = {
  /**
   * Get products list
   */
  list: (params?: {
    page?: number
    per_page?: number
    category?: string
    search?: string
    min_price?: number
    max_price?: number
    sort_by?: 'price' | 'name' | 'created_at'
    sort_order?: 'asc' | 'desc'
  }) =>
    publicApiClient.get<PaginatedResponse<Product>>('/public/products', {
      params,
      cache: true,
      cacheTTL: 300000,
    }),

  /**
   * Get single product by slug
   */
  getBySlug: (slug: string) =>
    publicApiClient.get<Product>(`/public/products/${slug}`, {
      cache: true,
      cacheTTL: 300000,
    }),

  /**
   * Get featured products
   */
  getFeatured: (limit: number = 10) =>
    publicApiClient.get<Product[]>(`/public/products/featured`, {
      params: { limit },
      cache: true,
      cacheTTL: 600000,
    }),

  /**
   * Search products
   */
  search: (query: string, limit: number = 10) =>
    publicApiClient.get<Product[]>(`/public/products/search`, {
      params: { q: query, limit },
      cache: true,
      cacheTTL: 180000, // 3 minutes
    }),
}

// Contact/Newsletter API (public)
export const contactPublicApi = {
  /**
   * Submit contact form
   */
  submitContact: (data: {
    name: string
    email: string
    subject?: string
    message: string
  }) => publicApiClient.post('/public/contact', data),

  /**
   * Subscribe to newsletter
   */
  subscribe: (email: string) =>
    publicApiClient.post('/public/newsletter/subscribe', { email }),
}

// Export cache management
export { apiCache, getTenantId }
