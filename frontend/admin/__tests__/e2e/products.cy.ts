/**
 * Product CRUD E2E Tests
 * Critical user journey: Create, read, update, delete products
 */

describe("Product CRUD", () => {
  beforeEach(() => {
    // Reset state
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Login first
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 200,
      body: {
        token: "mock-token-123",
        user: {
          id: 1,
          email: "admin@example.com",
          name: "Admin User",
          role: "admin",
        },
      },
    }).as("login");
    
    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("password");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");
    
    // Mock products endpoint
    cy.intercept("GET", "/api/products?*", {
      statusCode: 200,
      body: {
        items: [
          {
            id: 1,
            name: "Test Product",
            slug: "test-product",
            price: 99.99,
            stock: 10,
            category_id: 1,
          },
        ],
        total: 1,
      },
    }).as("products");
    
    cy.intercept("GET", "/api/categories", {
      statusCode: 200,
      body: {
        items: [
          { id: 1, name: "Category 1", slug: "category-1" },
        ],
      },
    }).as("categories");
  });
  
  it("lists all products", () => {
    cy.visit("/products");
    cy.wait("@products");
    
    // Verify products table
    cy.contains("Products").should("be.visible");
    cy.contains("Test Product").should("be.visible");
    cy.contains("€99.99").should("be.visible");
    cy.contains("10").should("be.visible"); // Stock
  });
  
  it("creates new product", () => {
    cy.intercept("POST", "/api/products", {
      statusCode: 201,
      body: {
        id: 2,
        name: "New Product",
        slug: "new-product",
        description: "New description",
        price: 149.99,
        stock: 20,
        category_id: 1,
        created_at: "2024-01-01T00:00:00Z",
      },
    }).as("createProduct");
    
    cy.visit("/products");
    cy.wait("@products");
    
    // Click create button
    cy.contains("Create Product").click();
    
    // Fill in form
    cy.get('input[name="name"]').type("New Product");
    cy.get('input[name="slug"]').type("new-product");
    cy.get('textarea[name="description"]').type("New description");
    cy.get('input[name="price"]').type("149.99");
    cy.get('input[name="stock"]').type("20");
    cy.get('select[name="category_id"]').select("Category 1");
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Wait for creation
    cy.wait("@createProduct");
    
    // Should redirect to products list
    cy.url().should("include", "/products");
    cy.contains("Product created successfully").should("be.visible");
  });
  
  it("views product details", () => {
    cy.intercept("GET", "/api/products/1", {
      statusCode: 200,
      body: {
        id: 1,
        name: "Test Product",
        slug: "test-product",
        description: "Test description",
        price: 99.99,
        stock: 10,
        category_id: 1,
        images: [
          { id: 1, url: "/images/test.jpg", alt: "Test image" },
        ],
        created_at: "2024-01-01T00:00:00Z",
      },
    }).as("product");
    
    cy.visit("/products");
    cy.wait("@products");
    
    // Click on product
    cy.contains("Test Product").click();
    
    // Wait for product details
    cy.wait("@product");
    
    // Verify details
    cy.contains("Test Product").should("be.visible");
    cy.contains("Test description").should("be.visible");
    cy.contains("€99.99").should("be.visible");
  });
  
  it("updates product", () => {
    cy.intercept("GET", "/api/products/1", {
      statusCode: 200,
      body: {
        id: 1,
        name: "Test Product",
        slug: "test-product",
        description: "Test description",
        price: 99.99,
        stock: 10,
        category_id: 1,
      },
    }).as("product");
    
    cy.intercept("PUT", "/api/products/1", {
      statusCode: 200,
      body: {
        id: 1,
        name: "Updated Product",
        slug: "test-product",
        description: "Test description",
        price: 129.99,
        stock: 15,
        category_id: 1,
        updated_at: "2024-01-02T00:00:00Z",
      },
    }).as("updateProduct");
    
    cy.visit("/products/1/edit");
    cy.wait("@product");
    
    // Update fields
    cy.get('input[name="name"]').clear().type("Updated Product");
    cy.get('input[name="price"]').clear().type("129.99");
    cy.get('input[name="stock"]').clear().type("15");
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Wait for update
    cy.wait("@updateProduct");
    
    // Should show success message
    cy.contains("Product updated successfully").should("be.visible");
  });
  
  it("deletes product", () => {
    cy.intercept("DELETE", "/api/products/1", {
      statusCode: 200,
      body: { success: true },
    }).as("deleteProduct");
    
    cy.visit("/products");
    cy.wait("@products");
    
    // Click delete button
    cy.get('[data-testid="delete-product-1"]').click();
    
    // Confirm deletion
    cy.contains("Are you sure").should("be.visible");
    cy.contains("Delete").click();
    
    // Wait for deletion
    cy.wait("@deleteProduct");
    
    // Should show success message
    cy.contains("Product deleted successfully").should("be.visible");
  });
  
  it("validates product form", () => {
    cy.visit("/products/create");
    
    // Try to submit empty form
    cy.get('button[type="submit"]').click();
    
    // Should show validation errors
    cy.contains("Name is required").should("be.visible");
    cy.contains("Price is required").should("be.visible");
    cy.contains("Stock is required").should("be.visible");
  });
  
  it("searches products", () => {
    cy.intercept("GET", "/api/products?search=Test*", {
      statusCode: 200,
      body: {
        items: [
          {
            id: 1,
            name: "Test Product",
            slug: "test-product",
            price: 99.99,
          },
        ],
        total: 1,
      },
    }).as("searchProducts");
    
    cy.visit("/products");
    cy.wait("@products");
    
    // Search for product
    cy.get('input[placeholder="Search products"]').type("Test");
    cy.get('button[type="submit"]').click();
    
    // Wait for search results
    cy.wait("@searchProducts");
    
    // Verify results
    cy.contains("Test Product").should("be.visible");
  });
  
  it("filters products by category", () => {
    cy.intercept("GET", "/api/products?category_id=1*", {
      statusCode: 200,
      body: {
        items: [
          {
            id: 1,
            name: "Test Product",
            category_id: 1,
          },
        ],
        total: 1,
      },
    }).as("filterProducts");
    
    cy.visit("/products");
    cy.wait("@products");
    
    // Select category filter
    cy.get('select[name="category"]').select("Category 1");
    
    // Wait for filtered results
    cy.wait("@filterProducts");
    
    // Verify results
    cy.contains("Test Product").should("be.visible");
  });
  
  it("paginates products", () => {
    cy.intercept("GET", "/api/products?page=2*", {
      statusCode: 200,
      body: {
        items: [
          {
            id: 11,
            name: "Product 11",
            price: 99.99,
          },
        ],
        total: 20,
        page: 2,
        totalPages: 2,
      },
    }).as("page2");
    
    cy.visit("/products");
    cy.wait("@products");
    
    // Click next page
    cy.contains("Next").click();
    
    // Wait for page 2
    cy.wait("@page2");
    
    // Verify page 2 content
    cy.contains("Product 11").should("be.visible");
  });
  
  it("uploads product image", () => {
    cy.intercept("POST", "/api/media/upload", {
      statusCode: 200,
      body: {
        id: 1,
        url: "/uploads/image-123.jpg",
        filename: "image-123.jpg",
      },
    }).as("uploadImage");
    
    cy.visit("/products/create");
    
    // Upload image
    cy.get('input[type="file"]').selectFile("cypress/fixtures/test-image.jpg", {
      force: true,
    });
    
    // Wait for upload
    cy.wait("@uploadImage");
    
    // Verify image preview
    cy.get('img[src="/uploads/image-123.jpg"]').should("be.visible");
  });
});
