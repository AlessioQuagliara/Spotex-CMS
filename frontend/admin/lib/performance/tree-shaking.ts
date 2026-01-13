/**
 * Tree Shaking Configuration and Optimization
 * Eliminates dead code and unused exports
 */

/**
 * Webpack tree shaking configuration
 */
export const treeShakingConfig = {
  optimization: {
    usedExports: true,
    sideEffects: false,
    minimize: true,
    minimizer: [
      // Terser plugin configuration
      {
        terserOptions: {
          parse: {
            ecma: 2020,
          },
          compress: {
            ecma: 2020,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: process.env.NODE_ENV === "production",
            drop_debugger: process.env.NODE_ENV === "production",
            pure_funcs: process.env.NODE_ENV === "production" ? ["console.log", "console.info"] : [],
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 2020,
            comments: false,
            ascii_only: true,
          },
        },
      },
    ],
  },
};

/**
 * Package.json sideEffects configuration
 * List files that have side effects
 */
export const sideEffectsConfig = {
  sideEffects: [
    "*.css",
    "*.scss",
    "*.sass",
    "*.less",
    "./src/polyfills.ts",
    "./src/global-setup.ts",
  ],
};

/**
 * Module resolution aliases for better tree shaking
 */
export const aliasConfig = {
  resolve: {
    alias: {
      // Use ES modules instead of CommonJS
      "lodash": "lodash-es",
      "date-fns": "date-fns/esm",
      
      // Specific imports for better tree shaking
      "@mui/material": "@mui/material/esm",
      "@mui/icons-material": "@mui/icons-material/esm",
    },
  },
};

/**
 * Babel plugin configuration for tree shaking
 */
export const babelTreeShakingPlugins = [
  // Transform imports to direct imports
  [
    "babel-plugin-transform-imports",
    {
      "lodash": {
        transform: "lodash/${member}",
        preventFullImport: true,
      },
      "@mui/material": {
        transform: "@mui/material/${member}",
        preventFullImport: true,
      },
      "@mui/icons-material": {
        transform: "@mui/icons-material/${member}",
        preventFullImport: true,
      },
      "recharts": {
        transform: "recharts/es6/component/${member}",
        preventFullImport: true,
      },
    },
  ],
  
  // Remove unused imports
  "babel-plugin-jsx-remove-data-test-id",
  
  // Optimize React
  [
    "babel-plugin-transform-react-remove-prop-types",
    {
      mode: "remove",
      removeImport: true,
    },
  ],
];

/**
 * ESLint rules for tree shaking
 */
export const eslintTreeShakingRules = {
  rules: {
    // Warn about default imports that prevent tree shaking
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "lodash",
            message: "Use lodash-es for better tree shaking: import { method } from 'lodash-es'",
          },
          {
            name: "@mui/material",
            message: "Import specific components: import Button from '@mui/material/Button'",
          },
          {
            name: "recharts",
            message: "Import specific components from recharts",
          },
        ],
        patterns: [
          {
            group: ["**/dist/**"],
            message: "Don't import from dist folders",
          },
        ],
      },
    ],
    
    // Enforce named exports
    "import/prefer-default-export": "off",
    "import/no-default-export": ["error", { allow: ["*.config.*", "page.tsx", "layout.tsx"] }],
    
    // Prevent unused imports
    "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  },
};

/**
 * Analyze tree shaking effectiveness
 */
export interface TreeShakingAnalysis {
  totalModules: number;
  usedModules: number;
  unusedModules: number;
  sizeBeforeShaking: number;
  sizeAfterShaking: number;
  savings: number;
  savingsPercentage: number;
}

export function analyzeTreeShaking(statsFile: string): TreeShakingAnalysis {
  const stats = require(statsFile);
  
  const totalModules = stats.modules.length;
  const usedModules = stats.modules.filter((m: any) => m.providedExports && m.providedExports.length > 0).length;
  const unusedModules = totalModules - usedModules;
  
  const sizeBeforeShaking = stats.assets
    .filter((a: any) => !a.name.includes(".map"))
    .reduce((sum: number, asset: any) => sum + (asset.info?.unminified || asset.size), 0);
    
  const sizeAfterShaking = stats.assets
    .filter((a: any) => !a.name.includes(".map"))
    .reduce((sum: number, asset: any) => sum + asset.size, 0);
    
  const savings = sizeBeforeShaking - sizeAfterShaking;
  const savingsPercentage = (savings / sizeBeforeShaking) * 100;
  
  return {
    totalModules,
    usedModules,
    unusedModules,
    sizeBeforeShaking,
    sizeAfterShaking,
    savings,
    savingsPercentage,
  };
}

