/**
 * Shared TypeScript types synchronized with Pydantic schemas
 * Generated from backend/app/schemas/
 */

// Base types
export interface BaseModel {
  id: number
  created_at: string
  updated_at?: string
}

// User types
export type UserRole = 'admin' | 'editor' | 'author' | 'subscriber'

export interface User extends BaseModel {
  email: string
  username: string
  full_name?: string
  role: UserRole
  is_active: boolean
  is_superuser?: boolean
  profile_picture?: string
  bio?: string
  website?: string
  social_links?: {
    twitter?: string
    linkedin?: string
    github?: string
  }
}

export interface UserCreate {
  email: string
  username: string
  password: string
  full_name?: string
  role?: UserRole
}

export interface UserUpdate {
  email?: string
  username?: string
  full_name?: string
  role?: UserRole
  is_active?: boolean
  profile_picture?: string
  bio?: string
  website?: string
  social_links?: {
    twitter?: string
    linkedin?: string
    github?: string
  }
}

// Auth types
export interface Token {
  access_token: string
  refresh_token?: string
  token_type: string
}

export interface TokenPayload {
  sub: string
  exp: number
  iat: number
  user_id: number
  role: UserRole
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse extends Token {
  user: User
}

// Post types
export type PostStatus = 'draft' | 'published' | 'scheduled' | 'archived'

export interface Post extends BaseModel {
  title: string
  slug: string
  content: string
  excerpt?: string
  featured_image?: string
  category_id?: number
  category?: Category
  author_id: number
  author?: User
  status: PostStatus
  is_published: boolean
  published_at?: string
  views: number
  likes_count?: number
  comments_count?: number
  reading_time?: number
  tags?: string[]
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
}

export interface PostCreate {
  title: string
  content: string
  excerpt?: string
  featured_image?: string
  category_id?: number
  status?: PostStatus
  is_published?: boolean
  published_at?: string
  tags?: string[]
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
}

export interface PostUpdate {
  title?: string
  content?: string
  excerpt?: string
  featured_image?: string
  category_id?: number
  status?: PostStatus
  is_published?: boolean
  published_at?: string
  tags?: string[]
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
}

// Category types
export interface Category extends BaseModel {
  name: string
  slug: string
  description?: string
  parent_id?: number
  parent?: Category
  children?: Category[]
  posts_count?: number
  image?: string
  order?: number
  is_active: boolean
  meta_title?: string
  meta_description?: string
}

export interface CategoryCreate {
  name: string
  description?: string
  parent_id?: number
  image?: string
  order?: number
  is_active?: boolean
  meta_title?: string
  meta_description?: string
}

export interface CategoryUpdate {
  name?: string
  description?: string
  parent_id?: number
  image?: string
  order?: number
  is_active?: boolean
  meta_title?: string
  meta_description?: string
}

// Page types
export type PageTemplate = 'default' | 'homepage' | 'about' | 'contact' | 'custom'

export interface Page extends BaseModel {
  title: string
  slug: string
  content: string
  template: PageTemplate
  is_published: boolean
  published_at?: string
  order?: number
  parent_id?: number
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  custom_css?: string
  custom_js?: string
}

export interface PageCreate {
  title: string
  content: string
  template?: PageTemplate
  is_published?: boolean
  published_at?: string
  order?: number
  parent_id?: number
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  custom_css?: string
  custom_js?: string
}

export interface PageUpdate {
  title?: string
  content?: string
  template?: PageTemplate
  is_published?: boolean
  published_at?: string
  order?: number
  parent_id?: number
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  custom_css?: string
  custom_js?: string
}

// Media types
export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other'

export interface Media extends BaseModel {
  filename: string
  original_filename: string
  file_path: string
  file_url: string
  file_size: number
  mime_type: string
  media_type: MediaType
  width?: number
  height?: number
  duration?: number
  uploaded_by: number
  uploader?: User
  alt_text?: string
  caption?: string
  title?: string
}

export interface MediaUpload {
  file: File
  alt_text?: string
  caption?: string
  title?: string
}

// Product types
export type ProductStatus = 'draft' | 'active' | 'archived'

export interface Product extends BaseModel {
  name: string
  slug: string
  description: string
  short_description?: string
  sku: string
  barcode?: string
  price: number
  sale_price?: number
  cost_price?: number
  stock: number
  low_stock_threshold?: number
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  images: string[]
  category_id?: number
  category?: Category
  brand?: string
  status: ProductStatus
  is_active: boolean
  is_featured: boolean
  attributes?: Record<string, unknown>
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
}

export interface ProductCreate {
  name: string
  description: string
  short_description?: string
  sku: string
  barcode?: string
  price: number
  sale_price?: number
  cost_price?: number
  stock: number
  low_stock_threshold?: number
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  images?: string[]
  category_id?: number
  brand?: string
  status?: ProductStatus
  is_active?: boolean
  is_featured?: boolean
  attributes?: Record<string, unknown>
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
}

export interface ProductUpdate {
  name?: string
  description?: string
  short_description?: string
  sku?: string
  barcode?: string
  price?: number
  sale_price?: number
  cost_price?: number
  stock?: number
  low_stock_threshold?: number
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  images?: string[]
  category_id?: number
  brand?: string
  status?: ProductStatus
  is_active?: boolean
  is_featured?: boolean
  attributes?: Record<string, unknown>
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
}

// Order types
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export type ShippingStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned'

export interface OrderItem {
  id: number
  product_id: number
  product?: Product
  quantity: number
  price: number
  discount?: number
  subtotal: number
}

export interface Order extends BaseModel {
  order_number: string
  customer_id?: number
  customer?: User
  customer_email: string
  customer_name: string
  customer_phone?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping_cost: number
  discount: number
  total: number
  status: OrderStatus
  payment_status: PaymentStatus
  shipping_status: ShippingStatus
  payment_method?: string
  shipping_method?: string
  shipping_address?: Address
  billing_address?: Address
  notes?: string
  tracking_number?: string
}

export interface Address {
  street: string
  city: string
  state?: string
  postal_code: string
  country: string
  phone?: string
}

// Settings types
export interface SiteSettings {
  site_name: string
  site_description?: string
  site_url: string
  site_logo?: string
  favicon?: string
  contact_email: string
  contact_phone?: string
  social_links?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
  }
  analytics_id?: string
  facebook_pixel_id?: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface PaginationParams {
  page?: number
  per_page?: number
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  success?: boolean
}

export interface ApiError {
  message: string
  detail?: string
  status_code?: number
  errors?: Record<string, string[]>
}

// Form utility types
export type FormData<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>

export type PartialFormData<T> = Partial<FormData<T>>
