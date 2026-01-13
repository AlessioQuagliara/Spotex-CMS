/**
 * Visual Regression Testing with Cypress
 * Compare screenshots to detect visual changes
 */

/**
 * Take and compare screenshot
 */
export function compareSnapshot(name: string, options?: any) {
  cy.screenshot(name, {
    capture: "viewport",
    ...options,
  });
}

/**
 * Visual test for component
 */
export function visualTest(name: string, selector?: string) {
  if (selector) {
    cy.get(selector).should("be.visible");
  }
  
  // Wait for fonts to load
  cy.document().its("fonts.status").should("equal", "loaded");
  
  // Wait for images to load
  cy.get("img").should("be.visible").and(($imgs) => {
    $imgs.each((_, img) => {
      expect(img.naturalWidth).to.be.greaterThan(0);
    });
  });
  
  compareSnapshot(name);
}

/**
 * Test responsive layouts
 */
export function testResponsive(name: string, viewports: string[]) {
  viewports.forEach((viewport) => {
    cy.viewport(viewport as any);
    cy.wait(500); // Wait for layout shift
    compareSnapshot(`${name}-${viewport}`);
  });
}

/**
 * Test dark mode
 */
export function testDarkMode(name: string) {
  // Test light mode
  compareSnapshot(`${name}-light`);
  
  // Switch to dark mode
  cy.get('[data-testid="theme-toggle"]').click();
  cy.wait(300);
  
  // Test dark mode
  compareSnapshot(`${name}-dark`);
}

/**
 * Test hover states
 */
export function testHoverState(selector: string, name: string) {
  cy.get(selector).realHover();
  cy.wait(200);
  compareSnapshot(`${name}-hover`);
}

/**
 * Test focus states
 */
export function testFocusState(selector: string, name: string) {
  cy.get(selector).focus();
  cy.wait(200);
  compareSnapshot(`${name}-focus`);
}

/**
 * Test animation states
 */
export function testAnimationStates(name: string) {
  // Capture start state
  compareSnapshot(`${name}-start`);
  
  // Wait for animation
  cy.wait(1000);
  
  // Capture end state
  compareSnapshot(`${name}-end`);
}

/**
 * Test loading states
 */
export function testLoadingState(name: string) {
  // Capture loading state
  cy.contains("Loading").should("be.visible");
  compareSnapshot(`${name}-loading`);
  
  // Wait for content
  cy.contains("Loading").should("not.exist");
  compareSnapshot(`${name}-loaded`);
}

/**
 * Test error states
 */
export function testErrorState(name: string) {
  // Trigger error
  cy.intercept("GET", "/api/**", {
    statusCode: 500,
    body: { error: "Internal server error" },
  });
  
  // Wait for error message
  cy.contains(/error/i).should("be.visible");
  compareSnapshot(`${name}-error`);
}

/**
 * Test empty states
 */
export function testEmptyState(name: string) {
  cy.contains(/empty|no items|nothing/i).should("be.visible");
  compareSnapshot(`${name}-empty`);
}

/**
 * Test scroll behavior
 */
export function testScrollBehavior(name: string) {
  // Capture top
  compareSnapshot(`${name}-scroll-top`);
  
  // Scroll to middle
  cy.scrollTo("center");
  cy.wait(300);
  compareSnapshot(`${name}-scroll-middle`);
  
  // Scroll to bottom
  cy.scrollTo("bottom");
  cy.wait(300);
  compareSnapshot(`${name}-scroll-bottom`);
}

/**
 * Test modal/overlay
 */
export function testModal(triggerSelector: string, name: string) {
  // Capture before modal
  compareSnapshot(`${name}-before`);
  
  // Open modal
  cy.get(triggerSelector).click();
  cy.wait(300);
  
  // Capture modal
  compareSnapshot(`${name}-modal`);
  
  // Close modal
  cy.get('[data-testid="close-modal"]').click();
  cy.wait(300);
  
  // Capture after modal
  compareSnapshot(`${name}-after`);
}

/**
 * Compare visual differences
 */
export function expectVisualMatch(baseline: string, current: string, threshold = 0.1) {
  // This would integrate with a visual regression tool like Percy or Chromatic
  // For now, we just take screenshots for manual comparison
  cy.task("compareImages", {
    baseline,
    current,
    threshold,
  });
}

/**
 * Setup visual regression
 */
export function setupVisualRegression() {
  // Disable animations for consistent screenshots
  cy.window().then((win) => {
    const style = win.document.createElement("style");
    style.innerHTML = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `;
    win.document.head.appendChild(style);
  });
  
  // Wait for page to stabilize
  cy.wait(500);
}

// Example usage:
// describe("Visual Regression", () => {
//   beforeEach(() => {
//     setupVisualRegression();
//   });
//   
//   it("matches homepage snapshot", () => {
//     cy.visit("/");
//     visualTest("homepage");
//   });
//   
//   it("tests responsive layouts", () => {
//     cy.visit("/");
//     testResponsive("homepage", ["iphone-x", "ipad-2", "macbook-15"]);
//   });
// });
