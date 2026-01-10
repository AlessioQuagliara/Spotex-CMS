/**
 * E2E Test: Media Management
 */

describe('Media Library', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'Test123!@#');
    cy.visit('/dashboard/media');
  });

  it('displays media library', () => {
    cy.contains(/media|files/i).should('be.visible');
  });

  it('shows upload button', () => {
    cy.contains(/upload/i).should('be.visible');
  });

  it('displays media grid', () => {
    cy.get('[data-testid="media-grid"]').should('exist');
  });

  it('filters media by type', () => {
    cy.get('select[name="type"]').select('images');
    // Should show only images
  });

  it('searches media', () => {
    cy.get('input[placeholder*="search"]').type('test');
    cy.get('button[type="submit"]').click();
  });

  it('shows media details on click', () => {
    // Click first media item if exists
    cy.get('[data-testid="media-item"]').first().click();
    
    // Should show details sidebar or modal
    cy.contains(/details|properties/i);
  });
});

describe('Dashboard Stats', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'Test123!@#');
    cy.visit('/dashboard');
  });

  it('displays dashboard overview', () => {
    cy.contains(/dashboard|overview/i).should('be.visible');
  });

  it('shows post statistics', () => {
    cy.contains(/posts|articles/i);
    cy.get('[data-testid="posts-count"]').should('exist');
  });

  it('shows recent activity', () => {
    cy.contains(/recent|activity/i);
  });

  it('navigates to posts from quick action', () => {
    cy.contains(/new post|create/i).click();
    cy.url().should('include', '/posts');
  });
});
