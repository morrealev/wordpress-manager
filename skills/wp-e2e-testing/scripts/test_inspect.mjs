/**
 * test_inspect.mjs — Detect testing frameworks and configuration in a WordPress project.
 *
 * Scans for Playwright, Jest, PHPUnit, wp-env, and CI config.
 * Outputs a JSON report to stdout with detected frameworks,
 * test directories, configuration files, and CI integration.
 *
 * Usage:
 *   node test_inspect.mjs [--cwd=/path/to/check]
 *
 * Exit codes:
 *   0 — at least one test framework detected
 *   1 — no test frameworks detected
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const TOOL_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statSafe(p) {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function readJsonSafe(p) {
  const raw = readFileSafe(p);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function execSafe(cmd, cwd, timeoutMs = 5000) {
  try {
    return execSync(cmd, { encoding: "utf8", timeout: timeoutMs, cwd, stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

function globDirs(base, patterns) {
  const found = [];
  for (const pattern of patterns) {
    const full = path.join(base, pattern);
    if (statSafe(full)?.isDirectory()) {
      found.push(pattern);
    }
  }
  return found;
}

function globFiles(base, patterns) {
  const found = [];
  for (const pattern of patterns) {
    const full = path.join(base, pattern);
    if (statSafe(full)?.isFile()) {
      found.push(pattern);
    }
  }
  return found;
}

// ---------------------------------------------------------------------------
// Parse --cwd argument
// ---------------------------------------------------------------------------

function parseCwd() {
  const cwdArg = process.argv.find((a) => a.startsWith("--cwd="));
  return cwdArg ? cwdArg.slice(6) : process.cwd();
}

// ---------------------------------------------------------------------------
// Detect Playwright
// ---------------------------------------------------------------------------

function detectPlaywright(cwd) {
  const result = { detected: false, configFile: null, testDirs: [], wpE2eUtils: false };

  const configFiles = [
    "playwright.config.js",
    "playwright.config.ts",
    "playwright.config.mjs",
  ];
  const found = globFiles(cwd, configFiles);
  if (found.length > 0) {
    result.detected = true;
    result.configFile = found[0];
  }

  const testDirs = globDirs(cwd, [
    "tests/e2e",
    "tests/playwright",
    "e2e",
    "test/e2e",
    "specs",
  ]);
  result.testDirs = testDirs;

  // Check for @wordpress/e2e-test-utils-playwright
  const pkg = readJsonSafe(path.join(cwd, "package.json"));
  if (pkg) {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (allDeps["@wordpress/e2e-test-utils-playwright"]) {
      result.wpE2eUtils = true;
      result.detected = true;
    }
    if (allDeps["@playwright/test"] || allDeps["playwright"]) {
      result.detected = true;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect Jest
// ---------------------------------------------------------------------------

function detectJest(cwd) {
  const result = { detected: false, configFile: null, testDirs: [], wpScripts: false };

  const configFiles = [
    "jest.config.js",
    "jest.config.ts",
    "jest.config.mjs",
    "jest.config.json",
  ];
  const found = globFiles(cwd, configFiles);
  if (found.length > 0) {
    result.detected = true;
    result.configFile = found[0];
  }

  // Check package.json for jest config
  const pkg = readJsonSafe(path.join(cwd, "package.json"));
  if (pkg) {
    if (pkg.jest) {
      result.detected = true;
      result.configFile = result.configFile || "package.json (jest key)";
    }
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (allDeps["@wordpress/scripts"]) {
      result.wpScripts = true;
      result.detected = true;
    }
    if (allDeps["jest"]) {
      result.detected = true;
    }
  }

  const testDirs = globDirs(cwd, [
    "tests/js",
    "tests/unit",
    "tests/jest",
    "src/__tests__",
    "__tests__",
    "test/js",
  ]);
  result.testDirs = testDirs;

  return result;
}

// ---------------------------------------------------------------------------
// Detect PHPUnit
// ---------------------------------------------------------------------------

function detectPHPUnit(cwd) {
  const result = { detected: false, configFile: null, testDirs: [], bootstrap: null };

  const configFiles = [
    "phpunit.xml",
    "phpunit.xml.dist",
    "phpunit.dist.xml",
  ];
  const found = globFiles(cwd, configFiles);
  if (found.length > 0) {
    result.detected = true;
    result.configFile = found[0];

    // Parse bootstrap path from XML
    const content = readFileSafe(path.join(cwd, found[0]));
    if (content) {
      const match = content.match(/bootstrap="([^"]+)"/);
      if (match) result.bootstrap = match[1];
    }
  }

  const testDirs = globDirs(cwd, [
    "tests/phpunit",
    "tests/php",
    "tests/unit",
    "tests",
  ]);
  result.testDirs = testDirs;

  // Check composer.json
  const composer = readJsonSafe(path.join(cwd, "composer.json"));
  if (composer) {
    const allDeps = { ...composer.require, ...composer["require-dev"] };
    if (allDeps["phpunit/phpunit"] || allDeps["yoast/phpunit-polyfills"]) {
      result.detected = true;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect wp-env
// ---------------------------------------------------------------------------

function detectWpEnv(cwd) {
  const result = { detected: false, configFile: null, running: false };

  if (statSafe(path.join(cwd, ".wp-env.json"))?.isFile()) {
    result.detected = true;
    result.configFile = ".wp-env.json";
  }

  if (statSafe(path.join(cwd, ".wp-env.override.json"))?.isFile()) {
    result.detected = true;
  }

  const pkg = readJsonSafe(path.join(cwd, "package.json"));
  if (pkg) {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (allDeps["@wordpress/env"]) {
      result.detected = true;
    }
  }

  // Check if wp-env is running (Docker containers)
  const dockerCheck = execSafe("docker ps --filter name=wp-env --format '{{.Names}}'", cwd);
  if (dockerCheck && dockerCheck.length > 0) {
    result.running = true;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect CI configuration
// ---------------------------------------------------------------------------

function detectCI(cwd) {
  const result = { detected: false, provider: null, hasTestStep: false };

  // GitHub Actions
  const ghDirs = globDirs(cwd, [".github/workflows"]);
  if (ghDirs.length > 0) {
    const workflowDir = path.join(cwd, ".github", "workflows");
    try {
      const files = fs.readdirSync(workflowDir);
      for (const file of files) {
        if (file.endsWith(".yml") || file.endsWith(".yaml")) {
          result.detected = true;
          result.provider = "github-actions";
          const content = readFileSafe(path.join(workflowDir, file));
          if (content && /phpunit|jest|playwright|wp-env|npm test|npm run test/i.test(content)) {
            result.hasTestStep = true;
          }
        }
      }
    } catch { /* ignore */ }
  }

  // GitLab CI
  if (statSafe(path.join(cwd, ".gitlab-ci.yml"))?.isFile()) {
    result.detected = true;
    result.provider = result.provider || "gitlab-ci";
    const content = readFileSafe(path.join(cwd, ".gitlab-ci.yml"));
    if (content && /phpunit|jest|playwright|wp-env/i.test(content)) {
      result.hasTestStep = true;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect npm test scripts
// ---------------------------------------------------------------------------

function detectScripts(cwd) {
  const pkg = readJsonSafe(path.join(cwd, "package.json"));
  if (!pkg?.scripts) return {};

  const testScripts = {};
  for (const [key, value] of Object.entries(pkg.scripts)) {
    if (/test|e2e|playwright|jest|phpunit/i.test(key)) {
      testScripts[key] = value;
    }
  }
  return testScripts;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cwd = parseCwd();

  if (!statSafe(cwd)?.isDirectory()) {
    console.error(`Error: directory not found: ${cwd}`);
    process.exit(1);
  }

  const playwright = detectPlaywright(cwd);
  const jest = detectJest(cwd);
  const phpunit = detectPHPUnit(cwd);
  const wpEnv = detectWpEnv(cwd);
  const ci = detectCI(cwd);
  const scripts = detectScripts(cwd);

  const anyDetected = playwright.detected || jest.detected || phpunit.detected;

  const report = {
    tool: "test_inspect",
    version: TOOL_VERSION,
    cwd,
    detected: anyDetected,
    frameworks: {
      playwright,
      jest,
      phpunit,
    },
    environment: {
      wpEnv,
    },
    ci,
    scripts,
    recommendations: [],
  };

  // Generate recommendations
  if (!anyDetected) {
    report.recommendations.push("No test frameworks detected. Consider adding Playwright for E2E and PHPUnit for unit tests.");
  }
  if (!wpEnv.detected && (playwright.detected || phpunit.detected)) {
    report.recommendations.push("Consider adding .wp-env.json for a consistent WordPress test environment.");
  }
  if (anyDetected && !ci.hasTestStep) {
    report.recommendations.push("Test frameworks detected but CI does not run tests. Add a test step to your CI pipeline.");
  }
  if (playwright.detected && !playwright.wpE2eUtils) {
    report.recommendations.push("Consider using @wordpress/e2e-test-utils-playwright for WordPress-specific test helpers.");
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(anyDetected ? 0 : 1);
}

main();
