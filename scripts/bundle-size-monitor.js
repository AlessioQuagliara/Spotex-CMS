#!/usr/bin/env node

/**
 * Bundle Size Monitor
 * Tracks bundle size changes and alerts on regressions
 */

const fs = require("fs");
const path = require("path");

// Configuration
const BUILD_DIR = process.argv[2] || "frontend/admin";
const NEXT_DIR = path.join(BUILD_DIR, ".next");
const HISTORY_FILE = path.join(BUILD_DIR, ".bundle-size-history.json");
const MAX_INCREASE_PERCENT = 10; // Alert if bundle grows by more than 10%

console.log("📊 Bundle Size Monitor\n");

// Calculate directory size
function getDirectorySize(dir) {
  let size = 0;
  
  if (!fs.existsSync(dir)) {
    return 0;
  }
  
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
}

// Get current bundle size
function getCurrentSize() {
  const staticPath = path.join(NEXT_DIR, "static");
  const chunksPath = path.join(staticPath, "chunks");
  
  const sizes = {
    total: getDirectorySize(staticPath),
    chunks: getDirectorySize(chunksPath),
    timestamp: new Date().toISOString(),
  };
  
  // Get individual chunk sizes
  if (fs.existsSync(chunksPath)) {
    sizes.largestChunks = [];
    
    const files = fs.readdirSync(chunksPath);
    files.forEach((file) => {
      if (file.endsWith(".js")) {
        const filePath = path.join(chunksPath, file);
        const stats = fs.statSync(filePath);
        sizes.largestChunks.push({
          name: file,
          size: stats.size,
        });
      }
    });
    
    // Sort by size
    sizes.largestChunks.sort((a, b) => b.size - a.size);
    sizes.largestChunks = sizes.largestChunks.slice(0, 5);
  }
  
  return sizes;
}

// Load history
function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  }
  return { entries: [] };
}

// Save history
function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Main
try {
  const currentSize = getCurrentSize();
  const history = loadHistory();
  
  console.log("Current Bundle Size:");
  console.log(`  Total: ${formatBytes(currentSize.total)}`);
  console.log(`  Chunks: ${formatBytes(currentSize.chunks)}`);
  
  if (currentSize.largestChunks && currentSize.largestChunks.length > 0) {
    console.log("\nLargest Chunks:");
    currentSize.largestChunks.forEach((chunk, i) => {
      console.log(`  ${i + 1}. ${chunk.name}: ${formatBytes(chunk.size)}`);
    });
  }
  
  // Compare with previous build
  if (history.entries.length > 0) {
    const previousSize = history.entries[history.entries.length - 1];
    const diff = currentSize.total - previousSize.total;
    const diffPercent = ((diff / previousSize.total) * 100).toFixed(2);
    
    console.log("\nComparison with Previous Build:");
    console.log(`  Previous: ${formatBytes(previousSize.total)}`);
    console.log(`  Change: ${diff >= 0 ? "+" : ""}${formatBytes(diff)} (${diffPercent}%)`);
    
    // Check for regression
    if (diff > 0 && Math.abs(parseFloat(diffPercent)) > MAX_INCREASE_PERCENT) {
      console.log(`\n⚠️  WARNING: Bundle size increased by more than ${MAX_INCREASE_PERCENT}%`);
      console.log("   Please review changes and optimize if necessary.");
      process.exit(1);
    } else if (diff > 0) {
      console.log("\n⚠️  Bundle size increased but within acceptable range.");
    } else {
      console.log("\n✅ Bundle size decreased or stayed the same.");
    }
  }
  
  // Add to history
  history.entries.push(currentSize);
  
  // Keep only last 10 entries
  if (history.entries.length > 10) {
    history.entries = history.entries.slice(-10);
  }
  
  saveHistory(history);
  
  console.log("\n✅ Bundle size recorded.\n");
} catch (error) {
  console.error("❌ Error monitoring bundle size:", error.message);
  process.exit(1);
}
