/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login
     * @example cy.login('user@example.com', 'password')
     */
    login(email: string, password: string): Chainable<void>;
    
    /**
     * Custom command to logout
     * @example cy.logout()
     */
    logout(): Chainable<void>;
    
    /**
     * Custom command to seed database
     * @example cy.seedDatabase()
     */
    seedDatabase(): Chainable<void>;
    
    /**
     * Custom command to clear database
     * @example cy.clearDatabase()
     */
    clearDatabase(): Chainable<void>;
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    
    // Store tokens in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('access_token')).to.exist;
    });
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('access_token');
    win.localStorage.removeItem('refresh_token');
  });
  cy.visit('/login');
});

// Seed database command
Cypress.Commands.add('seedDatabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/seed`,
    failOnStatusCode: false,
  });
});

// Clear database command
Cypress.Commands.add('clearDatabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/clear`,
    failOnStatusCode: false,
  });
});

export {};
