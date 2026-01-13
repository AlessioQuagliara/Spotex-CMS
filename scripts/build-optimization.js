#!/usr/bin/env node

/**
 * Build Optimization Script
 * Analyzes and optimizes build output
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 Starting build optimization...\n");

// Configuration
const BUILD_DIR = process.argv[2] || "frontend/admin";
const NEXT_DIR = path.join(BUILD_DIR, ".next");

// Check if .next directory exists
if (!fs.existsSync(NEXT_DIR)) {
  console.error("❌ .next directory not found. Run 'npm run build' first.");
  process.exit(1);
}

// 1. Analyze bundle size
console.log("📊 Analyzing bundle size...");
try {
  const buildManifest = JSON.parse(
    fs.readFileSync(path.join(NEXT_DIR, "build-manifest.json"), "utf8")
  );
  
  console.log("\n📦 Bundle Analysis:");
  console.log("   Pages:", Object.keys(buildManifest.pages).length);
  
  // Calculate total size
  let totalSize = 0;
  const statsPath = path.join(NEXT_DIR, "static");
  
  if (fs.existsSync(statsPath)) {
    const getDirectorySize = (dir) => {
      let size = 0;
      const files = fs.readdirSync(dir);
      
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          size += getDirectorySize(filePath);
        } else {
          size += stats.size;
        }
      });
      
      return size;
    };
    
    totalSize = getDirectorySize(statsPath);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    
    console.log(`   Total Size: ${totalSizeMB}MB`);
    
    if (totalSize > 5 * 1024 * 1024) {
      console.log("   ⚠️  Bundle size exceeds 5MB");
    } else {
      console.log("   ✅ Bundle size is optimal");
    }
  }
} catch (error) {
  console.error("   ❌ Error analyzing bundle:", error.message);
}

// 2. Check for large dependencies
console.log("\n📚 Checking dependencies...");
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(BUILD_DIR, "package.json"), "utf8")
  );
  
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const largeDeps = [];
  
  Object.keys(deps).forEach((dep) => {
    try {
      const depPath = path.join(BUILD_DIR, "node_modules", dep);
      if (fs.existsSync(depPath)) {
        const stats = fs.statSync(depPath);
        if (stats.isDirectory()) {
          const size = execSync(`du -sk "${depPath}"`, { encoding: "utf8" });
          const sizeKB = parseInt(size.split("\t")[0]);
          
          if (sizeKB > 1000) {
            largeDeps.push({ name: dep, size: sizeKB });
          }
        }
      }
    } catch (error) {
      // Ignore errors for individual dependencies
    }
  });
  
  if (largeDeps.length > 0) {
    console.log("   Large dependencies (>1MB):");
    largeDeps
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach((dep) => {
        const sizeMB = (dep.size / 1024).toFixed(2);
        console.log(`   - ${dep.name}: ${sizeMB}MB`);
      });
  } else {
    console.log("   ✅ No large dependencies found");
  }
} catch (error) {
  console.error("   ❌ Error checking dependencies:", error.message);
}

// 3. Check for source maps in production
console.log("\n🗺️  Checking source maps...");
try {
  const staticPath = path.join(NEXT_DIR, "static");
  let sourceMapsFound = false;
  
  if (fs.existsSync(staticPath)) {
    const checkForSourceMaps = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          checkForSourceMaps(filePath);
        } else if (file.endsWith(".map")) {
          sourceMapsFound = true;
        }
      });
    };
    
    checkForSourceMaps(staticPath);
  }
  
  if (sourceMapsFound) {
    console.log("   ⚠️  Source maps found in production build");
    console.log("   Consider disabling productionBrowserSourceMaps");
  } else {
    console.log("   ✅ No source maps in production build");
  }
} catch (error) {
  console.error("   ❌ Error checking source maps:", error.message);
}

// 4. Generate optimization report
console.log("\n📝 Generating optimization report...");

const report = {
  timestamp: new Date().toISOString(),
  buildDir: BUILD_DIR,
  totalSize: totalSize,
  recommendations: [],
};

// Add recommendations
if (totalSize > 5 * 1024 * 1024) {
  report.recommendations.push({
    type: "bundle-size",
    severity: "warning",
    message: "Bundle size exceeds 5MB. Consider code splitting.",
  });
}

// Save report
const reportPath = path.join(BUILD_DIR, "build-optimization-report.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`   ✅ Report saved to: ${reportPath}`);

// 5. Summary
console.log("\n" + "=".repeat(50));
console.log("✅ Build optimization complete!");
console.log("=".repeat(50) + "\n");

console.log("Recommendations:");
if (report.recommendations.length === 0) {
  console.log("   ✅ Build is optimized!");
} else {
  report.recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. [${rec.severity.toUpperCase()}] ${rec.message}`);
  });
}

console.log("\nNext steps:");
console.log("   1. Run 'npm run analyze' to see detailed bundle analysis");
console.log("   2. Check Lighthouse scores with 'npm run lighthouse'");
console.log("   3. Deploy to staging for testing\n");
