#!/usr/bin/env node

/**
 * Lighthouse CI Script
 * Run Lighthouse audits on multiple pages
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const BASE_URL = process.env.LIGHTHOUSE_URL || "http://localhost:3000";
const OUTPUT_DIR = process.env.LIGHTHOUSE_OUTPUT || "./lighthouse-reports";

// Pages to audit
const PAGES = [
  { url: "/", name: "home" },
  { url: "/dashboard", name: "dashboard" },
  { url: "/products", name: "products" },
  { url: "/orders", name: "orders" },
];

// Lighthouse configuration
const LIGHTHOUSE_CONFIG = {
  extends: "lighthouse:default",
  settings: {
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
    },
  },
};

console.log("🔦 Running Lighthouse CI\n");
console.log(`Base URL: ${BASE_URL}`);
console.log(`Pages to audit: ${PAGES.length}\n`);

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Save config
const configPath = path.join(OUTPUT_DIR, "lighthouse-config.json");
fs.writeFileSync(configPath, JSON.stringify(LIGHTHOUSE_CONFIG, null, 2));

// Run audits
const results = [];

PAGES.forEach((page, index) => {
  console.log(`[${index + 1}/${PAGES.length}] Auditing ${page.name}...`);
  
  const url = `${BASE_URL}${page.url}`;
  const outputPath = path.join(OUTPUT_DIR, `${page.name}.json`);
  const htmlPath = path.join(OUTPUT_DIR, `${page.name}.html`);
  
  try {
    // Run Lighthouse
    const command = `npx lighthouse ${url} \\
      --config-path=${configPath} \\
      --output=json \\
      --output=html \\
      --output-path=${outputPath.replace(".json", "")} \\
      --chrome-flags="--headless --no-sandbox" \\
      --quiet`;
    
    execSync(command, { stdio: "inherit" });
    
    // Parse results
    const result = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    
    results.push({
      name: page.name,
      url: page.url,
      scores: {
        performance: Math.round(result.categories.performance.score * 100),
        accessibility: Math.round(result.categories.accessibility.score * 100),
        bestPractices: Math.round(result.categories["best-practices"].score * 100),
        seo: Math.round(result.categories.seo.score * 100),
      },
      metrics: {
        fcp: result.audits["first-contentful-paint"].numericValue,
        lcp: result.audits["largest-contentful-paint"].numericValue,
        cls: result.audits["cumulative-layout-shift"].numericValue,
        tti: result.audits.interactive.numericValue,
        tbt: result.audits["total-blocking-time"].numericValue,
      },
    });
    
    console.log(`  ✅ Performance: ${results[index].scores.performance}`);
    console.log(`  ✅ Accessibility: ${results[index].scores.accessibility}`);
    console.log(`  ✅ Best Practices: ${results[index].scores.bestPractices}`);
    console.log(`  ✅ SEO: ${results[index].scores.seo}\n`);
  } catch (error) {
    console.error(`  ❌ Error auditing ${page.name}:`, error.message);
  }
});

// Generate summary
console.log("\n" + "=".repeat(60));
console.log("📊 Lighthouse CI Summary");
console.log("=".repeat(60) + "\n");

// Calculate averages
const averages = {
  performance: 0,
  accessibility: 0,
  bestPractices: 0,
  seo: 0,
};

results.forEach((result) => {
  averages.performance += result.scores.performance;
  averages.accessibility += result.scores.accessibility;
  averages.bestPractices += result.scores.bestPractices;
  averages.seo += result.scores.seo;
});

Object.keys(averages).forEach((key) => {
  averages[key] = Math.round(averages[key] / results.length);
});

console.log("Average Scores:");
console.log(`  Performance: ${averages.performance}`);
console.log(`  Accessibility: ${averages.accessibility}`);
console.log(`  Best Practices: ${averages.bestPractices}`);
console.log(`  SEO: ${averages.seo}\n`);

// Check thresholds
const THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  bestPractices: 90,
  seo: 95,
};

const failures = [];

Object.keys(THRESHOLDS).forEach((key) => {
  if (averages[key] < THRESHOLDS[key]) {
    failures.push({
      category: key,
      score: averages[key],
      threshold: THRESHOLDS[key],
    });
  }
});

if (failures.length > 0) {
  console.log("❌ Some scores are below threshold:\n");
  failures.forEach((failure) => {
    console.log(
      `  ${failure.category}: ${failure.score} (threshold: ${failure.threshold})`
    );
  });
  console.log("\nPlease review and optimize before deploying.\n");
  process.exit(1);
} else {
  console.log("✅ All scores meet or exceed thresholds!\n");
}

// Save summary
const summaryPath = path.join(OUTPUT_DIR, "summary.json");
fs.writeFileSync(
  summaryPath,
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      results,
      averages,
      thresholds: THRESHOLDS,
    },
    null,
    2
  )
);

console.log(`📝 Summary saved to: ${summaryPath}`);
console.log(`📊 HTML reports available in: ${OUTPUT_DIR}\n`);
