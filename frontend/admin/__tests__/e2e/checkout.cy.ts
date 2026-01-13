/**
 * Checkout Flow E2E Tests
 * Critical user journey: Browse products and complete checkout
 */

describe("Checkout Flow", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Mock products
    cy.intercept("GET", "/api/products?*", {
      statusCode: 200,
      body: {
        items: [
          {
            id: 1,
            name: "Product 1",
            slug: "product-1",
            price: 99.99,
            stock: 10,
          },
          {
            id: 2,
            name: "Product 2",
            slug: "product-2",
            price: 149.99,
            stock: 5,
          },
        ],
        total: 2,
      },
    }).as("products");
    
    // Mock cart endpoints
    cy.intercept("POST", "/api/cart/add", {
      statusCode: 200,
      body: { success: true },
    }).as("addToCart");
    
    cy.intercept("GET", "/api/cart", {
      statusCode: 200,
      body: {
        items: [],
        total: 0,
      },
    }).as("cart");
  });
  
  it("completes full checkout flow", () => {
    // Browse products
    cy.visit("/");
    cy.wait("@products");
    
    // Add product to cart
    cy.contains("Product 1").parent().find('[data-testid="add-to-cart"]').click();
    cy.wait("@addToCart");
    
    // Verify cart updated
    cy.contains("Cart (1)").should("be.visible");
    
    // Go to cart
    cy.contains("Cart").click();
    cy.url().should("include", "/cart");
    
    // Verify cart contents
    cy.contains("Product 1").should("be.visible");
    cy.contains("€99.99").should("be.visible");
    
    // Proceed to checkout
    cy.intercept("POST", "/api/checkout", {
      statusCode: 200,
      body: {
        order_id: 1,
        order_number: "ORD-001",
        total: 99.99,
        payment_url: "https://payment.example.com/123",
      },
    }).as("checkout");
    
    cy.contains("Checkout").click();
    
    // Fill in shipping details
    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Doe");
    cy.get('input[name="email"]').type("john@example.com");
    cy.get('input[name="address"]').type("123 Main St");
    cy.get('input[name="city"]').type("New York");
    cy.get('input[name="postalCode"]').type("10001");
    cy.get('input[name="country"]').select("US");
    
    // Submit order
    cy.contains("Place Order").click();
    
    // Wait for checkout
    cy.wait("@checkout");
    
    // Should redirect to confirmation
    cy.url().should("include", "/order/confirmation");
    cy.contains("Order Confirmed").should("be.visible");
    cy.contains("ORD-001").should("be.visible");
  });
  
  it("adds multiple products to cart", () => {
    cy.visit("/");
    cy.wait("@products");
    
    // Add first product
    cy.get('[data-testid="add-to-cart-1"]').click();
    cy.wait("@addToCart");
    
    // Add second product
    cy.get('[data-testid="add-to-cart-2"]').click();
    cy.wait("@addToCart");
    
    // Verify cart count
    cy.contains("Cart (2)").should("be.visible");
  });
  
  it("updates cart quantities", () => {
    cy.intercept("GET", "/api/cart", {
      statusCode: 200,
      body: {
        items: [
          {
            id: 1,
            product_id: 1,
            name: "Product 1",
            price: 99.99,
            quantity: 1,
          },
        ],
        total: 99.99,
      },
    }).as("cartWithItems");
    
    cy.intercept("PUT", "/api/cart/1", {
      statusCode: 200,
      body: { success: true },
    }).as("updateCart");
    
    cy.visit("/cart");
    cy.wait("@cartWithItems");
    
    // Increase quantity
    cy.get('[data-testid="increase-quantity-1"]').click();
    cy.wait("@updateCart");
    
    // Verify updated total
    cy.contains("€199.98").should("be.visible");
  });
  
  it("removes item from cart", () => {
    cy.intercept("GET", "/api/cart", {
      statusCode: 200,
      body: {
        items: [
          {
            id: 1,
            product_id: 1,
            name: "Product 1",
            price: 99.99,
            quantity: 1,
          },
        ],
        total: 99.99,
      },
    }).as("cartWithItems");
    
    cy.intercept("DELETE", "/api/cart/1", {
      statusCode: 200,
      body: { success: true },
    }).as("removeFromCart");
    
    cy.visit("/cart");
    cy.wait("@cartWithItems");
    
    // Remove item
    cy.get('[data-testid="remove-item-1"]').click();
    cy.wait("@removeFromCart");
    
    // Verify empty cart
    cy.contains("Your cart is empty").should("be.visible");
  });
  
  it("validates checkout form", () => {
    cy.intercept("GET", "/api/cart", {
      statusCode: 200,
      body: {
        items: [
          {
            id: 1,
            product_id: 1,
            name: "Product 1",
            price: 99.99,
            quantity: 1,
          },
        ],
        total: 99.99,
      },
    }).as("cartWithItems");
    
    cy.visit("/cart");
    cy.wait("@cartWithItems");
    
    cy.contains("Checkout").click();
    
    // Try to submit without filling form
    cy.contains("Place Order").click();
    
    // Should show validation errors
    cy.contains("First name is required").should("be.visible");
    cy.contains("Email is required").should("be.visible");
    cy.contains("Address is required").should("be.visible");
  });
  
  it("applies discount code", () => {
    cy.intercept("GET", "/api/cart", {
      statusCode: 200,
      body: {
        items: [
          {
            id: 1,
            product_id: 1,
            name: "Product 1",
            price: 99.99,
            quantity: 1,
          },
        ],
        total: 99.99,
      },
    }).as("cartWithItems");
    
    cy.intercept("POST", "/api/cart/discount", {
      statusCode: 200,
      body: {
        discount: 10,
        new_total: 89.99,
      },
    }).as("applyDiscount");
    
    cy.visit("/cart");
    cy.wait("@cartWithItems");
    
    // Apply discount code
    cy.get('input[name="discountCode"]').type("SAVE10");
    cy.contains("Apply").click();
    
    cy.wait("@applyDiscount");
    
    // Verify discounted total
    cy.contains("€89.99").should("be.visible");
    cy.contains("Discount: €10.00").should("be.visible");
  });
  
  it("handles out of stock products", () => {
    cy.intercept("POST", "/api/cart/add", {
      statusCode: 400,
      body: {
        error: "Product out of stock",
      },
    }).as("outOfStock");
    
    cy.visit("/");
    cy.wait("@products");
    
    // Try to add out of stock product
    cy.get('[data-testid="add-to-cart-1"]').click();
    
    cy.wait("@outOfStock");
    
    // Should show error message
    cy.contains("Product out of stock").should("be.visible");
  });
  
  it("saves cart for later", () => {
    cy.intercept("GET", "/api/cart", {
      statusCode: 200,
      body: {
        items: [
          {
            id: 1,
            product_id: 1,
            name: "Product 1",
            price: 99.99,
            quantity: 1,
          },
        ],
        total: 99.99,
      },
    }).as("cartWithItems");
    
    cy.visit("/cart");
    cy.wait("@cartWithItems");
    
    // Cart should persist in localStorage
    cy.window().then((win) => {
      const cart = win.localStorage.getItem("cart");
      expect(cart).to.exist;
    });
    
    // Reload page
    cy.reload();
    
    // Cart should still be there
    cy.contains("Product 1").should("be.visible");
  });
  
  it("clears cart after successful checkout", () => {
    cy.intercept("GET", "/api/cart", {
      statusCode: 200,
      body: {
        items: [
          {
            id: 1,
            product_id: 1,
            name: "Product 1",
            price: 99.99,
            quantity: 1,
          },
        ],
        total: 99.99,
      },
    }).as("cartWithItems");
    
    cy.intercept("POST", "/api/checkout", {
      statusCode: 200,
      body: {
        order_id: 1,
        order_number: "ORD-001",
      },
    }).as("checkout");
    
    cy.visit("/cart");
    cy.wait("@cartWithItems");
    
    cy.contains("Checkout").click();
    
    // Fill in form
    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Doe");
    cy.get('input[name="email"]').type("john@example.com");
    cy.get('input[name="address"]').type("123 Main St");
    cy.get('input[name="city"]').type("New York");
    cy.get('input[name="postalCode"]').type("10001");
    cy.get('input[name="country"]').select("US");
    
    cy.contains("Place Order").click();
    cy.wait("@checkout");
    
    // Go back to cart
    cy.visit("/cart");
    
    // Cart should be empty
    cy.contains("Your cart is empty").should("be.visible");
  });
});
