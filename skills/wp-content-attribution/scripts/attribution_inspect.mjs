/**
 * attribution_inspect.mjs — Detect content-commerce attribution readiness.
 *
 * Scans for WooCommerce presence, analytics plugins, UTM tracking setup,
 * content/product volume, and existing order meta with source fields.
 * Outputs a JSON report to stdout.
 *
 * Usage:
 *   node attribution_inspect.mjs [--cwd=/path/to/check]
 *
 * Exit codes:
 *   0 — attribution indicators detected
 *   1 — no attribution indicators detected
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
// Detect WooCommerce
// ---------------------------------------------------------------------------

function detectWooCommerce(cwd) {
  const pluginsDir = path.join(cwd, "wp-content", "plugins");
  if (statSafe(path.join(pluginsDir, "woocommerce"))?.isDirectory()) return true;

  const composer = readJsonSafe(path.join(cwd, "composer.json"));
  if (composer) {
    const allDeps = { ...composer.require, ...composer["require-dev"] };
    if (allDeps["woocommerce/woocommerce"] || allDeps["wpackagist-plugin/woocommerce"]) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Detect analytics plugins
// ---------------------------------------------------------------------------

function detectAnalyticsPlugin(cwd) {
  const result = { detected: false, plugin: null };

  const pluginsDir = path.join(cwd, "wp-content", "plugins");
  const analyticsPlugins = [
    { dir: "google-analytics-for-wordpress", name: "MonsterInsights" },
    { dir: "google-site-kit", name: "Google Site Kit" },
    { dir: "woocommerce-google-analytics-integration", name: "WooCommerce Google Analytics" },
    { dir: "ga-google-analytics", name: "GA Google Analytics" },
    { dir: "analytify", name: "Analytify" },
    { dir: "matomo", name: "Matomo Analytics" },
  ];

  for (const plugin of analyticsPlugins) {
    if (statSafe(path.join(pluginsDir, plugin.dir))?.isDirectory()) {
      result.detected = true;
      result.plugin = plugin.name;
      return result;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect UTM tracking
// ---------------------------------------------------------------------------

function detectUtmTracking(cwd) {
  const result = { detected: false, sources: [] };

  // Check mu-plugins for UTM capture
  const muPluginsDir = path.join(cwd, "wp-content", "mu-plugins");
  const muFiles = readdirSafe(muPluginsDir);
  for (const file of muFiles) {
    if (!file.endsWith(".php")) continue;
    const content = readFileSafe(path.join(muPluginsDir, file));
    if (content && /utm_source|utm_campaign|utm_medium/i.test(content)) {
      result.detected = true;
      result.sources.push(`mu-plugin: ${file}`);
    }
  }

  // Check plugins for UTM tracking
  const pluginsDir = path.join(cwd, "wp-content", "plugins");
  const utmPlugins = [
    { dir: "utm-dot-io", name: "UTM.io" },
    { dir: "campaign-url-builder", name: "Campaign URL Builder" },
    { dir: "leadin", name: "HubSpot (UTM tracking)" },
  ];

  for (const plugin of utmPlugins) {
    if (statSafe(path.join(pluginsDir, plugin.dir))?.isDirectory()) {
      result.detected = true;
      result.sources.push(`plugin: ${plugin.name}`);
    }
  }

  // Check theme functions.php for UTM capture
  const themesDir = path.join(cwd, "wp-content", "themes");
  const themes = readdirSafe(themesDir);
  for (const theme of themes) {
    const functionsPhp = readFileSafe(path.join(themesDir, theme, "functions.php"));
    if (functionsPhp && /utm_source|utm_campaign/i.test(functionsPhp)) {
      result.detected = true;
      result.sources.push(`theme: ${theme}/functions.php`);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect content volume
// ---------------------------------------------------------------------------

function detectContentVolume(cwd) {
  const result = { content_count: 0, product_count: 0 };

  const postCount = execSafe("wp post list --post_type=post --post_status=publish --format=count 2>/dev/null", cwd);
  if (postCount) result.content_count = parseInt(postCount) || 0;

  const productCount = execSafe("wp post list --post_type=product --post_status=publish --format=count 2>/dev/null", cwd);
  if (productCount) result.product_count = parseInt(productCount) || 0;

  return result;
}

// ---------------------------------------------------------------------------
// Detect existing order meta with source fields
// ---------------------------------------------------------------------------

function detectOrderMeta(cwd) {
  // Check if any completed orders have UTM meta
  const orderMeta = execSafe(
    `wp db query "SELECT COUNT(*) as c FROM $(wp db prefix 2>/dev/null)postmeta WHERE meta_key LIKE '%utm_source%'" --format=csv 2>/dev/null`,
    cwd
  );

  if (orderMeta && /\d+/.test(orderMeta)) {
    const count = parseInt(orderMeta.match(/\d+/)[0]);
    return count > 0;
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

  const hasWoocommerce = detectWooCommerce(cwd);
  const analytics = detectAnalyticsPlugin(cwd);
  const utm = detectUtmTracking(cwd);
  const volume = detectContentVolume(cwd);
  const hasOrderMeta = detectOrderMeta(cwd);

  const detected = hasWoocommerce && (analytics.detected || utm.detected || volume.content_count > 0);

  const report = {
    tool: "attribution_inspect",
    version: TOOL_VERSION,
    cwd,
    detected,
    has_woocommerce: hasWoocommerce,
    analytics_plugin: analytics.plugin,
    has_utm_tracking: utm.detected,
    utm_sources: utm.sources,
    content_count: volume.content_count,
    product_count: volume.product_count,
    has_order_attribution_meta: hasOrderMeta,
    attribution_readiness: "unknown",
    recommendations: [],
  };

  // Assess readiness
  if (hasWoocommerce && utm.detected && analytics.detected && volume.content_count > 10) {
    report.attribution_readiness = "high";
  } else if (hasWoocommerce && (utm.detected || analytics.detected) && volume.content_count > 0) {
    report.attribution_readiness = "medium";
  } else if (hasWoocommerce && volume.content_count > 0) {
    report.attribution_readiness = "low";
  } else {
    report.attribution_readiness = "not_ready";
  }

  // Recommendations
  if (!hasWoocommerce) {
    report.recommendations.push("WooCommerce not detected. Content-commerce attribution requires WooCommerce for sales data.");
  }
  if (hasWoocommerce && !utm.detected) {
    report.recommendations.push("No UTM tracking detected. Install the UTM capture mu-plugin to link content visits to orders.");
  }
  if (hasWoocommerce && !analytics.detected) {
    report.recommendations.push("No analytics plugin detected. Install MonsterInsights or Google Site Kit for traffic data.");
  }
  if (volume.content_count === 0) {
    report.recommendations.push("No published content found. Create blog posts/content to drive traffic to products.");
  }
  if (volume.content_count > 0 && volume.product_count === 0) {
    report.recommendations.push("Content exists but no products found. Verify WooCommerce products are published.");
  }
  if (hasWoocommerce && utm.detected && !hasOrderMeta) {
    report.recommendations.push("UTM tracking is set up but no order attribution meta found yet. Place a test order to verify.");
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(detected ? 0 : 1);
}

main();
