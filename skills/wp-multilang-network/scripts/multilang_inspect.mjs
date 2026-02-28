/**
 * multilang_inspect.mjs — Detect multi-language network readiness.
 *
 * Scans for WordPress Multisite status, multilingual plugins, sub-site
 * language patterns, hreflang tags, and WPLANG configuration.
 * Outputs a JSON report to stdout.
 *
 * Usage:
 *   node multilang_inspect.mjs [--cwd=/path/to/check]
 *
 * Exit codes:
 *   0 — multi-language network indicators detected
 *   1 — no multi-language network indicators detected
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
// Detect WordPress Multisite
// ---------------------------------------------------------------------------

function detectMultisite(cwd) {
  const result = { is_multisite: false, site_count: 0 };

  // Check wp-config.php for MULTISITE constant
  const wpConfig = readFileSafe(path.join(cwd, "wp-config.php"));
  if (wpConfig) {
    if (/define\s*\(\s*['"]MULTISITE['"]\s*,\s*true\s*\)/i.test(wpConfig)) {
      result.is_multisite = true;
    }
    if (/define\s*\(\s*['"]WP_ALLOW_MULTISITE['"]\s*,\s*true\s*\)/i.test(wpConfig)) {
      result.is_multisite = true;
    }
  }

  // Try WP-CLI for site count
  const siteCount = execSafe("wp site list --format=count 2>/dev/null", cwd);
  if (siteCount) {
    const count = parseInt(siteCount);
    if (count > 1) {
      result.is_multisite = true;
      result.site_count = count;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect multilingual plugins
// ---------------------------------------------------------------------------

function detectMultilingualPlugin(cwd) {
  const result = { detected: false, plugin: null };

  const pluginsDir = path.join(cwd, "wp-content", "plugins");
  const multilingualPlugins = [
    { dir: "sitepress-multilingual-cms", name: "WPML" },
    { dir: "polylang", name: "Polylang" },
    { dir: "polylang-pro", name: "Polylang Pro" },
    { dir: "multilingualpress", name: "MultilingualPress" },
    { dir: "translatepress-multilingual", name: "TranslatePress" },
    { dir: "weglot", name: "Weglot" },
  ];

  for (const plugin of multilingualPlugins) {
    if (statSafe(path.join(pluginsDir, plugin.dir))?.isDirectory()) {
      result.detected = true;
      result.plugin = plugin.name;
      return result;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect language patterns in sub-sites
// ---------------------------------------------------------------------------

function detectLanguagePatterns(cwd) {
  const result = { detected_languages: [], sites: [] };

  // ISO 639-1 language codes to look for
  const langCodes = new Set([
    "en", "it", "de", "fr", "es", "pt", "nl", "pl", "sv", "da", "no", "fi",
    "ru", "ja", "zh", "ko", "ar", "he", "hi", "tr", "el", "cs", "ro", "hu",
    "uk", "bg", "hr", "sk", "sl", "et", "lv", "lt", "th", "vi", "id", "ms",
  ]);

  // Try WP-CLI to list sites with paths
  const siteList = execSafe("wp site list --fields=blog_id,url,path --format=json 2>/dev/null", cwd);
  if (siteList) {
    try {
      const sites = JSON.parse(siteList);
      for (const site of sites) {
        const pathSlug = (site.path || "").replace(/\//g, "").toLowerCase();
        const isLang = langCodes.has(pathSlug);
        result.sites.push({
          blog_id: site.blog_id,
          url: site.url,
          path: site.path,
          detected_language: isLang ? pathSlug : null,
        });
        if (isLang && !result.detected_languages.includes(pathSlug)) {
          result.detected_languages.push(pathSlug);
        }
      }
    } catch { /* ignore parse errors */ }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect hreflang tags
// ---------------------------------------------------------------------------

