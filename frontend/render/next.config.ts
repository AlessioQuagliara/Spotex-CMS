import type { NextConfig } from "next";

// Environment configuration
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// Multi-tenant configuration
const getTenantConfig = () => {
  const tenantId = process.env.TENANT_ID || "default";
  const tenantDomain = process.env.TENANT_DOMAIN || "localhost";
  
  return {
    tenantId,
    tenantDomain,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    cdnUrl: process.env.CDN_URL || "",
  };
};

const tenantConfig = getTenantConfig();

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // Transpile shared packages
  transpilePackages: ['@/shared'],
  
  // Compiler optimizations
  compiler: {
    removeConsole: isProduction ? {
      exclude: ["error", "warn"],
    } : false,
  },
  
  // Environment variables (runtime config)
  env: {
    NEXT_PUBLIC_TENANT_ID: tenantConfig.tenantId,
    NEXT_PUBLIC_TENANT_DOMAIN: tenantConfig.tenantDomain,
    NEXT_PUBLIC_API_URL: tenantConfig.apiUrl,
    NEXT_PUBLIC_CDN_URL: tenantConfig.cdnUrl,
  },
  
  // Image optimization with CDN
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600, // 1 hour
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.spotex.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
    // CDN loader
    loader: tenantConfig.cdnUrl ? "custom" : "default",
    loaderFile: tenantConfig.cdnUrl ? "./lib/image-loader.ts" : undefined,
  },
  
  // CDN configuration
  assetPrefix: tenantConfig.cdnUrl || undefined,
  
  // ISR configuration for products and pages
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns'],
  },
  
  // Security and performance headers
  async headers() {
    return [
      // PWA support
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      // Security headers for all pages
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache images with stale-while-revalidate
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // Cache product pages with ISR
      {
        source: "/products/:slug*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      // Cache category pages
      {
        source: "/categories/:slug*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=1800, stale-while-revalidate=3600",
          },
        ],
      },
      // Don't cache cart and checkout
      {
        source: "/(cart|checkout)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: "/shop",
        destination: "/products",
        permanent: true,
      },
      {
        source: "/product/:slug",
        destination: "/products/:slug",
        permanent: true,
      },
    ];
  },
  
  // Rewrites for API and multi-tenant
  async rewrites() {
    return {
      beforeFiles: [
        // Tenant-specific rewrites
        {
          source: "/:path*",
          has: [
            {
              type: "host",
              value: `(?<tenant>.*).${process.env.BASE_DOMAIN || "spotex.com"}`,
            },
          ],
          destination: "/tenant/:tenant/:path*",
        },
      ],
      afterFiles: [
        // API rewrites
        {
          source: "/api/:path*",
          destination: `${tenantConfig.apiUrl}/api/:path*`,
        },
        // Media rewrites
        {
          source: "/uploads/:path*",
          destination: tenantConfig.cdnUrl 
            ? `${tenantConfig.cdnUrl}/uploads/:path*`
            : `${tenantConfig.apiUrl}/uploads/:path*`,
        },
      ],
      fallback: [
        // Sitemap rewrite
        {
          source: "/sitemap.xml",
          destination: "/api/sitemap",
        },
        // Robots.txt rewrite
        {
          source: "/robots.txt",
          destination: "/api/robots",
        },
      ],
    };
  },
  
  // Turbopack configuration (Next.js 16+)
  turbopack: {},
  
  // Webpack configuration (optional, for --webpack flag)
  webpack: (config, { dev, isServer }) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    
    return config;
  },
  
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,
  generateEtags: true,
};

export default nextConfig;
