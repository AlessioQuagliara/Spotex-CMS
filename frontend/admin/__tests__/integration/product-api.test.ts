/**
 * Product API Integration Tests
 */

import { server } from "../../setup/msw-server";
import { http, HttpResponse } from "msw";

describe("Product API Integration", () => {
  it("fetches products list", async () => {
    const response = await fetch("/api/products?page=1&limit=10");
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data).toEqual({
      items: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          slug: expect.any(String),
          price: expect.any(Number),
        }),
      ]),
      total: expect.any(Number),
      page: 1,
      limit: 10,
    });
  });
  
  it("fetches single product", async () => {
    const response = await fetch("/api/products/1");
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data).toEqual({
      id: 1,
      name: "Product 1",
      slug: "product-1",
      description: expect.any(String),
      price: 99.99,
      stock: 10,
      category_id: 1,
      images: expect.any(Array),
      created_at: expect.any(String),
    });
  });
  
  it("creates new product", async () => {
    const newProduct = {
      name: "New Product",
      slug: "new-product",
      description: "New description",
      price: 199.99,
      stock: 20,
      category_id: 1,
    };
    
    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newProduct),
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data).toMatchObject(newProduct);
    expect(data.id).toBeDefined();
    expect(data.created_at).toBeDefined();
  });
  
  it("updates existing product", async () => {
    const updates = {
      name: "Updated Product",
      price: 299.99,
    };
    
    const response = await fetch("/api/products/1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data).toMatchObject(updates);
    expect(data.id).toBe(1);
    expect(data.updated_at).toBeDefined();
  });
  
  it("deletes product", async () => {
    const response = await fetch("/api/products/1", {
      method: "DELETE",
    });
    
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
  });
  
  it("handles product not found", async () => {
    server.use(
      http.get("/api/products/:id", ({ params }) => {
        return HttpResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      })
    );
    
    const response = await fetch("/api/products/999");
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.error).toBe("Product not found");
  });
  
  it("handles validation errors", async () => {
    server.use(
      http.post("/api/products", () => {
        return HttpResponse.json(
          {
            error: "Validation failed",
            details: {
              name: "Name is required",
              price: "Price must be positive",
            },
          },
          { status: 400 }
        );
      })
    );
    
    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details).toBeDefined();
  });
  
  it("handles pagination correctly", async () => {
    const page1 = await fetch("/api/products?page=1&limit=1");
    const data1 = await page1.json();
    
    expect(data1.page).toBe(1);
    expect(data1.limit).toBe(1);
    
    const page2 = await fetch("/api/products?page=2&limit=1");
    const data2 = await page2.json();
    
    expect(data2.page).toBe(2);
    expect(data2.limit).toBe(1);
  });
  
  it("filters products by category", async () => {
    server.use(
      http.get("/api/products", ({ request }) => {
        const url = new URL(request.url);
        const categoryId = url.searchParams.get("category_id");
        
        return HttpResponse.json({
          items: [
            {
              id: 1,
              name: "Product 1",
              category_id: parseInt(categoryId || "1"),
            },
          ],
          total: 1,
        });
      })
    );
    
    const response = await fetch("/api/products?category_id=1");
    const data = await response.json();
    
    expect(data.items[0].category_id).toBe(1);
  });
  
  it("searches products by name", async () => {
    server.use(
      http.get("/api/products", ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("search");
        
        return HttpResponse.json({
          items: [
            {
              id: 1,
              name: search,
              slug: "test",
            },
          ],
          total: 1,
        });
      })
    );
    
    const response = await fetch("/api/products?search=Test");
    const data = await response.json();
    
    expect(data.items[0].name).toBe("Test");
  });
});
