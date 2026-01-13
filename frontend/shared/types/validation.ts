/**
 * Validation schemas using Zod
 * Synchronized with backend Pydantic schemas
 */
import { z } from 'zod'

// User validation schemas
export const userRoleSchema = z.enum(['admin', 'editor', 'author', 'subscriber'])

export const userCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, dashes, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  full_name: z.string().optional(),
  role: userRoleSchema.optional(),
})

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true })

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

// Post validation schemas
export const postStatusSchema = z.enum(['draft', 'published', 'scheduled', 'archived'])

export const postCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt is too long').optional(),
  featured_image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  category_id: z.number().int().positive().optional(),
  status: postStatusSchema.optional(),
  is_published: z.boolean().optional(),
  published_at: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  meta_title: z.string().max(70, 'Meta title is too long').optional(),
  meta_description: z.string().max(160, 'Meta description is too long').optional(),
  meta_keywords: z.array(z.string()).optional(),
})

export const postUpdateSchema = postCreateSchema.partial()

// Category validation schemas
export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  parent_id: z.number().int().positive().optional(),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  order: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
  meta_title: z.string().max(70, 'Meta title is too long').optional(),
  meta_description: z.string().max(160, 'Meta description is too long').optional(),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

// Page validation schemas
export const pageTemplateSchema = z.enum(['default', 'homepage', 'about', 'contact', 'custom'])

export const pageCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  template: pageTemplateSchema.optional(),
  is_published: z.boolean().optional(),
  published_at: z.string().datetime().optional(),
  order: z.number().int().nonnegative().optional(),
  parent_id: z.number().int().positive().optional(),
  meta_title: z.string().max(70, 'Meta title is too long').optional(),
  meta_description: z.string().max(160, 'Meta description is too long').optional(),
  meta_keywords: z.array(z.string()).optional(),
  custom_css: z.string().optional(),
  custom_js: z.string().optional(),
})

export const pageUpdateSchema = pageCreateSchema.partial()

// Product validation schemas
export const productStatusSchema = z.enum(['draft', 'active', 'archived'])

export const productCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  description: z.string().min(1, 'Description is required'),
  short_description: z.string().max(500, 'Short description is too long').optional(),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU is too long'),
  barcode: z.string().max(50, 'Barcode is too long').optional(),
  price: z.number().positive('Price must be positive'),
  sale_price: z.number().positive().optional(),
  cost_price: z.number().positive().optional(),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  low_stock_threshold: z.number().int().nonnegative().optional(),
  weight: z.number().positive().optional(),
  dimensions: z
    .object({
      length: z.number().positive().optional(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
    })
    .optional(),
  images: z.array(z.string().url()).optional(),
  category_id: z.number().int().positive().optional(),
  brand: z.string().max(100).optional(),
  status: productStatusSchema.optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  attributes: z.record(z.unknown()).optional(),
  meta_title: z.string().max(70, 'Meta title is too long').optional(),
  meta_description: z.string().max(160, 'Meta description is too long').optional(),
  meta_keywords: z.array(z.string()).optional(),
})

export const productUpdateSchema = productCreateSchema.partial()

// Contact form validation
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().max(200, 'Subject is too long').optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long'),
})

// Newsletter subscription validation
export const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// Address validation
export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
})

// Media upload validation
export const mediaUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  alt_text: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
  title: z.string().max(200).optional(),
})

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().max(100).optional(),
})

// Export types inferred from schemas
export type UserCreateInput = z.infer<typeof userCreateSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type PostCreateInput = z.infer<typeof postCreateSchema>
export type PostUpdateInput = z.infer<typeof postUpdateSchema>
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
export type PageCreateInput = z.infer<typeof pageCreateSchema>
export type PageUpdateInput = z.infer<typeof pageUpdateSchema>
export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
export type ContactFormInput = z.infer<typeof contactFormSchema>
export type NewsletterInput = z.infer<typeof newsletterSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type MediaUploadInput = z.infer<typeof mediaUploadSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
