/**
 * React Query Hooks for Render/Storefront
 * Custom hooks for public API calls
 */
import { useQuery, useMutation, type UseQueryOptions } from '@tanstack/react-query'
import {
  postsPublicApi,
  categoriesPublicApi,
  pagesPublicApi,
  productsPublicApi,
  contactPublicApi,
  type Post,
  type Category,
  type Page,
  type Product,
  type PaginatedResponse,
} from './api'

// Query keys for public APIs
export const publicQueryKeys = {
  posts: {
    all: ['public', 'posts'] as const,
    lists: () => [...publicQueryKeys.posts.all, 'list'] as const,
    list: (params?: unknown) => [...publicQueryKeys.posts.lists(), params] as const,
    details: () => [...publicQueryKeys.posts.all, 'detail'] as const,
    detail: (slug: string) => [...publicQueryKeys.posts.details(), slug] as const,
    featured: () => [...publicQueryKeys.posts.all, 'featured'] as const,
    related: (id: number) => [...publicQueryKeys.posts.all, 'related', id] as const,
  },
  categories: {
    all: ['public', 'categories'] as const,
    lists: () => [...publicQueryKeys.categories.all, 'list'] as const,
    list: () => [...publicQueryKeys.categories.lists()] as const,
    details: () => [...publicQueryKeys.categories.all, 'detail'] as const,
    detail: (slug: string) => [...publicQueryKeys.categories.details(), slug] as const,
  },
  pages: {
    all: ['public', 'pages'] as const,
    details: () => [...publicQueryKeys.pages.all, 'detail'] as const,
    detail: (slug: string) => [...publicQueryKeys.pages.details(), slug] as const,
  },
  products: {
    all: ['public', 'products'] as const,
    lists: () => [...publicQueryKeys.products.all, 'list'] as const,
    list: (params?: unknown) => [...publicQueryKeys.products.lists(), params] as const,
    details: () => [...publicQueryKeys.products.all, 'detail'] as const,
    detail: (slug: string) => [...publicQueryKeys.products.details(), slug] as const,
    featured: () => [...publicQueryKeys.products.all, 'featured'] as const,
    search: (query: string) => [...publicQueryKeys.products.all, 'search', query] as const,
  },
}

// Posts hooks
export function usePublicPosts(params?: {
  page?: number
  per_page?: number
  category?: string
  search?: string
}) {
  return useQuery({
    queryKey: publicQueryKeys.posts.list(params),
    queryFn: () => postsPublicApi.list(params),
  })
}

export function usePublicPost(
  slug: string,
  options?: Omit<UseQueryOptions<Post>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: publicQueryKeys.posts.detail(slug),
    queryFn: () => postsPublicApi.getBySlug(slug),
    ...options,
  })
}

export function useFeaturedPosts(limit?: number) {
  return useQuery({
    queryKey: publicQueryKeys.posts.featured(),
    queryFn: () => postsPublicApi.getFeatured(limit),
  })
}

export function useRelatedPosts(postId: number, limit?: number) {
  return useQuery({
    queryKey: publicQueryKeys.posts.related(postId),
    queryFn: () => postsPublicApi.getRelated(postId, limit),
    enabled: !!postId,
  })
}

// Categories hooks
export function usePublicCategories() {
  return useQuery({
    queryKey: publicQueryKeys.categories.list(),
    queryFn: () => categoriesPublicApi.list(),
  })
}

export function usePublicCategory(slug: string) {
  return useQuery({
    queryKey: publicQueryKeys.categories.detail(slug),
    queryFn: () => categoriesPublicApi.getBySlug(slug),
  })
}

// Pages hooks
export function usePublicPage(slug: string) {
  return useQuery({
    queryKey: publicQueryKeys.pages.detail(slug),
    queryFn: () => pagesPublicApi.getBySlug(slug),
  })
}

// Products hooks
export function usePublicProducts(params?: {
  page?: number
  per_page?: number
  category?: string
  search?: string
  min_price?: number
  max_price?: number
  sort_by?: 'price' | 'name' | 'created_at'
  sort_order?: 'asc' | 'desc'
}) {
  return useQuery({
    queryKey: publicQueryKeys.products.list(params),
    queryFn: () => productsPublicApi.list(params),
  })
}

export function usePublicProduct(
  slug: string,
  options?: Omit<UseQueryOptions<Product>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: publicQueryKeys.products.detail(slug),
    queryFn: () => productsPublicApi.getBySlug(slug),
    ...options,
  })
}

export function useFeaturedProducts(limit?: number) {
  return useQuery({
    queryKey: publicQueryKeys.products.featured(),
    queryFn: () => productsPublicApi.getFeatured(limit),
  })
}

export function useProductSearch(query: string, limit?: number) {
  return useQuery({
    queryKey: publicQueryKeys.products.search(query),
    queryFn: () => productsPublicApi.search(query, limit),
    enabled: query.length > 2, // Only search if query is at least 3 characters
  })
}

// Contact form mutation
export function useContactForm() {
  return useMutation({
    mutationFn: (data: { name: string; email: string; subject?: string; message: string }) =>
      contactPublicApi.submitContact(data),
  })
}

// Newsletter subscription mutation
export function useNewsletterSubscribe() {
  return useMutation({
    mutationFn: (email: string) => contactPublicApi.subscribe(email),
  })
}
