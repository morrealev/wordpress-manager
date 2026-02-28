/**
 * programmatic_seo_inspect.mjs — Detect programmatic SEO readiness.
 *
 * Scans for headless frontend, SEO plugins, content volume, custom post types,
 * and WPGraphQL availability to assess readiness for programmatic page generation.
 * Outputs a JSON report to stdout.
 *
 * Usage:
 *   node programmatic_seo_inspect.mjs [--cwd=/path/to/check]
 *
 * Exit codes:
 *   0 — programmatic SEO indicators detected
 *   1 — no programmatic SEO indicators detected
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

function readdirSafe(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Parse --cwd argument
// ---------------------------------------------------------------------------

function parseCwd() {
  const cwdArg = process.argv.find((a) => a.startsWith("--cwd="));
  return cwdArg ? cwdArg.slice(6) : process.cwd();
}

// ---------------------------------------------------------------------------
// Detect headless frontend
// ---------------------------------------------------------------------------

function detectHeadlessFrontend(cwd) {
  const result = { detected: false, framework: null, location: null };

  const frontendDirs = ["frontend", "client", "app", "web", "next", "nuxt", "."];
  for (const dir of frontendDirs) {
    const pkgPath = path.join(cwd, dir, "package.json");
    const pkg = readJsonSafe(pkgPath);
    if (!pkg) continue;
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (allDeps["next"]) { result.detected = true; result.framework = "Next.js"; result.location = dir; return result; }
    if (allDeps["nuxt"] || allDeps["nuxt3"]) { result.detected = true; result.framework = "Nuxt"; result.location = dir; return result; }
    if (allDeps["astro"]) { result.detected = true; result.framework = "Astro"; result.location = dir; return result; }
    if (allDeps["gatsby"]) { result.detected = true; result.framework = "Gatsby"; result.location = dir; return result; }
  }

  // Check for config files directly
  const configFiles = [
    { file: "next.config.js", fw: "Next.js" },
    { file: "next.config.mjs", fw: "Next.js" },
    { file: "next.config.ts", fw: "Next.js" },
    { file: "nuxt.config.ts", fw: "Nuxt" },
    { file: "nuxt.config.js", fw: "Nuxt" },
    { file: "astro.config.mjs", fw: "Astro" },
    { file: "astro.config.ts", fw: "Astro" },
  ];
  for (const { file, fw } of configFiles) {
    if (statSafe(path.join(cwd, file))) {
      result.detected = true;
      result.framework = fw;
      result.location = ".";
      return result;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect SEO plugins
// ---------------------------------------------------------------------------

function detectSeoPlugin(cwd) {
  const result = { detected: false, plugin: null };

  const pluginsDir = path.join(cwd, "wp-content", "plugins");
  const seoPlugins = [
    { dir: "wordpress-seo", name: "Yoast SEO" },
    { dir: "seo-by-rank-math", name: "Rank Math" },
    { dir: "all-in-one-seo-pack", name: "All in One SEO" },
    { dir: "the-seo-framework-extension-manager", name: "The SEO Framework" },
  ];

  for (const plugin of seoPlugins) {
    if (statSafe(path.join(pluginsDir, plugin.dir))?.isDirectory()) {
      result.detected = true;
      result.plugin = plugin.name;
      return result;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect content counts by type
// ---------------------------------------------------------------------------

function detectContentCounts(cwd) {
  const result = { posts: 0, pages: 0, products: 0, custom_post_types: [] };

  // Try WP-CLI for accurate counts
  const postCount = execSafe("wp post list --post_type=post --post_status=publish --format=count 2>/dev/null", cwd);
  if (postCount) result.posts = parseInt(postCount) || 0;

  const pageCount = execSafe("wp post list --post_type=page --post_status=publish --format=count 2>/dev/null", cwd);
  if (pageCount) result.pages = parseInt(pageCount) || 0;

  const productCount = execSafe("wp post list --post_type=product --post_status=publish --format=count 2>/dev/null", cwd);
  if (productCount) result.products = parseInt(productCount) || 0;

  // Detect custom post types via WP-CLI
  const cptList = execSafe("wp post-type list --_builtin=0 --format=json 2>/dev/null", cwd);
  if (cptList) {
    try {
      const cpts = JSON.parse(cptList);
      result.custom_post_types = cpts.map((c) => c.name || c);
    } catch { /* ignore parse errors */ }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect WPGraphQL
// ---------------------------------------------------------------------------

function detectWPGraphQL(cwd) {
  const pluginsDir = path.join(cwd, "wp-content", "plugins");
  if (statSafe(path.join(pluginsDir, "wp-graphql"))?.isDirectory()) return true;

  const composer = readJsonSafe(path.join(cwd, "composer.json"));
  if (composer) {
    const allDeps = { ...composer.require, ...composer["require-dev"] };
    if (allDeps["wp-graphql/wp-graphql"]) return true;
  }

  return false;
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

  const headless = detectHeadlessFrontend(cwd);
  const seo = detectSeoPlugin(cwd);
  const content = detectContentCounts(cwd);
  const hasWpgraphql = detectWPGraphQL(cwd);
  const hasCustomPostTypes = content.custom_post_types.length > 0;

  const detected = headless.detected || seo.detected || hasCustomPostTypes;

  const report = {
    tool: "programmatic_seo_inspect",
    version: TOOL_VERSION,
    cwd,
    detected,
    has_headless_frontend: headless.detected,
    headless_framework: headless.framework,
    headless_location: headless.location,
    seo_plugin: seo.plugin,
    content_counts: {
      posts: content.posts,
      pages: content.pages,
      products: content.products,
    },
    has_custom_post_types: hasCustomPostTypes,
    custom_post_types: content.custom_post_types,
    has_wpgraphql: hasWpgraphql,
    programmatic_seo_readiness: "unknown",
    recommendations: [],
  };

  // Assess readiness
  if (headless.detected && seo.detected && hasCustomPostTypes) {
    report.programmatic_seo_readiness = "high";
  } else if (headless.detected || (seo.detected && hasCustomPostTypes)) {
    report.programmatic_seo_readiness = "medium";
  } else if (seo.detected) {
    report.programmatic_seo_readiness = "low";
  } else {
    report.programmatic_seo_readiness = "not_ready";
  }

  // Recommendations
  if (!headless.detected) {
    report.recommendations.push("No headless frontend detected. Install Next.js, Nuxt, or Astro for ISR/SSG page rendering.");
  }
  if (!seo.detected) {
    report.recommendations.push("No SEO plugin detected. Install Yoast SEO or Rank Math for sitemap generation and meta management.");
  }
  if (!hasCustomPostTypes) {
    report.recommendations.push("No custom post types found. Create CPTs to serve as structured data sources for programmatic pages.");
  }
  if (!hasWpgraphql && headless.detected) {
    report.recommendations.push("WPGraphQL not installed. Consider it for efficient batch data fetching from headless frontend.");
  }
  if (content.posts === 0 && content.pages === 0 && content.products === 0) {
    report.recommendations.push("No published content found. Create initial content or verify WP-CLI access for accurate counts.");
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(detected ? 0 : 1);
}

main();
