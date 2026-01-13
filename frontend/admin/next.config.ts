import type { NextConfig } from "next";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

// Environment configuration
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const isAnalyze = process.env.ANALYZE === "true";

// API endpoints per environment
const API_URLS = {
  development: "http://localhost:8000",
  staging: process.env.NEXT_PUBLIC_API_URL_STAGING || "https://api-staging.spotex.com",
  production: process.env.NEXT_PUBLIC_API_URL || "https://api.spotex.com",
};

const getApiUrl = () => {
  if (isDevelopment) return API_URLS.development;
  if (process.env.NEXT_PUBLIC_ENV === "staging") return API_URLS.staging;
  return API_URLS.production;
};

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: isProduction ? {
      exclude: ["error", "warn"],
    } : false,
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: getApiUrl(),
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || "production",
  },
  
  // Image optimization
  images: {
    domains: [
      "localhost",
      "api.spotex.com",
      "api-staging.spotex.com",
      "cdn.spotex.com",
      "storage.googleapis.com",
      "s3.amazonaws.com",
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Security headers
  async headers() {
    return [
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
            value: "SAMEORIGIN",
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
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              `connect-src 'self' ${getApiUrl()} wss: ws:`,
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/auth/login",
        permanent: false,
      },
    ];
  },
  
  // Rewrites
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${getApiUrl()}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${getApiUrl()}/uploads/:path*`,
      },
    ];
  },
  
  // Turbopack configuration (Next.js 16+)
  turbopack: {},
  
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer
    if (isAnalyze && !isServer) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          reportFilename: "../bundle-analysis.html",
          openAnalyzer: true,
          generateStatsFile: true,
          statsFilename: "../bundle-stats.json",
        })
      );
    }
    
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    
    return config;
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "@headlessui/react",
      "lucide-react",
    ],
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
