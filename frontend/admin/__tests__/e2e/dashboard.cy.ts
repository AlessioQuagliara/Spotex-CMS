/**
 * Dashboard E2E Tests
 * Critical user journey: Login and view dashboard
 */

describe("Dashboard", () => {
  beforeEach(() => {
    // Reset state
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Mock API endpoints
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
    
    cy.intercept("GET", "/api/analytics/dashboard", {
      statusCode: 200,
      body: {
        revenue: { total: 10000, change: 15 },
        orders: { total: 150, change: 10 },
        customers: { total: 50, change: 5 },
        conversion_rate: { value: 3.5, change: 0.5 },
      },
    }).as("analytics");
    
    cy.intercept("GET", "/api/orders?*", {
      statusCode: 200,
      body: {
        items: [
          {
            id: 1,
            order_number: "ORD-001",
            customer_name: "John Doe",
            total: 199.98,
            status: "pending",
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
    }).as("orders");
  });
  
  it("logs in and displays dashboard", () => {
    cy.visit("/login");
    
    // Fill in login form
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("password");
    cy.get('button[type="submit"]').click();
    
    // Wait for login
    cy.wait("@login");
    
    // Should redirect to dashboard
    cy.url().should("include", "/dashboard");
    
    // Wait for analytics
    cy.wait("@analytics");
    
    // Verify dashboard elements
    cy.contains("Dashboard").should("be.visible");
    cy.contains("Revenue").should("be.visible");
    cy.contains("Orders").should("be.visible");
    cy.contains("Customers").should("be.visible");
  });
  
  it("displays correct analytics data", () => {
    // Login first
    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("password");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");
    
    // Wait for analytics
    cy.wait("@analytics");
    
    // Verify metrics
    cy.contains("€10,000").should("be.visible"); // Revenue
    cy.contains("+15%").should("be.visible"); // Revenue change
    cy.contains("150").should("be.visible"); // Orders
    cy.contains("+10%").should("be.visible"); // Orders change
  });
  
  it("displays recent orders", () => {
    // Login
    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("password");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");
    
    // Wait for orders
    cy.wait("@orders");
    
    // Verify orders table
    cy.contains("Recent Orders").should("be.visible");
    cy.contains("ORD-001").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("€199.98").should("be.visible");
  });
  
  it("navigates to orders page", () => {
    // Login
    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("password");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");
    
    // Click on orders link
    cy.contains("View All Orders").click();
    
    // Should navigate to orders page
    cy.url().should("include", "/orders");
  });
  
  it("refreshes data on reload", () => {
    // Login
    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("password");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");
    cy.wait("@analytics");
    
    // Reload page
    cy.reload();
    
    // Should fetch analytics again
    cy.wait("@analytics");
    cy.contains("€10,000").should("be.visible");
  });
  
  it("handles analytics loading state", () => {
    // Slow down API response
    cy.intercept("GET", "/api/analytics/dashboard", {
      statusCode: 200,
      delay: 1000,
      body: {
        revenue: { total: 10000, change: 15 },
        orders: { total: 150, change: 10 },
        customers: { total: 50, change: 5 },
        conversion_rate: { value: 3.5, change: 0.5 },
      },
    }).as("slowAnalytics");
    
    // Login
    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("password");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");
    
    // Should show loading state
    cy.contains("Loading").should("be.visible");
    
    // Wait for data
    cy.wait("@slowAnalytics");
    cy.contains("Loading").should("not.exist");
  });
  
  it("handles analytics error", () => {
    cy.intercept("GET", "/api/analytics/dashboard", {
      statusCode: 500,
      body: { error: "Internal server error" },
    }).as("analyticsError");
    
    // Login
    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("password");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");
    
    // Wait for error
    cy.wait("@analyticsError");
    
    // Should show error message
    cy.contains("Error loading analytics").should("be.visible");
  });
  
  it("is responsive on mobile", () => {
    // Set mobile viewport
    cy.viewport("iphone-x");
    
    // Login
    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("password");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");
    cy.wait("@analytics");
    
    // Verify mobile layout
    cy.get('[data-testid="mobile-menu"]').should("be.visible");
    cy.contains("Dashboard").should("be.visible");
  });
});