function detectHreflang(cwd) {
  const result = { detected: false, sources: [] };

  // Check mu-plugins for hreflang generation
  const muPluginsDir = path.join(cwd, "wp-content", "mu-plugins");
  const muFiles = readdirSafe(muPluginsDir);
  for (const file of muFiles) {
    if (!file.endsWith(".php")) continue;
    const content = readFileSafe(path.join(muPluginsDir, file));
    if (content && /hreflang/i.test(content)) {
      result.detected = true;
      result.sources.push(`mu-plugin: ${file}`);
    }
  }

  // Check theme files for hreflang
  const themesDir = path.join(cwd, "wp-content", "themes");
  const themes = readdirSafe(themesDir);
  for (const theme of themes) {
    const headerPhp = readFileSafe(path.join(themesDir, theme, "header.php"));
    if (headerPhp && /hreflang/i.test(headerPhp)) {
      result.detected = true;
      result.sources.push(`theme: ${theme}/header.php`);
    }
    const functionsPhp = readFileSafe(path.join(themesDir, theme, "functions.php"));
    if (functionsPhp && /hreflang/i.test(functionsPhp)) {
      result.detected = true;
      result.sources.push(`theme: ${theme}/functions.php`);
    }
  }

  // Multilingual plugins typically handle hreflang automatically
  const pluginsDir = path.join(cwd, "wp-content", "plugins");
  const hreflangPlugins = [
    { dir: "sitepress-multilingual-cms", name: "WPML (auto hreflang)" },
    { dir: "polylang", name: "Polylang (auto hreflang)" },
    { dir: "multilingualpress", name: "MultilingualPress (auto hreflang)" },
  ];
  for (const plugin of hreflangPlugins) {
    if (statSafe(path.join(pluginsDir, plugin.dir))?.isDirectory()) {
      result.detected = true;
      result.sources.push(`plugin: ${plugin.name}`);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect WPLANG configuration
// ---------------------------------------------------------------------------

function detectWplang(cwd) {
  const wpConfig = readFileSafe(path.join(cwd, "wp-config.php"));
  if (!wpConfig) return null;

  const match = wpConfig.match(/define\s*\(\s*['"]WPLANG['"]\s*,\s*['"]([\w_]+)['"]\s*\)/i);
  return match ? match[1] : null;
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

  const multisite = detectMultisite(cwd);
  const multilingual = detectMultilingualPlugin(cwd);
  const languages = detectLanguagePatterns(cwd);
  const hreflang = detectHreflang(cwd);
  const wplang = detectWplang(cwd);

  const detected = multisite.is_multisite || multilingual.detected || languages.detected_languages.length > 0;

  const report = {
    tool: "multilang_inspect",
    version: TOOL_VERSION,
    cwd,
    detected,
    is_multisite: multisite.is_multisite,
    site_count: multisite.site_count,
    multilingual_plugin: multilingual.plugin,
    detected_languages: languages.detected_languages,
    sites: languages.sites,
    has_hreflang: hreflang.detected,
    hreflang_sources: hreflang.sources,
    wplang: wplang,
    multilang_readiness: "unknown",
    recommendations: [],
  };

  // Assess readiness
  if (multisite.is_multisite && multilingual.detected && hreflang.detected && languages.detected_languages.length >= 2) {
    report.multilang_readiness = "high";
  } else if (multisite.is_multisite && (multilingual.detected || languages.detected_languages.length > 0)) {
    report.multilang_readiness = "medium";
  } else if (multisite.is_multisite) {
    report.multilang_readiness = "low";
  } else {
    report.multilang_readiness = "not_ready";
  }

  // Recommendations
  if (!multisite.is_multisite) {
    report.recommendations.push("WordPress Multisite is not enabled. Enable Multisite to create per-language sub-sites. See wp-multisite skill.");
  }
  if (multisite.is_multisite && !multilingual.detected) {
    report.recommendations.push("No multilingual plugin detected. Install WPML, Polylang, or MultilingualPress for translation management.");
  }
  if (multisite.is_multisite && languages.detected_languages.length === 0) {
    report.recommendations.push("No language-coded sub-sites detected. Create sub-sites with ISO 639-1 slugs (e.g., /it/, /de/, /fr/).");
  }
  if (multisite.is_multisite && !hreflang.detected) {
    report.recommendations.push("No hreflang tags detected. Install the hreflang mu-plugin or configure your multilingual plugin to generate hreflang.");
  }
  if (multisite.is_multisite && multisite.site_count <= 1) {
    report.recommendations.push("Only one site in the network. Create additional sub-sites for each target language.");
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(detected ? 0 : 1);
}

main();
