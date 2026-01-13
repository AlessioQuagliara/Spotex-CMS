#!/usr/bin/env node
/**
 * Lighthouse Performance Audits
 * Run Lighthouse tests on admin and render frontends
 */
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const URLS_TO_TEST = [
  {
    name: 'Admin Login',
    url: 'http://localhost:3001/login',
  },
  {
    name: 'Admin Dashboard',
    url: 'http://localhost:3001/dashboard',
  },
  {
    name: 'Admin Posts List',
    url: 'http://localhost:3001/posts',
  },
  {
    name: 'Storefront Home',
    url: 'http://localhost:3000',
  },
];

const LIGHTHOUSE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
    },
  },
};

const PERFORMANCE_THRESHOLDS = {
  performance: 90,
  accessibility: 90,
  'best-practices': 90,
  seo: 90,
  'first-contentful-paint': 1800,
  'largest-contentful-paint': 2500,
  'total-blocking-time': 200,
  'cumulative-layout-shift': 0.1,
  'speed-index': 3400,
};

async function launchChromeAndRunLighthouse(url, opts = {}) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  opts.port = chrome.port;

  const runnerResult = await lighthouse(url, opts, LIGHTHOUSE_CONFIG);

  await chrome.kill();

  return runnerResult;
}

function checkThresholds(results, url) {
  const failures = [];
  const { categories, audits } = results.lhr;

  // Check category scores
  Object.keys(categories).forEach((categoryId) => {
    const category = categories[categoryId];
    const threshold = PERFORMANCE_THRESHOLDS[categoryId];
    const score = category.score * 100;

    if (threshold && score < threshold) {
      failures.push({
        type: 'category',
        name: category.title,
        score: score.toFixed(1),
        threshold,
        url,
      });
    }
  });

  // Check specific metrics
  const metricsToCheck = {
    'first-contentful-paint': audits['first-contentful-paint'].numericValue,
    'largest-contentful-paint': audits['largest-contentful-paint'].numericValue,
    'total-blocking-time': audits['total-blocking-time'].numericValue,
    'cumulative-layout-shift': audits['cumulative-layout-shift'].numericValue,
    'speed-index': audits['speed-index'].numericValue,
  };

  Object.entries(metricsToCheck).forEach(([metric, value]) => {
    const threshold = PERFORMANCE_THRESHOLDS[metric];

    if (threshold && value > threshold) {
      failures.push({
        type: 'metric',
        name: metric,
        value: value.toFixed(1),
        threshold,
        url,
      });
    }
  });

  return failures;
}

function generateReport(allResults) {
  const reportDir = path.join(__dirname, '../lighthouse-reports');

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summaryFile = path.join(reportDir, `summary-${timestamp}.json`);

  const summary = {
    timestamp: new Date().toISOString(),
    results: allResults,
  };

  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

  console.log('\n📊 Performance Summary:');
  console.log('─'.repeat(80));

  allResults.forEach((result) => {
    console.log(`\n${result.name} (${result.url})`);
    console.log('─'.repeat(80));

    Object.entries(result.scores).forEach(([category, score]) => {
      const emoji = score >= 90 ? '✅' : score >= 50 ? '⚠️' : '❌';
      console.log(`${emoji} ${category}: ${score}`);
    });

    if (result.failures.length > 0) {
      console.log('\n❌ Failed Thresholds:');
      result.failures.forEach((failure) => {
        if (failure.type === 'category') {
          console.log(
            `  - ${failure.name}: ${failure.score} (threshold: ${failure.threshold})`
          );
        } else {
          console.log(
            `  - ${failure.name}: ${failure.value}ms (threshold: ${failure.threshold}ms)`
          );
        }
      });
    }
  });

  console.log('\n─'.repeat(80));
  console.log(`📄 Full report saved to: ${summaryFile}`);

  // Save individual HTML reports
  allResults.forEach((result) => {
    const htmlFile = path.join(
      reportDir,
      `${result.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.html`
    );
    fs.writeFileSync(htmlFile, result.report);
    console.log(`📄 HTML report: ${htmlFile}`);
  });
}

async function runAudits() {
  console.log('🚀 Starting Lighthouse Performance Audits...\n');

  const allResults = [];
  let totalFailures = 0;

  for (const testCase of URLS_TO_TEST) {
    console.log(`🔍 Testing: ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);

    try {
      const results = await launchChromeAndRunLighthouse(testCase.url);

      const scores = {};
      Object.keys(results.lhr.categories).forEach((categoryId) => {
        scores[categoryId] = (results.lhr.categories[categoryId].score * 100).toFixed(1);
      });

      const failures = checkThresholds(results, testCase.url);
      totalFailures += failures.length;

      allResults.push({
        name: testCase.name,
        url: testCase.url,
        scores,
        failures,
        report: results.report,
      });

      console.log(`   ✅ Complete\n`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      allResults.push({
        name: testCase.name,
        url: testCase.url,
        scores: {},
        failures: [{ type: 'error', message: error.message }],
        report: '',
      });
    }
  }

  generateReport(allResults);

  if (totalFailures > 0) {
    console.log(`\n❌ ${totalFailures} threshold failures detected`);
    process.exit(1);
  } else {
    console.log('\n✅ All performance thresholds passed!');
    process.exit(0);
  }
}

// Run audits
runAudits().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
