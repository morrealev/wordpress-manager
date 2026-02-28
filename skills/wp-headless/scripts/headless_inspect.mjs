/**
 * headless_inspect.mjs — Detect headless WordPress configuration.
 *
 * Scans for WPGraphQL, CORS config, frontend framework integration,
 * and decoupled architecture indicators.
 * Outputs a JSON report to stdout.
 *
 * Usage:
 *   node headless_inspect.mjs [--cwd=/path/to/check]
 *
 * Exit codes:
 *   0 — headless indicators detected
 *   1 — no headless indicators detected
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
// Detect WPGraphQL
// ---------------------------------------------------------------------------

function detectWPGraphQL(cwd) {
  const result = { detected: false, plugins: [] };

  const pluginsDir = path.join(cwd, "wp-content", "plugins");
  const graphqlPlugins = [
    { dir: "wp-graphql", name: "WPGraphQL" },
    { dir: "wpgraphql-acf", name: "WPGraphQL for ACF" },
    { dir: "wp-graphql-jwt-authentication", name: "WPGraphQL JWT Auth" },
    { dir: "wp-graphql-smart-cache", name: "WPGraphQL Smart Cache" },
    { dir: "wp-graphql-woocommerce", name: "WPGraphQL WooCommerce" },
    { dir: "wp-gatsby", name: "WP Gatsby" },
  ];

  for (const plugin of graphqlPlugins) {
    if (statSafe(path.join(pluginsDir, plugin.dir))?.isDirectory()) {
      result.detected = true;
      result.plugins.push(plugin.name);
    }
  }

  // Check composer.json for WPGraphQL
  const composer = readJsonSafe(path.join(cwd, "composer.json"));
  if (composer) {
    const allDeps = { ...composer.require, ...composer["require-dev"] };
    if (allDeps["wp-graphql/wp-graphql"]) {
      result.detected = true;
      if (!result.plugins.includes("WPGraphQL")) result.plugins.push("WPGraphQL (composer)");
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect CORS configuration
// ---------------------------------------------------------------------------

function detectCORS(cwd) {
  const result = { detected: false, sources: [] };

  // Check .htaccess
  const htaccess = readFileSafe(path.join(cwd, ".htaccess"));
  if (htaccess && /Access-Control-Allow-Origin/i.test(htaccess)) {
    result.detected = true;
    result.sources.push(".htaccess");
  }

  // Check wp-config.php for CORS constants
  const wpConfig = readFileSafe(path.join(cwd, "wp-config.php"));
  if (wpConfig && /CORS|Access-Control/i.test(wpConfig)) {
    result.detected = true;
    result.sources.push("wp-config.php");
  }

  // Check PHP files for CORS headers
  const corsPhp = execSafe(
    `grep -rl --include="*.php" "Access-Control-Allow-Origin" . 2>/dev/null | head -5`,
    cwd
  );
  if (corsPhp && corsPhp.length > 0) {
    result.detected = true;
    const files = corsPhp.split("\n").map((f) => path.relative(cwd, f));
    result.sources.push(...files.filter((f) => !result.sources.includes(f)));
  }

  // Check nginx config (common locations)
  for (const confPath of ["/etc/nginx/sites-enabled/default", "/etc/nginx/conf.d/default.conf"]) {
    const content = readFileSafe(confPath);
    if (content && /Access-Control-Allow-Origin/i.test(content)) {
      result.detected = true;
      result.sources.push(confPath);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect frontend framework
// ---------------------------------------------------------------------------

function detectFrontend(cwd) {
  const result = { detected: false, framework: null, location: null };

  // Check for frontend directories
  const frontendDirs = ["frontend", "client", "app", "web", "next", "nuxt"];
  for (const dir of frontendDirs) {
    const pkgPath = path.join(cwd, dir, "package.json");
    const pkg = readJsonSafe(pkgPath);
    if (pkg) {
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (allDeps["next"]) {
        result.detected = true;
        result.framework = "Next.js";
        result.location = dir;
        return result;
      }
      if (allDeps["nuxt"] || allDeps["nuxt3"]) {
        result.detected = true;
        result.framework = "Nuxt";
        result.location = dir;
        return result;
      }
      if (allDeps["astro"]) {
        result.detected = true;
        result.framework = "Astro";
        result.location = dir;
        return result;
      }
      if (allDeps["gatsby"]) {
        result.detected = true;
        result.framework = "Gatsby";
        result.location = dir;
        return result;
      }
    }
  }

  // Check root package.json
  const rootPkg = readJsonSafe(path.join(cwd, "package.json"));
  if (rootPkg) {
    const allDeps = { ...rootPkg.dependencies, ...rootPkg.devDependencies };
    if (allDeps["next"]) { result.detected = true; result.framework = "Next.js"; result.location = "."; }
    else if (allDeps["nuxt"] || allDeps["nuxt3"]) { result.detected = true; result.framework = "Nuxt"; result.location = "."; }
    else if (allDeps["astro"]) { result.detected = true; result.framework = "Astro"; result.location = "."; }
    else if (allDeps["gatsby"]) { result.detected = true; result.framework = "Gatsby"; result.location = "."; }
    else if (allDeps["gatsby-source-wordpress"]) { result.detected = true; result.framework = "Gatsby"; result.location = "."; }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect headless indicators in WordPress
// ---------------------------------------------------------------------------

function detectHeadlessIndicators(cwd) {
  const result = { indicators: [] };

  // Check for headless theme (minimal or API-only themes)
  const themeDir = path.join(cwd, "wp-content", "themes");
  if (statSafe(themeDir)?.isDirectory()) {
    const themes = readdirSafe(themeDir);
    for (const theme of themes) {
      const functionsPhp = readFileSafe(path.join(themeDir, theme, "functions.php"));
      if (functionsPhp && /headless|decoupled|api.only/i.test(functionsPhp)) {
        result.indicators.push(`Headless theme detected: ${theme}`);
      }
    }
  }

  // Check for webhook configuration
  const wpConfig = readFileSafe(path.join(cwd, "wp-config.php"));
  if (wpConfig) {
    if (/HEADLESS_WEBHOOK/i.test(wpConfig)) {
      result.indicators.push("Webhook configuration found in wp-config.php");
    }
    if (/HEADLESS_FRONTEND|FRONTEND_URL/i.test(wpConfig)) {
      result.indicators.push("Frontend URL constant found in wp-config.php");
    }
  }

  // Check for REST API customizations
  const restCustom = execSafe(
    `grep -rl --include="*.php" "register_rest_route" . 2>/dev/null | wc -l`,
    cwd
  );
  if (restCustom && parseInt(restCustom) > 3) {
    result.indicators.push(`${restCustom} files with custom REST routes detected`);
  }

  // Check for headless plugins
  const pluginsDir = path.join(cwd, "wp-content", "plugins");
  const headlessPlugins = [
    { dir: "faust-wordpress", name: "Faust.js (WP Engine)" },
    { dir: "atlas-content-modeler", name: "Atlas Content Modeler" },
    { dir: "wp-gatsby", name: "WP Gatsby" },
    { dir: "headless-mode", name: "Headless Mode" },
  ];

  for (const plugin of headlessPlugins) {
    if (statSafe(path.join(pluginsDir, plugin.dir))?.isDirectory()) {
      result.indicators.push(`Plugin: ${plugin.name}`);
    }
  }

  return result;
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

  const graphql = detectWPGraphQL(cwd);
  const cors = detectCORS(cwd);
  const frontend = detectFrontend(cwd);
  const indicators = detectHeadlessIndicators(cwd);

  const detected = graphql.detected || cors.detected || frontend.detected || indicators.indicators.length > 0;

  const report = {
    tool: "headless_inspect",
    version: TOOL_VERSION,
    cwd,
    detected,
    graphql,
    cors,
    frontend,
    indicators: indicators.indicators,
    apiLayer: graphql.detected ? "WPGraphQL" : "REST API",
    recommendations: [],
  };

  // Recommendations
  if (frontend.detected && !graphql.detected && !cors.detected) {
    report.recommendations.push("Frontend framework detected but no CORS or GraphQL setup found. Configure CORS headers for cross-origin API access.");
  }
  if (graphql.detected && !cors.detected) {
    report.recommendations.push("WPGraphQL detected but no CORS configuration found. Add CORS headers for frontend access.");
  }
  if (frontend.framework === "Gatsby" && !graphql.detected) {
    report.recommendations.push("Gatsby detected. Install WPGraphQL for optimal integration with gatsby-source-wordpress.");
  }
  if (detected && indicators.indicators.length === 0) {
    report.recommendations.push("Consider adding a webhook system to notify the frontend of content changes.");
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(detected ? 0 : 1);
}

main();
