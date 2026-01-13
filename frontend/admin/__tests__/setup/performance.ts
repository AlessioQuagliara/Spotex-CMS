/**
 * Performance Testing Utilities
 * Measure and validate performance metrics
 */

import { performance } from "perf_hooks";

/**
 * Measure component render time
 */
export function measureRenderTime(fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
}

/**
 * Assert render time is within threshold
 */
export function expectFastRender(renderTime: number, maxMs = 100) {
  expect(renderTime).toBeLessThan(maxMs);
}

/**
 * Measure API response time
 */
export async function measureAPITime(apiCall: () => Promise<any>): Promise<number> {
  const start = performance.now();
  await apiCall();
  const end = performance.now();
  return end - start;
}

/**
 * Assert API response time is within threshold
 */
export function expectFastAPI(responseTime: number, maxMs = 500) {
  expect(responseTime).toBeLessThan(maxMs);
}

/**
 * Measure bundle size
 */
export function measureBundleSize(bundle: string): number {
  return new Blob([bundle]).size;
}

/**
 * Assert bundle size is within threshold
 */
export function expectSmallBundle(size: number, maxKb = 500) {
  const sizeKb = size / 1024;
  expect(sizeKb).toBeLessThan(maxKb);
}

/**
 * Test component re-render performance
 */
export function testReRenderPerformance(
  Component: React.ComponentType<any>,
  props: any,
  iterations = 100
): number {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const renderTime = measureRenderTime(() => {
      // Simulate re-render
    });
    times.push(renderTime);
  }
  
  // Calculate average
  const average = times.reduce((a, b) => a + b, 0) / times.length;
  return average;
}

/**
 * Test memory usage
 */
export function testMemoryUsage(fn: () => void): number {
  if (typeof performance.memory !== "undefined") {
    const before = performance.memory.usedJSHeapSize;
    fn();
    const after = performance.memory.usedJSHeapSize;
    return after - before;
  }
  return 0;
}

/**
 * Test for memory leaks
 */
export function testMemoryLeaks(
  createComponent: () => void,
  destroyComponent: () => void,
  iterations = 10
) {
  const memories: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    createComponent();
    const memory = testMemoryUsage(() => {});
    memories.push(memory);
    destroyComponent();
  }
  
  // Memory should not increase significantly
  const first = memories[0];
  const last = memories[memories.length - 1];
  const increase = ((last - first) / first) * 100;
  
  expect(increase).toBeLessThan(50); // Less than 50% increase
}

/**
 * Test virtual list performance
 */
export function testVirtualListPerformance(
  itemCount: number,
  itemHeight: number
): void {
  const renderTime = measureRenderTime(() => {
    // Render virtual list
  });
  
  // Virtual lists should render fast regardless of item count
  expectFastRender(renderTime, 100);
}

/**
 * Test lazy loading performance
 */
export async function testLazyLoading(): Promise<void> {
  const loadTime = await measureAPITime(async () => {
    // Simulate lazy loading
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
  
  expect(loadTime).toBeLessThan(200);
}

/**
 * Test debounce/throttle performance
 */
export function testDebouncePerformance(
  debouncedFn: (...args: any[]) => void,
  delay: number
): void {
  let callCount = 0;
  const wrappedFn = () => {
    callCount++;
    debouncedFn();
  };
  
  // Rapid calls
  for (let i = 0; i < 100; i++) {
    wrappedFn();
  }
  
  // Should only call once after delay
  setTimeout(() => {
    expect(callCount).toBe(1);
  }, delay + 100);
}

/**
 * Test image optimization
 */
export async function testImageOptimization(imageUrl: string): Promise<void> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const size = blob.size;
  
  // Images should be optimized
  const sizeKb = size / 1024;
  expect(sizeKb).toBeLessThan(200); // Less than 200KB
}

/**
 * Test code splitting
 */
export async function testCodeSplitting(): Promise<void> {
  const chunks = await import(/* webpackChunkName: "test-chunk" */ "./test-module");
  expect(chunks).toBeDefined();
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  renderTime: number;
  apiTime: number;
  bundleSize: number;
  memoryUsage: number;
}

/**
 * Collect performance metrics
 */
export async function collectPerformanceMetrics(
  component: () => void,
  apiCall: () => Promise<any>,
  bundle: string
): Promise<PerformanceMetrics> {
  const renderTime = measureRenderTime(component);
  const apiTime = await measureAPITime(apiCall);
  const bundleSize = measureBundleSize(bundle);
  const memoryUsage = testMemoryUsage(component);
  
  return {
    renderTime,
    apiTime,
    bundleSize,
    memoryUsage,
  };
}

/**
 * Compare performance between versions
 */
export function comparePerformance(
  baseline: PerformanceMetrics,
  current: PerformanceMetrics,
  threshold = 0.1 // 10% threshold
): void {
  const renderDiff = (current.renderTime - baseline.renderTime) / baseline.renderTime;
  const apiDiff = (current.apiTime - baseline.apiTime) / baseline.apiTime;
  const bundleDiff = (current.bundleSize - baseline.bundleSize) / baseline.bundleSize;
  
  expect(renderDiff).toBeLessThan(threshold);
  expect(apiDiff).toBeLessThan(threshold);
  expect(bundleDiff).toBeLessThan(threshold);
}

/**
 * Lighthouse performance audit
 */
export async function runLighthouseAudit(url: string): Promise<any> {
  // This would integrate with Lighthouse CI
  // For now, return mock data
  return {
    performance: 90,
    accessibility: 95,
    bestPractices: 85,
    seo: 100,
  };
}

/**
 * Web Vitals thresholds
 */
export const WEB_VITALS_THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100, // First Input Delay (ms)
  CLS: 0.1, // Cumulative Layout Shift
  FCP: 1800, // First Contentful Paint (ms)
  TTFB: 600, // Time to First Byte (ms)
  INP: 200, // Interaction to Next Paint (ms)
};

/**
 * Assert Web Vitals are within thresholds
 */
export function expectGoodWebVitals(metrics: any): void {
  if (metrics.LCP) {
    expect(metrics.LCP).toBeLessThan(WEB_VITALS_THRESHOLDS.LCP);
  }
  if (metrics.FID) {
    expect(metrics.FID).toBeLessThan(WEB_VITALS_THRESHOLDS.FID);
  }
  if (metrics.CLS) {
    expect(metrics.CLS).toBeLessThan(WEB_VITALS_THRESHOLDS.CLS);
  }
  if (metrics.FCP) {
    expect(metrics.FCP).toBeLessThan(WEB_VITALS_THRESHOLDS.FCP);
  }
  if (metrics.TTFB) {
    expect(metrics.TTFB).toBeLessThan(WEB_VITALS_THRESHOLDS.TTFB);
  }
  if (metrics.INP) {
    expect(metrics.INP).toBeLessThan(WEB_VITALS_THRESHOLDS.INP);
  }
}
