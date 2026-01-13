/**
 * Mock Service Worker (MSW) Setup
 * Provides mock API responses for development and testing
 */
import { http, HttpResponse } from 'msw'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Mock data
const mockUser = {
  id: 1,
  email: 'admin@example.com',
  username: 'admin',
  full_name: 'Admin User',
  role: 'admin',
  is_active: true,
  profile_picture: null,
  created_at: new Date().toISOString(),
}

const mockPosts = [
  {
    id: 1,
    title: 'First Blog Post',
    slug: 'first-blog-post',
    content: '<p>This is the content of the first blog post.</p>',
    excerpt: 'This is the excerpt',
    featured_image: 'https://via.placeholder.com/800x400',
    category_id: 1,
    author_id: 1,
    is_published: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    views: 100,
    meta_title: 'First Blog Post',
    meta_description: 'This is the first blog post',
  },
  {
    id: 2,
    title: 'Second Blog Post',
    slug: 'second-blog-post',
    content: '<p>This is the content of the second blog post.</p>',
    excerpt: 'This is another excerpt',
    featured_image: 'https://via.placeholder.com/800x400',
    category_id: 1,
    author_id: 1,
    is_published: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    views: 50,
    meta_title: 'Second Blog Post',
    meta_description: 'This is the second blog post',
  },
]

const mockCategories = [
  {
    id: 1,
    name: 'Technology',
    slug: 'technology',
    description: 'Technology related posts',
    parent_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Business',
    slug: 'business',
    description: 'Business related posts',
    parent_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockProducts = [
  {
    id: 1,
    name: 'Product 1',
    slug: 'product-1',
    description: 'This is product 1',
    price: 99.99,
    sale_price: 79.99,
    sku: 'PROD-001',
    stock: 100,
    images: ['https://via.placeholder.com/600x600'],
    category_id: 1,
    is_active: true,
  },
  {
    id: 2,
    name: 'Product 2',
    slug: 'product-2',
    description: 'This is product 2',
    price: 149.99,
    sku: 'PROD-002',
    stock: 50,
    images: ['https://via.placeholder.com/600x600'],
    category_id: 2,
    is_active: true,
  },
]

// API handlers
export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { username: string; password: string }

    if (body.username === 'admin' && body.password === 'password') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        user: mockUser,
      })
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  http.post(`${API_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' })
  }),

  http.get(`${API_URL}/auth/me`, () => {
    return HttpResponse.json(mockUser)
  }),

  // Posts endpoints
  http.get(`${API_URL}/posts`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const per_page = parseInt(url.searchParams.get('per_page') || '10')

    return HttpResponse.json({
      data: mockPosts,
      total: mockPosts.length,
      page,
      per_page,
      total_pages: Math.ceil(mockPosts.length / per_page),
    })
  }),

  http.get(`${API_URL}/posts/:id`, ({ params }) => {
    const { id } = params
    const post = mockPosts.find((p) => p.id === parseInt(id as string))

    if (!post) {
      return HttpResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    return HttpResponse.json(post)
  }),

  http.post(`${API_URL}/posts`, async ({ request }) => {
    const body = await request.json() as any
    const newPost = {
      id: mockPosts.length + 1,
      ...body,
      slug: body.title.toLowerCase().replace(/\s+/g, '-'),
      author_id: 1,
      is_published: body.is_published || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      views: 0,
    }

    mockPosts.push(newPost)
    return HttpResponse.json(newPost, { status: 201 })
  }),

  http.put(`${API_URL}/posts/:id`, async ({ params, request }) => {
    const { id } = params
    const body = await request.json() as any
    const postIndex = mockPosts.findIndex((p) => p.id === parseInt(id as string))

    if (postIndex === -1) {
      return HttpResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    mockPosts[postIndex] = {
      ...mockPosts[postIndex],
      ...body,
      updated_at: new Date().toISOString(),
    }

    return HttpResponse.json(mockPosts[postIndex])
  }),

  http.delete(`${API_URL}/posts/:id`, ({ params }) => {
    const { id } = params
    const postIndex = mockPosts.findIndex((p) => p.id === parseInt(id as string))

    if (postIndex === -1) {
      return HttpResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    mockPosts.splice(postIndex, 1)
    return HttpResponse.json({ message: 'Post deleted' })
  }),

  // Categories endpoints
  http.get(`${API_URL}/categories`, () => {
    return HttpResponse.json(mockCategories)
  }),

  http.get(`${API_URL}/categories/:id`, ({ params }) => {
    const { id } = params
    const category = mockCategories.find((c) => c.id === parseInt(id as string))

    if (!category) {
      return HttpResponse.json({ message: 'Category not found' }, { status: 404 })
    }

    return HttpResponse.json(category)
  }),

  // Public API endpoints
  http.get(`${API_URL}/public/posts`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const per_page = parseInt(url.searchParams.get('per_page') || '10')

    return HttpResponse.json({
      data: mockPosts.filter((p) => p.is_published),
      total: mockPosts.filter((p) => p.is_published).length,
      page,
      per_page,
      total_pages: Math.ceil(mockPosts.filter((p) => p.is_published).length / per_page),
    })
  }),

  http.get(`${API_URL}/public/posts/:slug`, ({ params }) => {
    const { slug } = params
    const post = mockPosts.find((p) => p.slug === slug && p.is_published)

    if (!post) {
      return HttpResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    return HttpResponse.json(post)
  }),

  http.get(`${API_URL}/public/categories`, () => {
    return HttpResponse.json(mockCategories)
  }),

  http.get(`${API_URL}/public/products`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const per_page = parseInt(url.searchParams.get('per_page') || '10')

    return HttpResponse.json({
      data: mockProducts.filter((p) => p.is_active),
      total: mockProducts.filter((p) => p.is_active).length,
      page,
      per_page,
      total_pages: Math.ceil(mockProducts.filter((p) => p.is_active).length / per_page),
    })
  }),

  http.get(`${API_URL}/public/products/:slug`, ({ params }) => {
    const { slug } = params
    const product = mockProducts.find((p) => p.slug === slug && p.is_active)

    if (!product) {
      return HttpResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    return HttpResponse.json(product)
  }),

  // Contact form
  http.post(`${API_URL}/public/contact`, async ({ request }) => {
    const body = await request.json()
    console.log('Contact form submission:', body)
    return HttpResponse.json({ message: 'Message sent successfully' })
  }),

  // Newsletter
  http.post(`${API_URL}/public/newsletter/subscribe`, async ({ request }) => {
    const body = await request.json() as { email: string }
    console.log('Newsletter subscription:', body)
    return HttpResponse.json({ message: 'Subscribed successfully' })
  }),
]
