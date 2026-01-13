/**
 * Accessibility Testing Utilities
 * Test components for WCAG compliance
 */

import { axe, toHaveNoViolations } from "jest-axe";

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

/**
 * Run accessibility audit on component
 */
export async function testAccessibility(container: HTMLElement, options?: any) {
  const results = await axe(container, options);
  expect(results).toHaveNoViolations();
}

/**
 * Test keyboard navigation
 */
export function testKeyboardNavigation(
  container: HTMLElement,
  expectedFocusableElements: number
) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  expect(focusableElements.length).toBe(expectedFocusableElements);
  
  // Test tab order
  focusableElements.forEach((element, index) => {
    const tabIndex = element.getAttribute("tabindex");
    if (tabIndex && parseInt(tabIndex) > 0) {
      console.warn(`Element ${index} has explicit tabindex: ${tabIndex}`);
    }
  });
}

/**
 * Test ARIA attributes
 */
export function testARIA(container: HTMLElement) {
  // Check for aria-labels on interactive elements
  const interactiveElements = container.querySelectorAll(
    "button, a, input, select, textarea"
  );
  
  interactiveElements.forEach((element) => {
    const hasLabel =
      element.hasAttribute("aria-label") ||
      element.hasAttribute("aria-labelledby") ||
      element.textContent?.trim() ||
      (element instanceof HTMLInputElement && element.labels?.length);
    
    expect(hasLabel).toBe(true);
  });
  
  // Check for aria-describedby where appropriate
  const inputs = container.querySelectorAll("input, textarea, select");
  inputs.forEach((input) => {
    const hasError = input.getAttribute("aria-invalid") === "true";
    if (hasError) {
      expect(input.hasAttribute("aria-describedby")).toBe(true);
    }
  });
}

/**
 * Test color contrast
 */
export async function testColorContrast(container: HTMLElement) {
  const results = await axe(container, {
    rules: {
      "color-contrast": { enabled: true },
    },
  });
  
  expect(results.violations.filter((v) => v.id === "color-contrast")).toHaveLength(0);
}

/**
 * Test screen reader compatibility
 */
export function testScreenReader(container: HTMLElement) {
  // Check for semantic HTML
  const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
  expect(headings.length).toBeGreaterThan(0);
  
  // Check heading hierarchy
  let lastLevel = 0;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);
    expect(level).toBeLessThanOrEqual(lastLevel + 1);
    lastLevel = level;
  });
  
  // Check for skip links
  const skipLinks = container.querySelectorAll('a[href^="#"]');
  if (skipLinks.length > 0) {
    skipLinks.forEach((link) => {
      const target = link.getAttribute("href");
      if (target) {
        const targetElement = container.querySelector(target);
        expect(targetElement).toBeInTheDocument();
      }
    });
  }
}

/**
 * Test form accessibility
 */
export function testFormAccessibility(form: HTMLFormElement) {
  const inputs = form.querySelectorAll("input, textarea, select");
  
  inputs.forEach((input) => {
    // Check for labels
    const id = input.id;
    if (id) {
      const label = form.querySelector(`label[for="${id}"]`);
      expect(label).toBeInTheDocument();
    }
    
    // Check for error messages
    const isInvalid = input.getAttribute("aria-invalid") === "true";
    if (isInvalid) {
      const describedBy = input.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      
      const errorElement = form.querySelector(`#${describedBy}`);
      expect(errorElement).toBeInTheDocument();
    }
    
    // Check for required attribute
    if (input.hasAttribute("required")) {
      expect(
        input.hasAttribute("aria-required") ||
        input.hasAttribute("required")
      ).toBe(true);
    }
  });
}

/**
 * Test image accessibility
 */
export function testImageAccessibility(container: HTMLElement) {
  const images = container.querySelectorAll("img");
  
  images.forEach((img) => {
    const alt = img.getAttribute("alt");
    
    // All images must have alt attribute
    expect(img.hasAttribute("alt")).toBe(true);
    
    // Decorative images should have empty alt
    const isDecorative = img.getAttribute("role") === "presentation";
    if (isDecorative) {
      expect(alt).toBe("");
    } else {
      // Content images should have meaningful alt
      expect(alt).toBeTruthy();
    }
  });
}

/**
 * Test focus management
 */
export function testFocusManagement(container: HTMLElement) {
  // Check for focus trap in modals
  const modals = container.querySelectorAll('[role="dialog"]');
  
  modals.forEach((modal) => {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    // First element should receive focus
    const firstElement = focusableElements[0];
    expect(document.activeElement).toBe(firstElement);
  });
}

/**
 * Test landmark regions
 */
export function testLandmarks(container: HTMLElement) {
  // Check for main landmark
  const main = container.querySelector("main");
  expect(main).toBeInTheDocument();
  
  // Check for navigation
  const nav = container.querySelector("nav");
  expect(nav).toBeInTheDocument();
  
  // Check for complementary regions
  const asides = container.querySelectorAll("aside");
  asides.forEach((aside) => {
    expect(
      aside.hasAttribute("aria-label") ||
      aside.hasAttribute("aria-labelledby")
    ).toBe(true);
  });
}

/**
 * Test live regions
 */
export function testLiveRegions(container: HTMLElement) {
  const liveRegions = container.querySelectorAll('[aria-live]');
  
  liveRegions.forEach((region) => {
    const liveValue = region.getAttribute("aria-live");
    expect(["polite", "assertive", "off"]).toContain(liveValue);
  });
}

/**
 * Test button accessibility
 */
export function testButtonAccessibility(container: HTMLElement) {
  const buttons = container.querySelectorAll("button");
  
  buttons.forEach((button) => {
    // Buttons should have accessible name
    const hasName =
      button.textContent?.trim() ||
      button.hasAttribute("aria-label") ||
      button.hasAttribute("aria-labelledby");
    
    expect(hasName).toBe(true);
    
    // Icon-only buttons should have aria-label
    if (!button.textContent?.trim()) {
      expect(button.hasAttribute("aria-label")).toBe(true);
    }
  });
}

/**
 * Test link accessibility
 */
export function testLinkAccessibility(container: HTMLElement) {
  const links = container.querySelectorAll("a");
  
  links.forEach((link) => {
    // Links should have href
    expect(link.hasAttribute("href")).toBe(true);
    
    // Links should have accessible name
    const hasName =
      link.textContent?.trim() ||
      link.hasAttribute("aria-label") ||
      link.hasAttribute("aria-labelledby");
    
    expect(hasName).toBe(true);
    
    // External links should have indication
    const isExternal = link.getAttribute("target") === "_blank";
    if (isExternal) {
      expect(
        link.hasAttribute("aria-label") ||
        link.querySelector('[aria-label*="opens in new"]')
      ).toBeTruthy();
    }
  });
}

/**
 * Full accessibility test suite
 */
export async function runA11yTests(container: HTMLElement) {
  await testAccessibility(container);
  testARIA(container);
  await testColorContrast(container);
  testScreenReader(container);
  testImageAccessibility(container);
  testLandmarks(container);
  testLiveRegions(container);
  testButtonAccessibility(container);
  testLinkAccessibility(container);
}

// Cypress commands for accessibility testing
export function addCypressA11yCommands() {
  Cypress.Commands.add("checkA11y", (context?: any, options?: any) => {
    cy.injectAxe();
    cy.checkA11y(context, options);
  });
  
  Cypress.Commands.add("testKeyboardNav", () => {
    // Tab through all elements
    cy.get("body").tab();
    cy.focused().should("be.visible");
  });
}
