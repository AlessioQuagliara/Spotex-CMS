/**
 * API Client Configuration for Admin Dashboard
 * Includes JWT token management, refresh logic, and error handling
 */
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'

// Costruisci l'URL base dell'API assicurandoti che includa /api/v1
const getApiUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  // Se l'URL termina già con /api/v1, non aggiungerlo di nuovo
  if (baseUrl.endsWith('/api/v1')) {
    return baseUrl
  }
  // Altrimenti aggiungilo
  return `${baseUrl}/api/v1`
}

const API_URL = getApiUrl()

console.log('🔧 API Configuration:', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_URL: API_URL
})

// Token management
let accessToken: string | null = null
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Get token from localStorage
const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return accessToken
}

// Cookie helpers
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document !== 'undefined') {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  }
}

const deleteCookie = (name: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  }
}

// Set token in localStorage, cookies, and memory
const setAccessToken = (token: string | null) => {
  accessToken = token
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('access_token', token)
      setCookie('access_token', token, 7) // Save to cookie for middleware
    } else {
      localStorage.removeItem('access_token')
      deleteCookie('access_token')
    }
  }
}

// Get refresh token from localStorage
const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token')
  }
  return null
}

// Set refresh token in localStorage and cookies
const setRefreshToken = (token: string | null) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('refresh_token', token)
      setCookie('refresh_token', token, 7) // Save to cookie for middleware
    } else {
      localStorage.removeItem('refresh_token')
      deleteCookie('refresh_token')
    }
  }
}

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`
      })
    }
    
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()

      if (!refreshToken) {
        // No refresh token, redirect to login
        if (typeof window !== 'undefined') {
          setAccessToken(null)
          setRefreshToken(null)
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      try {
        // Attempt to refresh token
        const response = await axios.post<{ access_token: string; refresh_token?: string }>(
          `${API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        )

        const { access_token, refresh_token } = response.data

        setAccessToken(access_token)
        if (refresh_token) {
          setRefreshToken(refresh_token)
        }

        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`
        }

        processQueue(null, access_token)
        isRefreshing = false

        // Retry original request
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error, null)
        isRefreshing = false

        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          setAccessToken(null)
          setRefreshToken(null)
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      console.error('❌ Forbidden (403):', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        message: 'You do not have permission to access this resource'
      })
    }

    if (error.response?.status === 404) {
      console.error('❌ Not Found (404):', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        message: 'The requested resource was not found',
        data: error.response?.data
      })
    }

    if (error.response?.status === 500) {
      console.error('❌ Server Error (500):', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        message: 'An internal server error occurred',
        data: error.response?.data
      })
    }

    return Promise.reject(error)
  }
)

// Types per le risposte API
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

export interface ApiError {
  message: string
  detail?: string
  status_code?: number
}

// Auth types
export interface LoginRequest {
  username: string  // Can be email or username
  password: string
}

export interface Token {
  access_token: string
  refresh_token?: string
  token_type: string
  user: User
}

export interface LoginResponse extends Token {}

export interface User {
  id: number
  email: string
  username: string
  full_name?: string
  role: 'admin' | 'editor' | 'author' | 'subscriber'
  is_active: boolean
  profile_picture?: string
  created_at: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  full_name?: string
  role?: string
}

export type RegisterResponse = Token

// Helper functions for API calls
export const apiClient = {
  /**
   * GET request
   */
  get: async <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.get<T>(url, config)
    return response.data
  },

  /**
   * POST request
   */
  post: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await api.post<T>(url, data, config)
    return response.data
  },

  /**
   * PUT request
   */
  put: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await api.put<T>(url, data, config)
    return response.data
  },

  /**
   * PATCH request
   */
  patch: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await api.patch<T>(url, data, config)
    return response.data
  },

  /**
   * DELETE request
   */
  delete: async <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.delete<T>(url, config)
    return response.data
  },

  /**
   * Upload file with progress tracking
   */
  upload: async <T = unknown>(
    url: string,
    file: File | Blob,
    onProgress?: (progress: number) => void,
    additionalData?: Record<string, unknown>
  ): Promise<T> => {
    const formData = new FormData()
    formData.append('file', file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    const response = await api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })

    return response.data
  },

  /**
   * Upload multiple files with progress tracking
   */
  uploadMultiple: async <T = unknown>(
    url: string,
    files: File[],
    onProgress?: (progress: number) => void,
    additionalData?: Record<string, unknown>
  ): Promise<T> => {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`files`, file)
    })

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    const response = await api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })

    return response.data
  },
}

// Auth API calls
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    // Usa /login/json che accetta JSON invece di form data
    const response = await api.post<LoginResponse>('/auth/login/json', data)
    const { access_token, refresh_token, user } = response.data
    
    setAccessToken(access_token)
    if (refresh_token) {
      setRefreshToken(refresh_token)
    }
    
    // Save user role to cookie for middleware
    if (user?.role) {
      setCookie('user_role', user.role, 7)
    }
    
    return response.data
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', data)
    const { access_token, refresh_token, user } = response.data
    
    setAccessToken(access_token)
    if (refresh_token) {
      setRefreshToken(refresh_token)
    }
    
    // Save user role to cookie for middleware
    if (user?.role) {
      setCookie('user_role', user.role, 7)
    }
    
    return response.data
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setRefreshToken(null)
      deleteCookie('user_role')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  },

  refreshToken: async (): Promise<LoginResponse> => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await api.post<LoginResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })

    const { access_token, refresh_token: new_refresh_token } = response.data

    setAccessToken(access_token)
    if (new_refresh_token) {
      setRefreshToken(new_refresh_token)
    }

    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me')
    return response.data
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<User>('/auth/me', data)
    return response.data
  },

  changePassword: async (data: {
    current_password: string
    new_password: string
  }): Promise<void> => {
    await api.post('/auth/change-password', data)
  },
}

// Posts API
export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt?: string
  featured_image?: string
  category_id?: number
  author_id: number
  is_published: boolean
  published_at?: string
  created_at: string
  updated_at: string
  views: number
  meta_title?: string
  meta_description?: string
}

export interface CreatePostRequest {
  title: string
  content: string
  excerpt?: string
  featured_image?: string
  category_id?: number
  is_published?: boolean
  published_at?: string
  meta_title?: string
  meta_description?: string
}

export type UpdatePostRequest = Partial<CreatePostRequest>

export const postsApi = {
  list: (params?: {
    page?: number
    per_page?: number
    search?: string
    category_id?: number
    is_published?: boolean
  }) => apiClient.get<PaginatedResponse<Post>>('/posts', { params }),

  get: (id: number) => apiClient.get<Post>(`/posts/${id}`),

  create: (data: CreatePostRequest) => apiClient.post<Post>('/posts', data),

  update: (id: number, data: UpdatePostRequest) => apiClient.put<Post>(`/posts/${id}`, data),

  delete: (id: number) => apiClient.delete(`/posts/${id}`),

  uploadImage: (file: File, onProgress?: (progress: number) => void) =>
    apiClient.upload<{ url: string }>('/media/upload', file, onProgress),
}

// Categories API
export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  parent_id?: number
  created_at: string
  updated_at: string
}

export interface CreateCategoryRequest {
  name: string
  description?: string
  parent_id?: number
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>

export const categoriesApi = {
  list: () => apiClient.get<Category[]>('/categories'),

  get: (id: number) => apiClient.get<Category>(`/categories/${id}`),

  create: (data: CreateCategoryRequest) => apiClient.post<Category>('/categories', data),

  update: (id: number, data: UpdateCategoryRequest) =>
    apiClient.put<Category>(`/categories/${id}`, data),

  delete: (id: number) => apiClient.delete(`/categories/${id}`),
}

// Media API
export interface Media {
  id: number
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type: string
  width?: number
  height?: number
  uploaded_by: number
  created_at: string
}

export const mediaApi = {
  list: (params?: { page?: number; per_page?: number; search?: string }) =>
    apiClient.get<PaginatedResponse<Media>>('/media', { params }),

  get: (id: number) => apiClient.get<Media>(`/media/${id}`),

  upload: (file: File, onProgress?: (progress: number) => void) =>
    apiClient.upload<Media>('/media/upload', file, onProgress),

  uploadMultiple: (files: File[], onProgress?: (progress: number) => void) =>
    apiClient.uploadMultiple<Media[]>('/media/upload-multiple', files, onProgress),

  delete: (id: number) => apiClient.delete(`/media/${id}`),
}

// Pages API
export interface Page {
  id: number
  title: string
  slug: string
  content: string
  template?: string
  is_published: boolean
  published_at?: string
  created_at: string
  updated_at: string
  meta_title?: string
  meta_description?: string
}

export interface CreatePageRequest {
  title: string
  content: string
  template?: string
  is_published?: boolean
  published_at?: string
  meta_title?: string
  meta_description?: string
}

export type UpdatePageRequest = Partial<CreatePageRequest>

export const pagesApi = {
  list: (params?: { page?: number; per_page?: number; search?: string }) =>
    apiClient.get<PaginatedResponse<Page>>('/pages', { params }),

  get: (id: number) => apiClient.get<Page>(`/pages/${id}`),

  create: (data: CreatePageRequest) => apiClient.post<Page>('/pages', data),

  update: (id: number, data: UpdatePageRequest) => apiClient.put<Page>(`/pages/${id}`, data),

  delete: (id: number) => apiClient.delete(`/pages/${id}`),
}

// Users API
export interface UserListItem extends User {
  posts_count?: number
}

export interface CreateUserRequest {
  email: string
  username: string
  password: string
  full_name?: string
  role: 'admin' | 'editor' | 'author' | 'subscriber'
}

export type UpdateUserRequest = Partial<Omit<CreateUserRequest, 'password'>>

export const usersApi = {
  list: (params?: { page?: number; per_page?: number; search?: string; role?: string }) =>
    apiClient.get<PaginatedResponse<UserListItem>>('/users', { params }),

  get: (id: number) => apiClient.get<User>(`/users/${id}`),

  create: (data: CreateUserRequest) => apiClient.post<User>('/users', data),

  update: (id: number, data: UpdateUserRequest) => apiClient.put<User>(`/users/${id}`, data),

  delete: (id: number) => apiClient.delete(`/users/${id}`),
}

// Export token management functions
export { getAccessToken, setAccessToken, getRefreshToken, setRefreshToken }