/**
 * Detect unused exports in a module
 */
export function detectUnusedExports(modulePath: string, statsFile: string): string[] {
  const stats = require(statsFile);
  
  const module = stats.modules.find((m: any) => m.name === modulePath);
  
  if (!module) {
    return [];
  }
  
  const providedExports = module.providedExports || [];
  const usedExports = module.usedExports || [];
  
  return providedExports.filter((exp: string) => !usedExports.includes(exp));
}

/**
 * Generate tree shaking report
 */
export function generateTreeShakingReport(analysis: TreeShakingAnalysis): string {
  const report = `
# Tree Shaking Report

## Summary
- **Total Modules**: ${analysis.totalModules}
- **Used Modules**: ${analysis.usedModules}
- **Unused Modules**: ${analysis.unusedModules}
- **Unused Percentage**: ${((analysis.unusedModules / analysis.totalModules) * 100).toFixed(2)}%

## Size Analysis
- **Size Before Shaking**: ${(analysis.sizeBeforeShaking / 1024).toFixed(2)}KB
- **Size After Shaking**: ${(analysis.sizeAfterShaking / 1024).toFixed(2)}KB
- **Savings**: ${(analysis.savings / 1024).toFixed(2)}KB
- **Savings Percentage**: ${analysis.savingsPercentage.toFixed(2)}%

## Recommendations
${analysis.savingsPercentage < 10 ? "⚠️ Low tree shaking effectiveness. Review imports and ensure using ES modules." : ""}
${analysis.unusedModules > analysis.totalModules * 0.2 ? "⚠️ High number of unused modules. Consider removing unused dependencies." : ""}
${analysis.savingsPercentage > 30 ? "✅ Good tree shaking effectiveness!" : ""}

## Best Practices
1. Use named imports instead of default imports
2. Import only what you need: \`import { Button } from '@mui/material'\`
3. Use \`lodash-es\` instead of \`lodash\`
4. Avoid importing entire libraries
5. Use ESLint rules to enforce tree-shakeable imports
6. Configure \`sideEffects: false\` in package.json
7. Use ES modules (\`.mjs\`) when possible
`;

  return report;
}

/**
 * Optimize imports for better tree shaking
 */
export function optimizeImport(importStatement: string): string {
  // Transform: import _ from 'lodash'
  // To: import { method } from 'lodash-es'
  if (importStatement.includes("lodash") && !importStatement.includes("lodash-es")) {
    return importStatement.replace("lodash", "lodash-es");
  }
  
  // Transform: import * as Icons from '@mui/icons-material'
  // To: import Icon from '@mui/icons-material/Icon'
  if (importStatement.includes("* as") && importStatement.includes("@mui")) {
    console.warn("Avoid namespace imports from @mui for better tree shaking");
    return importStatement;
  }
  
  // Transform: import { Button, TextField } from '@mui/material'
  // To: Multiple specific imports (if more than 3 components)
  const componentsMatch = importStatement.match(/import\s+{([^}]+)}\s+from\s+['"]@mui\/material['"]/);
  if (componentsMatch) {
    const components = componentsMatch[1].split(",").map((c) => c.trim());
    if (components.length > 3) {
      return components
        .map((component) => `import ${component} from '@mui/material/${component}';`)
        .join("\n");
    }
  }
  
  return importStatement;
}

/**
 * Check if package supports tree shaking
 */
export function supportsTreeShaking(packageName: string): boolean {
  try {
    const packageJson = require(`${packageName}/package.json`);
    
    // Check for module field (ES modules)
    if (packageJson.module) return true;
    
    // Check for sideEffects field
    if (packageJson.sideEffects === false) return true;
    
    // Check for exports field with ES module conditions
    if (packageJson.exports) {
      const exportsStr = JSON.stringify(packageJson.exports);
      if (exportsStr.includes("import") || exportsStr.includes("module")) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Get tree shaking recommendations for dependencies
 */
export function getTreeShakingRecommendations(dependencies: Record<string, string>): Array<{
  package: string;
  supportsTreeShaking: boolean;
  recommendation: string;
}> {
  return Object.keys(dependencies).map((pkg) => {
    const supports = supportsTreeShaking(pkg);
    let recommendation = "";
    
    if (!supports) {
      // Known alternatives
      if (pkg === "lodash") {
        recommendation = "Replace with lodash-es for tree shaking support";
      } else if (pkg === "moment") {
        recommendation = "Replace with date-fns or dayjs for better tree shaking";
      } else {
        recommendation = "Check if package has an ES module version";
      }
    }
    
    return {
      package: pkg,
      supportsTreeShaking: supports,
      recommendation,
    };
  });
}
