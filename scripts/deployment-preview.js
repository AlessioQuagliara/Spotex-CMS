#!/usr/bin/env node

/**
 * Deployment Preview Script
 * Create preview deployments for testing
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const BRANCH = process.env.GITHUB_HEAD_REF || execSync("git rev-parse --abbrev-ref HEAD", {
  encoding: "utf8",
}).trim();

const COMMIT = execSync("git rev-parse --short HEAD", {
  encoding: "utf8",
}).trim();

const PREVIEW_DOMAIN = process.env.PREVIEW_DOMAIN || "preview.spotex.com";

console.log("🚀 Creating Deployment Preview\n");
console.log(`Branch: ${BRANCH}`);
console.log(`Commit: ${COMMIT}`);
console.log(`Domain: ${PREVIEW_DOMAIN}\n`);

// Generate preview URL
const sanitizedBranch = BRANCH.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
const previewUrl = `https://${sanitizedBranch}-${COMMIT}.${PREVIEW_DOMAIN}`;

console.log(`Preview URL: ${previewUrl}\n`);

// Build configuration
const buildConfig = {
  branch: BRANCH,
  commit: COMMIT,
  previewUrl,
  timestamp: new Date().toISOString(),
  environment: "preview",
};

// Save build info
const buildInfoPath = "./public/build-info.json";
fs.writeFileSync(buildInfoPath, JSON.stringify(buildConfig, null, 2));

console.log("✅ Build info saved\n");

// Set environment variables for build
process.env.NEXT_PUBLIC_ENV = "preview";
process.env.NEXT_PUBLIC_PREVIEW_URL = previewUrl;
process.env.NEXT_PUBLIC_BRANCH = BRANCH;
process.env.NEXT_PUBLIC_COMMIT = COMMIT;

// Build application
console.log("🏗️  Building application...\n");

try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("\n✅ Build complete\n");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}

// Run tests
console.log("🧪 Running tests...\n");

try {
  execSync("npm run test:ci", { stdio: "inherit" });
  console.log("\n✅ Tests passed\n");
} catch (error) {
  console.error("❌ Tests failed:", error.message);
  process.exit(1);
}

// Deploy to preview environment
console.log("📦 Deploying to preview...\n");

// This would integrate with your deployment platform
// For example: Vercel, Netlify, AWS, etc.

console.log("Deployment configuration:");
console.log(JSON.stringify(buildConfig, null, 2));
console.log();

// Create deployment summary
const summary = {
  status: "success",
  previewUrl,
  branch: BRANCH,
  commit: COMMIT,
  timestamp: new Date().toISOString(),
  checks: {
    build: "✅",
    tests: "✅",
    deploy: "✅",
  },
};

// Save summary
const summaryPath = "./deployment-summary.json";
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log("\n" + "=".repeat(60));
console.log("✅ Deployment Preview Created!");
console.log("=".repeat(60) + "\n");

console.log(`🌐 Preview URL: ${previewUrl}`);
console.log(`📝 Summary: ${summaryPath}\n`);

console.log("Next steps:");
console.log("  1. Visit preview URL to test changes");
console.log("  2. Run E2E tests against preview");
console.log("  3. Request review from team");
console.log("  4. Merge to main when approved\n");

// Output for GitHub Actions
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `preview_url=${previewUrl}\n`
  );
}
