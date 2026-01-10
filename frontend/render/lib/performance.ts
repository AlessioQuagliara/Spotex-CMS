// Performance monitoring utilities

export interface PerformanceMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

export function measureWebVitals(metric: any) {
  const { name, value, id } = metric;
  
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Web Vital] ${name}:`, value, id);
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === "production") {
    // Example: Send to Google Analytics
    // gtag('event', name, { value, metric_id: id });
    
    // Or send to custom endpoint
    navigator.sendBeacon?.(
      "/api/analytics",
      JSON.stringify({ metric: name, value, id })
    );
  }
}

// Preload critical resources
export function preloadResource(href: string, as: string) {
  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

// Prefetch next page
export function prefetchPage(href: string) {
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  document.head.appendChild(link);
}

// Dynamic import with retry
export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    if (retries > 0) {
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return dynamicImportWithRetry(importFn, retries - 1);
    }
    throw error;
  }
}

// Check if user has slow connection
export function isSlowConnection(): boolean {
  if ("connection" in navigator) {
    const connection = (navigator as any).connection;
    return (
      connection?.effectiveType === "slow-2g" ||
      connection?.effectiveType === "2g" ||
      connection?.saveData === true
    );
  }
  return false;
}

// Defer non-critical scripts
export function deferScript(src: string, onLoad?: () => void) {
  const script = document.createElement("script");
  script.src = src;
  script.defer = true;
  if (onLoad) script.onload = onLoad;
  document.body.appendChild(script);
}

// Request idle callback wrapper
export function runWhenIdle(callback: () => void, timeout: number = 2000) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, timeout);
  }
}

// Image loading priority
export function getImagePriority(index: number, totalImages: number): boolean {
  // Prioritize first 2-3 images
  return index < Math.min(3, Math.ceil(totalImages * 0.2));
}

// Detect if element is in viewport
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
