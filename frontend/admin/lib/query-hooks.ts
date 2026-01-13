/**
 * React Query Hooks for Admin Dashboard
 * Custom hooks for API calls using React Query
 */
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  authApi,
  postsApi,
  categoriesApi,
  mediaApi,
  pagesApi,
  usersApi,
  type Post,
  type Category,
  type Media,
  type Page,
  type User,
  type LoginRequest,
  type CreatePostRequest,
  type UpdatePostRequest,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
  type CreatePageRequest,
  type UpdatePageRequest,
  type CreateUserRequest,
  type UpdateUserRequest,
  type PaginatedResponse,
} from './api'

// Query keys
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (params?: unknown) => [...queryKeys.posts.lists(), params] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.posts.details(), id] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: () => [...queryKeys.categories.lists()] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.categories.details(), id] as const,
  },
  media: {
    all: ['media'] as const,
    lists: () => [...queryKeys.media.all, 'list'] as const,
    list: (params?: unknown) => [...queryKeys.media.lists(), params] as const,
    details: () => [...queryKeys.media.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.media.details(), id] as const,
  },
  pages: {
    all: ['pages'] as const,
    lists: () => [...queryKeys.pages.all, 'list'] as const,
    list: (params?: unknown) => [...queryKeys.pages.lists(), params] as const,
    details: () => [...queryKeys.pages.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.pages.details(), id] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params?: unknown) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
  },
}

// Auth hooks
export function useAuth() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => authApi.getMe(),
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

// Posts hooks
export function usePosts(params?: {
  page?: number
  per_page?: number
  search?: string
  category_id?: number
  is_published?: boolean
}) {
  return useQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: () => postsApi.list(params),
  })
}

export function usePost(id: number, options?: Omit<UseQueryOptions<Post>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.posts.detail(id),
    queryFn: () => postsApi.get(id),
    ...options,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePostRequest) => postsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() })
    },
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePostRequest }) => postsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(id) })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => postsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() })
    },
  })
}

// Categories hooks
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => categoriesApi.list(),
  })
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoriesApi.get(id),
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryRequest }) =>
      categoriesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(id) })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })
    },
  })
}

// Media hooks
export function useMedia(params?: { page?: number; per_page?: number; search?: string }) {
  return useQuery({
    queryKey: queryKeys.media.list(params),
    queryFn: () => mediaApi.list(params),
  })
}

export function useUploadMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (progress: number) => void }) =>
      mediaApi.upload(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.lists() })
    },
  })
}

export function useUploadMultipleMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ files, onProgress }: { files: File[]; onProgress?: (progress: number) => void }) =>
      mediaApi.uploadMultiple(files, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.lists() })
    },
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => mediaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.lists() })
    },
  })
}

// Pages hooks
export function usePages(params?: { page?: number; per_page?: number; search?: string }) {
  return useQuery({
    queryKey: queryKeys.pages.list(params),
    queryFn: () => pagesApi.list(params),
  })
}

export function usePage(id: number) {
  return useQuery({
    queryKey: queryKeys.pages.detail(id),
    queryFn: () => pagesApi.get(id),
  })
}

export function useCreatePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePageRequest) => pagesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.lists() })
    },
  })
}

export function useUpdatePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePageRequest }) => pagesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.detail(id) })
    },
  })
}

export function useDeletePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => pagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.lists() })
    },
  })
}

// Users hooks
export function useUsers(params?: {
  page?: number
  per_page?: number
  search?: string
  role?: string
}) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersApi.list(params),
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersApi.get(id),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) => usersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}
