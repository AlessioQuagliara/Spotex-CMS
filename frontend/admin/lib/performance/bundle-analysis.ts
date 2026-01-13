/**
 * Bundle Analysis Configuration for Next.js
 * Analyzes bundle size and provides optimization recommendations
 */

import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import type { Configuration } from "webpack";

/**
 * Bundle analysis options
 */
export interface BundleAnalysisOptions {
  enabled?: boolean;
  openAnalyzer?: boolean;
  analyzerMode?: "server" | "static" | "json" | "disabled";
  reportFilename?: string;
  defaultSizes?: "stat" | "parsed" | "gzip";
}

/**
 * Add bundle analyzer to webpack config
 */
export function withBundleAnalyzer(
  webpackConfig: Configuration,
  options: BundleAnalysisOptions = {}
): Configuration {
  const {
    enabled = process.env.ANALYZE === "true",
    openAnalyzer = true,
    analyzerMode = "server",
    reportFilename = "bundle-report.html",
    defaultSizes = "gzip",
  } = options;

  if (!enabled) {
    return webpackConfig;
  }

  const plugins = webpackConfig.plugins || [];

  plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode,
      openAnalyzer,
      reportFilename,
      defaultSizes,
      generateStatsFile: true,
      statsFilename: "bundle-stats.json",
      statsOptions: {
        source: false,
        reasons: true,
        chunks: true,
        modules: true,
        children: false,
      },
    })
  );

  return {
    ...webpackConfig,
    plugins,
  };
}

/**
 * Analyze bundle and provide recommendations
 */
export interface BundleStats {
  totalSize: number;
  assets: Array<{
    name: string;
    size: number;
    gzipSize: number;
  }>;
  chunks: Array<{
    name: string;
    size: number;
    modules: number;
  }>;
  recommendations: string[];
}

export function analyzeBundleStats(statsFile: string): BundleStats {
  const stats = require(statsFile);
  const recommendations: string[] = [];

  // Calculate total size
  const totalSize = stats.assets.reduce((sum: number, asset: any) => sum + asset.size, 0);

  // Find large assets
  const largeAssets = stats.assets.filter((asset: any) => asset.size > 500 * 1024); // > 500KB

  if (largeAssets.length > 0) {
    recommendations.push(
      `Found ${largeAssets.length} large assets (>500KB). Consider code splitting or lazy loading.`
    );
  }

  // Find duplicate modules
  const moduleNames = stats.modules.map((m: any) => m.name);
  const duplicates = moduleNames.filter(
    (name: string, index: number) => moduleNames.indexOf(name) !== index
  );

  if (duplicates.length > 0) {
    recommendations.push(
      `Found ${duplicates.length} duplicate modules. Check for multiple package versions.`
    );
  }

  // Check for unused dependencies
  const unusedDeps = findUnusedDependencies(stats);
  if (unusedDeps.length > 0) {
    recommendations.push(
      `Found ${unusedDeps.length} potentially unused dependencies: ${unusedDeps.join(", ")}`
    );
  }

  return {
    totalSize,
    assets: stats.assets.map((asset: any) => ({
      name: asset.name,
      size: asset.size,
      gzipSize: asset.gzipSize || asset.size * 0.3, // Estimate gzip size
    })),
    chunks: stats.chunks.map((chunk: any) => ({
      name: chunk.name,
      size: chunk.size,
      modules: chunk.modules.length,
    })),
    recommendations,
  };
}

/**
 * Find unused dependencies
 */
function findUnusedDependencies(stats: any): string[] {
  // This is a simplified implementation
  // In production, use tools like depcheck
  const usedModules = new Set(
    stats.modules.map((m: any) => {
      const match = m.name.match(/node_modules\/([^/]+)/);
      return match ? match[1] : null;
    }).filter(Boolean)
  );

  const packageJson = require("../../../package.json");
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  return Object.keys(allDeps).filter((dep) => !usedModules.has(dep));
}

/**
 * Get optimization suggestions
 */
export interface OptimizationSuggestion {
  type: "critical" | "warning" | "info";
  message: string;
  action: string;
}

export function getOptimizationSuggestions(stats: BundleStats): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Check total bundle size
  const totalMB = stats.totalSize / (1024 * 1024);
  if (totalMB > 5) {
    suggestions.push({
      type: "critical",
      message: `Total bundle size is ${totalMB.toFixed(2)}MB (recommended: <2MB)`,
      action: "Enable code splitting and lazy loading for routes",
    });
  } else if (totalMB > 2) {
    suggestions.push({
      type: "warning",
      message: `Total bundle size is ${totalMB.toFixed(2)}MB (target: <1MB)`,
      action: "Review and optimize large dependencies",
    });
  }

  // Check individual asset sizes
  const largeAssets = stats.assets.filter((asset) => asset.gzipSize > 300 * 1024);
  if (largeAssets.length > 0) {
    suggestions.push({
      type: "warning",
      message: `${largeAssets.length} assets are >300KB after gzip`,
      action: "Split large assets into smaller chunks",
    });
  }

  // Check chunk count
  if (stats.chunks.length < 3) {
    suggestions.push({
      type: "info",
      message: "Limited code splitting detected",
      action: "Consider splitting code by routes or features",
    });
  }

  // Add recommendations from analysis
  stats.recommendations.forEach((rec) => {
    suggestions.push({
      type: "info",
      message: rec,
      action: "Review bundle analyzer report for details",
    });
  });

  return suggestions;
}

/**
 * Generate bundle report
 */
export function generateBundleReport(stats: BundleStats, suggestions: OptimizationSuggestion[]): string {
  const totalMB = (stats.totalSize / (1024 * 1024)).toFixed(2);

  let report = `
# Bundle Analysis Report

## Summary
- **Total Bundle Size**: ${totalMB}MB
- **Assets**: ${stats.assets.length}
- **Chunks**: ${stats.chunks.length}

## Largest Assets
${stats.assets
  .sort((a, b) => b.gzipSize - a.gzipSize)
  .slice(0, 10)
  .map(
    (asset) =>
      `- ${asset.name}: ${(asset.gzipSize / 1024).toFixed(2)}KB (gzipped)`
  )
  .join("\n")}

## Optimization Suggestions

${suggestions
  .map((s) => `### ${s.type.toUpperCase()}: ${s.message}\n**Action**: ${s.action}`)
  .join("\n\n")}

## Chunks Breakdown
${stats.chunks
  .sort((a, b) => b.size - a.size)
  .map(
    (chunk) =>
      `- ${chunk.name}: ${(chunk.size / 1024).toFixed(2)}KB (${chunk.modules} modules)`
  )
  .join("\n")}
`;

  return report;
}
