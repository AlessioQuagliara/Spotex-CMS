/**
 * MSW (Mock Service Worker) Setup
 * Mock API calls for testing
 */

import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Mock API handlers
export const handlers = [
  // Auth endpoints
  http.post("/api/auth/login", async ({ request }) => {
    const { email, password } = await request.json();
    
    if (email === "admin@example.com" && password === "password") {
      return HttpResponse.json({
        token: "mock-token-123",
        user: {
          id: 1,
          email: "admin@example.com",
          name: "Admin User",
          role: "admin",
        },
      });
    }
    
    return HttpResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }),
  
  http.post("/api/auth/logout", () => {
    return HttpResponse.json({ success: true });
  }),
  
  http.get("/api/auth/me", () => {
    return HttpResponse.json({
      id: 1,
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
    });
  }),
  
  // Products endpoints
  http.get("/api/products", ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    
    return HttpResponse.json({
      items: [
        {
          id: 1,
          name: "Product 1",
          slug: "product-1",
          description: "Description 1",
          price: 99.99,
          stock: 10,
          category_id: 1,
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          name: "Product 2",
          slug: "product-2",
          description: "Description 2",
          price: 149.99,
          stock: 5,
          category_id: 1,
          created_at: "2024-01-02T00:00:00Z",
        },
      ],
      total: 2,
      page,
      limit,
      totalPages: 1,
    });
  }),
  
  http.get("/api/products/:id", ({ params }) => {
    const { id } = params;
    
    return HttpResponse.json({
      id: parseInt(id as string),
      name: `Product ${id}`,
      slug: `product-${id}`,
      description: `Description for product ${id}`,
      price: 99.99,
      stock: 10,
      category_id: 1,
      images: [
        { id: 1, url: "/images/product-1.jpg", alt: "Product image" },
      ],
      created_at: "2024-01-01T00:00:00Z",
    });
  }),
  
  http.post("/api/products", async ({ request }) => {
    const data = await request.json();
    
    return HttpResponse.json({
      id: 3,
      ...data,
      created_at: new Date().toISOString(),
    }, { status: 201 });
  }),
  
  http.put("/api/products/:id", async ({ params, request }) => {
    const { id } = params;
    const data = await request.json();
    
    return HttpResponse.json({
      id: parseInt(id as string),
      ...data,
      updated_at: new Date().toISOString(),
    });
  }),
  
  http.delete("/api/products/:id", ({ params }) => {
    return HttpResponse.json({ success: true });
  }),
  
  // Categories endpoints
  http.get("/api/categories", () => {
    return HttpResponse.json({
      items: [
        { id: 1, name: "Category 1", slug: "category-1" },
        { id: 2, name: "Category 2", slug: "category-2" },
      ],
      total: 2,
    });
  }),
  
  // Orders endpoints
  http.get("/api/orders", () => {
    return HttpResponse.json({
      items: [
        {
          id: 1,
          order_number: "ORD-001",
          customer_name: "John Doe",
          customer_email: "john@example.com",
          total: 199.98,
          status: "pending",
          created_at: "2024-01-01T00:00:00Z",
        },
      ],
      total: 1,
    });
  }),
  
  http.get("/api/orders/:id", ({ params }) => {
    const { id } = params;
    
    return HttpResponse.json({
      id: parseInt(id as string),
      order_number: `ORD-${id}`,
      customer_name: "John Doe",
      customer_email: "john@example.com",
      total: 199.98,
      status: "pending",
      items: [
        {
          id: 1,
          product_id: 1,
          product_name: "Product 1",
          quantity: 2,
          price: 99.99,
        },
      ],
      created_at: "2024-01-01T00:00:00Z",
    });
  }),
  
  // Analytics endpoints
  http.get("/api/analytics/dashboard", () => {
    return HttpResponse.json({
      revenue: {
        total: 10000,
        change: 15,
      },
      orders: {
        total: 150,
        change: 10,
      },
      customers: {
        total: 50,
        change: 5,
      },
      conversion_rate: {
        value: 3.5,
        change: 0.5,
      },
    });
  }),
  
  // Media endpoints
  http.post("/api/media/upload", () => {
    return HttpResponse.json({
      id: 1,
      url: "/uploads/image-123.jpg",
      filename: "image-123.jpg",
      size: 1024000,
      mime_type: "image/jpeg",
    });
  }),
];

// Setup server
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
