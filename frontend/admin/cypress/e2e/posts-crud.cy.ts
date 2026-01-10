/**
 * E2E Test: Posts CRUD Operations
 */

describe('Posts Management', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'Test123!@#');
    cy.visit('/posts');
  });

  describe('Posts List', () => {
    it('displays posts list', () => {
      cy.contains(/posts|articles/i).should('be.visible');
      cy.get('table').should('be.visible');
    });

    it('shows empty state when no posts', () => {
      // Assuming no posts initially
      cy.contains(/no posts|empty/i);
    });

    it('filters posts by status', () => {
      cy.get('select[name="status"]').select('published');
      cy.url().should('include', 'status=published');
    });

    it('searches posts', () => {
      cy.get('input[placeholder*="search"]').type('test post');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', 'search=test');
    });

    it('paginates posts', () => {
      // Create multiple posts first
      for (let i = 0; i < 15; i++) {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/posts`,
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem('access_token')}`,
          },
          body: {
            title: `Test Post ${i}`,
            content: 'Test content',
            status: 'draft',
          },
        });
      }

      cy.reload();
      cy.contains('Next').click();
      cy.url().should('include', 'page=2');
    });
  });

  describe('Create Post', () => {
    beforeEach(() => {
      cy.contains(/new post|create/i).click();
      cy.url().should('include', '/posts/new');
    });

    it('displays create post form', () => {
      cy.get('input[name="title"]').should('be.visible');
      cy.get('textarea[name="content"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('shows validation errors', () => {
      cy.get('button[type="submit"]').click();
      cy.contains(/required/i).should('be.visible');
    });

    it('creates a new post as draft', () => {
      cy.get('input[name="title"]').type('My New Post');
      cy.get('textarea[name="content"]').type('This is the post content');
      cy.get('input[name="excerpt"]').type('Post excerpt');
      
      // Select category if exists
      cy.get('select[name="category_id"]').then(($select) => {
        if ($select.find('option').length > 1) {
          cy.get('select[name="category_id"]').select(1);
        }
      });

      // Save as draft
      cy.contains(/save draft|draft/i).click();
      
      // Should redirect to posts list
      cy.url().should('include', '/posts');
      cy.contains('My New Post').should('be.visible');
    });

    it('creates and publishes a post', () => {
      cy.get('input[name="title"]').type('Published Post');
      cy.get('textarea[name="content"]').type('Published content');
      
      // Publish
      cy.contains(/publish/i).click();
      
      cy.url().should('include', '/posts');
      cy.contains('Published Post').should('be.visible');
    });

    it('auto-generates slug from title', () => {
      cy.get('input[name="title"]').type('Test Post Title');
      cy.get('input[name="slug"]').should('have.value', 'test-post-title');
    });

    it('allows custom slug', () => {
      cy.get('input[name="title"]').type('Test Post');
      cy.get('input[name="slug"]').clear().type('custom-slug');
      cy.get('button[type="submit"]').click();
      
      // Verify slug was used
      cy.contains('custom-slug');
    });
  });

  describe('Edit Post', () => {
    let postId: number;

    beforeEach(() => {
      // Create a post to edit
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/posts`,
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('access_token')}`,
        },
        body: {
          title: 'Post to Edit',
          content: 'Original content',
          status: 'draft',
        },
      }).then((response) => {
        postId = response.body.id;
        cy.visit(`/posts/${postId}/edit`);
      });
    });

    it('loads existing post data', () => {
      cy.get('input[name="title"]').should('have.value', 'Post to Edit');
      cy.get('textarea[name="content"]').should('have.value', 'Original content');
    });

    it('updates post content', () => {
      cy.get('input[name="title"]').clear().type('Updated Title');
      cy.get('textarea[name="content"]').clear().type('Updated content');
      cy.get('button[type="submit"]').click();
      
      // Verify update
      cy.contains('Updated Title').should('be.visible');
    });

    it('changes post status', () => {
      cy.get('select[name="status"]').select('published');
      cy.get('button[type="submit"]').click();
      
      // Should show published status
      cy.contains(/published/i);
    });

    it('cancels editing', () => {
      cy.get('input[name="title"]').clear().type('Changed Title');
      cy.contains(/cancel/i).click();
      
      // Should go back to posts list
      cy.url().should('include', '/posts');
      cy.url().should('not.include', '/edit');
    });
  });

  describe('Delete Post', () => {
    beforeEach(() => {
      // Create a post to delete
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/posts`,
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('access_token')}`,
        },
        body: {
          title: 'Post to Delete',
          content: 'Will be deleted',
          status: 'draft',
        },
      });

      cy.visit('/posts');
    });

    it('shows delete confirmation dialog', () => {
      cy.contains('Post to Delete')
        .parents('tr')
        .find('[aria-label*="delete"]')
        .click();
      
      cy.contains(/are you sure|confirm/i).should('be.visible');
    });

    it('deletes post after confirmation', () => {
      cy.contains('Post to Delete')
        .parents('tr')
        .find('[aria-label*="delete"]')
        .click();
      
      cy.contains(/confirm|delete/i).click();
      
      // Post should be removed
      cy.contains('Post to Delete').should('not.exist');
    });

    it('cancels delete operation', () => {
      cy.contains('Post to Delete')
        .parents('tr')
        .find('[aria-label*="delete"]')
        .click();
      
      cy.contains(/cancel/i).click();
      
      // Post should still exist
      cy.contains('Post to Delete').should('be.visible');
    });
  });

  describe('View Post', () => {
    it('opens post in preview', () => {
      // Create and view a post
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/posts`,
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('access_token')}`,
        },
        body: {
          title: 'Preview Post',
          content: 'Preview content',
          status: 'published',
        },
      }).then((response) => {
        cy.visit(`/posts/${response.body.id}`);
        
        cy.contains('Preview Post').should('be.visible');
        cy.contains('Preview content').should('be.visible');
      });
    });
  });
});
