/**
 * Code Splitting Configuration and Utilities
 * Dynamic imports and lazy loading for optimal performance
 */

import dynamic from "next/dynamic";
import { ComponentType, LazyExoticComponent, lazy } from "react";

/**
 * Dynamic import options
 */
export interface DynamicImportOptions {
  loading?: ComponentType;
  ssr?: boolean;
}

/**
 * Create dynamic component with custom loading state
 */
export function createDynamicComponent<P = {}>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  options: DynamicImportOptions = {}
) {
  const { loading: LoadingComponent, ssr = false } = options;

  return dynamic(loader, {
    loading: LoadingComponent ? () => <LoadingComponent /> : undefined,
    ssr,
  });
}

/**
 * Lazy load route component
 */
export function lazyLoadRoute<P = {}>(importFunc: () => Promise<{ default: ComponentType<P> }>) {
  return createDynamicComponent(importFunc, {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  });
}

/**
 * Lazy load modal/dialog component
 */
export function lazyLoadModal<P = {}>(importFunc: () => Promise<{ default: ComponentType<P> }>) {
  return createDynamicComponent(importFunc, {
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    ),
    ssr: false,
  });
}

/**
 * Lazy load chart/visualization component
 */
export function lazyLoadChart<P = {}>(importFunc: () => Promise<{ default: ComponentType<P> }>) {
  return createDynamicComponent(importFunc, {
    loading: () => (
      <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-gray-400">Loading chart...</span>
      </div>
    ),
    ssr: false,
  });
}

/**
 * Lazy load editor component (heavy)
 */
export function lazyLoadEditor<P = {}>(importFunc: () => Promise<{ default: ComponentType<P> }>) {
  return createDynamicComponent(importFunc, {
    loading: () => (
      <div className="w-full min-h-[400px] bg-white border rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading editor...</p>
        </div>
      </div>
    ),
    ssr: false,
  });
}

/**
 * Route-based code splitting configuration
 */
export const dynamicRoutes = {
  // Dashboard
  Dashboard: lazyLoadRoute(() => import("@/app/dashboard/page")),
  
  // Products
  ProductList: lazyLoadRoute(() => import("@/app/products/page")),
  ProductDetail: lazyLoadRoute(() => import("@/app/products/[id]/page")),
  ProductCreate: lazyLoadRoute(() => import("@/app/products/create/page")),
  
  // Orders
  OrderList: lazyLoadRoute(() => import("@/app/orders/page")),
  OrderDetail: lazyLoadRoute(() => import("@/app/orders/[id]/page")),
  
  // Customers
  CustomerList: lazyLoadRoute(() => import("@/app/customers/page")),
  CustomerDetail: lazyLoadRoute(() => import("@/app/customers/[id]/page")),
  
  // Analytics
  Analytics: lazyLoadRoute(() => import("@/app/analytics/page")),
  
  // Settings
  Settings: lazyLoadRoute(() => import("@/app/settings/page")),
};

/**
 * Component-based code splitting
 */
export const dynamicComponents = {
  // Charts
  LineChart: lazyLoadChart(() => import("@/components/charts/line-chart")),
  BarChart: lazyLoadChart(() => import("@/components/charts/bar-chart")),
  PieChart: lazyLoadChart(() => import("@/components/charts/pie-chart")),
  
  // Editors
  RichTextEditor: lazyLoadEditor(() => import("@/components/editors/rich-text-editor")),
  MarkdownEditor: lazyLoadEditor(() => import("@/components/editors/markdown-editor")),
  CodeEditor: lazyLoadEditor(() => import("@/components/editors/code-editor")),
  
  // Modals
  ProductModal: lazyLoadModal(() => import("@/components/modals/product-modal")),
  OrderModal: lazyLoadModal(() => import("@/components/modals/order-modal")),
  CustomerModal: lazyLoadModal(() => import("@/components/modals/customer-modal")),
  
  // Tables
  DataTable: createDynamicComponent(() => import("@/components/tables/data-table"), { ssr: true }),
  
  // Media
  ImageGallery: createDynamicComponent(() => import("@/components/media/image-gallery"), { ssr: false }),
  VideoPlayer: createDynamicComponent(() => import("@/components/media/video-player"), { ssr: false }),
};

/**
 * Vendor splitting configuration for webpack
 */
export const vendorSplitting = {
  splitChunks: {
    chunks: "all" as const,
    cacheGroups: {
      // React & Next.js core
      framework: {
        test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
        name: "framework",
        priority: 40,
        enforce: true,
      },
      
      // UI Libraries
      ui: {
        test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|framer-motion)[\\/]/,
        name: "ui",
        priority: 30,
      },
      
      // Charts & Visualization
      charts: {
        test: /[\\/]node_modules[\\/](recharts|d3|chart\.js)[\\/]/,
        name: "charts",
        priority: 25,
      },
      
      // Editors
      editors: {
        test: /[\\/]node_modules[\\/](slate|draft-js|quill|monaco-editor)[\\/]/,
        name: "editors",
        priority: 25,
      },
      
      // Date & Time
      date: {
        test: /[\\/]node_modules[\\/](date-fns|dayjs|moment)[\\/]/,
        name: "date",
        priority: 20,
      },
      
      // Forms & Validation
      forms: {
        test: /[\\/]node_modules[\\/](react-hook-form|yup|zod|formik)[\\/]/,
        name: "forms",
        priority: 20,
      },
      
      // Utilities
      utils: {
        test: /[\\/]node_modules[\\/](lodash|ramda|underscore)[\\/]/,
        name: "utils",
        priority: 15,
      },
      
      // Default vendor chunk
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: "vendor",
        priority: 10,
      },
      
      // Common components used across multiple routes
      common: {
        minChunks: 2,
        priority: 5,
        reuseExistingChunk: true,
      },
    },
  },
};

/**
 * Preload critical chunks
 */
export function preloadCriticalChunks() {
  if (typeof window === "undefined") return;

  const criticalChunks = [
    "/_next/static/chunks/framework",
    "/_next/static/chunks/ui",
    "/_next/static/chunks/vendor",
  ];

  criticalChunks.forEach((chunk) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "script";
    link.href = `${chunk}.js`;
    document.head.appendChild(link);
  });
}

/**
 * Monitor chunk loading performance
 */
export function monitorChunkLoading() {
  if (typeof window === "undefined") return;

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === "resource" && entry.name.includes("/_next/static/chunks/")) {
        const duration = entry.duration;
        const chunkName = entry.name.split("/").pop();
        
        console.log(`[Chunk Loading] ${chunkName}: ${duration.toFixed(2)}ms`);
        
        // Send to analytics
        if (duration > 1000) {
          console.warn(`[Chunk Loading] Slow chunk: ${chunkName} (${duration.toFixed(2)}ms)`);
        }
      }
    });
  });

  observer.observe({ entryTypes: ["resource"] });
}
