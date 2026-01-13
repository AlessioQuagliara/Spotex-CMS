/**
 * Test Utilities
 * Common testing helpers and utilities
 */

import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Custom render with providers
 */
interface AllTheProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Wait for loading to complete
 */
export function waitForLoadingToFinish() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Mock user data
 */
export const mockUser = {
  id: 1,
  email: "admin@example.com",
  name: "Admin User",
  role: "admin",
};

/**
 * Mock product data
 */
export const mockProduct = {
  id: 1,
  name: "Test Product",
  slug: "test-product",
  description: "Test description",
  price: 99.99,
  stock: 10,
  category_id: 1,
  images: [],
  created_at: "2024-01-01T00:00:00Z",
};

/**
 * Mock order data
 */
export const mockOrder = {
  id: 1,
  order_number: "ORD-001",
  customer_name: "John Doe",
  customer_email: "john@example.com",
  total: 199.98,
  status: "pending",
  items: [
    {
      id: 1,
      product_id: 1,
      product_name: "Test Product",
      quantity: 2,
      price: 99.99,
    },
  ],
  created_at: "2024-01-01T00:00:00Z",
};

/**
 * Mock category data
 */
export const mockCategory = {
  id: 1,
  name: "Test Category",
  slug: "test-category",
  description: "Test description",
};

/**
 * Create mock file
 */
export function createMockFile(
  name = "test.jpg",
  size = 1024,
  type = "image/jpeg"
): File {
  const blob = new Blob(["test"], { type });
  return new File([blob], name, { type });
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
}

/**
 * Mock fetch response
 */
export function mockFetchResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response);
}

/**
 * Wait for specific condition
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 1000
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error("Timeout waiting for condition");
    }
    
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Simulate user typing
 */
export function simulateTyping(element: HTMLElement, text: string) {
  element.focus();
  
  for (const char of text) {
    const event = new KeyboardEvent("keydown", {
      key: char,
      code: `Key${char.toUpperCase()}`,
      charCode: char.charCodeAt(0),
      keyCode: char.charCodeAt(0),
      bubbles: true,
    });
    
    element.dispatchEvent(event);
  }
  
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.value = text;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

/**
 * Accessibility helpers
 */
export function expectToBeAccessible(container: HTMLElement) {
  // Check for alt text on images
  const images = container.querySelectorAll("img");
  images.forEach((img) => {
    expect(img).toHaveAttribute("alt");
  });
  
  // Check for labels on inputs
  const inputs = container.querySelectorAll("input, textarea, select");
  inputs.forEach((input) => {
    const id = input.id;
    if (id) {
      const label = container.querySelector(`label[for="${id}"]`);
      expect(label).toBeInTheDocument();
    }
  });
  
  // Check for aria-labels on buttons without text
  const buttons = container.querySelectorAll("button");
  buttons.forEach((button) => {
    if (!button.textContent?.trim()) {
      expect(
        button.hasAttribute("aria-label") || button.hasAttribute("aria-labelledby")
      ).toBe(true);
    }
  });
}

// Re-export everything from testing library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
