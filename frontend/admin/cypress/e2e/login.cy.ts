/**
 * E2E Test: Login Flow
 */

describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('displays login form', () => {
    cy.get('h1').should('contain', 'Login');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('shows validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    
    // Should show validation errors
    cy.contains('required').should('be.visible');
  });

  it('shows error for invalid credentials', () => {
    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    // Should show error message
    cy.contains(/invalid|incorrect/i).should('be.visible');
  });

  it('successfully logs in with valid credentials', () => {
    // First register a test user
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test123!@#',
      full_name: 'Test User',
    });

    // Now login
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Test123!@#');
    cy.get('button[type="submit"]').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Should have token in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('access_token')).to.exist;
    });
  });

  it('redirects to dashboard if already logged in', () => {
    cy.login('test@example.com', 'Test123!@#');
    cy.visit('/login');
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
  });

  it('shows/hides password', () => {
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    
    // Click show password button if it exists
    cy.get('button[aria-label*="password"]').click({ force: true });
    cy.get('input[name="password"]').should('have.attr', 'type', 'text');
  });

  it('navigates to register page', () => {
    cy.contains(/sign up|register/i).click();
    cy.url().should('include', '/register');
  });
});

describe('Logout Flow', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'Test123!@#');
    cy.visit('/dashboard');
  });

  it('successfully logs out', () => {
    // Click logout button
    cy.contains(/logout|sign out/i).click();
    
    // Should redirect to login
    cy.url().should('include', '/login');
    
    // Should clear tokens
    cy.window().then((win) => {
      expect(win.localStorage.getItem('access_token')).to.be.null;
    });
  });

  it('redirects to login when accessing protected route after logout', () => {
    cy.logout();
    cy.visit('/dashboard');
    
    // Should redirect to login
    cy.url().should('include', '/login');
  });
});
