/**
 * woocommerce_inspect.mjs — Detect WooCommerce presence and configuration.
 *
 * Scans project files for WooCommerce indicators (plugin files, hooks, composer deps)
 * and checks WP_SITES_CONFIG for WC credentials.
 *
 * Usage:
 *   node woocommerce_inspect.mjs [--cwd=/path/to/check]
 *
 * Exit codes:
 *   0 — WooCommerce indicators found
 *   1 — no WooCommerce indicators found
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { argv, env, stdout, exit } from 'node:process';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFileSafe(filePath) {
  try { return readFileSync(filePath, 'utf-8'); } catch { return null; }
}

function readJsonSafe(filePath) {
  const raw = readFileSafe(filePath);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function existsSafe(filePath) {
  try { return existsSync(filePath); } catch { return false; }
}

function findFiles(dir, pattern, maxDepth = 3, depth = 0) {
  const results = [];
  if (depth > maxDepth) return results;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'vendor') {
        results.push(...findFiles(full, pattern, maxDepth, depth + 1));
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(full);
      }
    }
  } catch { /* permission denied, etc. */ }
  return results;
}

// ---------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------

function detectWcPlugin(cwd) {
  // Check for WooCommerce plugin directory
  const wcPaths = [
    join(cwd, 'wp-content/plugins/woocommerce/woocommerce.php'),
    join(cwd, 'plugins/woocommerce/woocommerce.php'),
    join(cwd, 'woocommerce.php'),
  ];
  for (const p of wcPaths) {
    if (existsSafe(p)) {
      const content = readFileSafe(p);
      const versionMatch = content?.match(/\*\s*Version:\s*(.+)/i);
      return { found: true, path: p, version: versionMatch?.[1]?.trim() || 'unknown' };
    }
  }
  return null;
}

function detectComposerDeps(cwd) {
  const composer = readJsonSafe(join(cwd, 'composer.json'));
  if (!composer) return null;
  const allDeps = { ...composer.require, ...composer['require-dev'] };
  const wcDeps = Object.keys(allDeps).filter(k => k.includes('woocommerce'));
  return wcDeps.length > 0 ? { deps: wcDeps } : null;
}

function detectWcHooks(cwd) {
  const phpFiles = findFiles(cwd, /\.php$/, 3);
  const hooks = { actions: new Set(), filters: new Set() };
  for (const f of phpFiles.slice(0, 100)) {
    const content = readFileSafe(f);
    if (!content) continue;
    const actionMatches = content.matchAll(/add_action\(\s*['"]([^'"]*woocommerce[^'"]*)['"]/gi);
    for (const m of actionMatches) hooks.actions.add(m[1]);
    const filterMatches = content.matchAll(/add_filter\(\s*['"]([^'"]*woocommerce[^'"]*)['"]/gi);
    for (const m of filterMatches) hooks.filters.add(m[1]);
    const wcFuncMatches = content.matchAll(/\b(wc_get_[a-z_]+|WC\(\))/g);
    for (const m of wcFuncMatches) hooks.actions.add(m[1]);
  }
  return (hooks.actions.size + hooks.filters.size) > 0
    ? { actions: [...hooks.actions].slice(0, 20), filters: [...hooks.filters].slice(0, 20) }
    : null;
}

function detectTemplateOverrides(cwd) {
  const themePaths = [
    join(cwd, 'woocommerce'),
    join(cwd, 'templates/woocommerce'),
    join(cwd, 'theme/woocommerce'),
  ];
  for (const p of themePaths) {
    if (existsSafe(p)) {
      try {
        const files = findFiles(p, /\.php$/, 2);
        return { path: p, templateCount: files.length };
      } catch { /* skip */ }
    }
  }
  return null;
}

function detectWcConfig() {
  const sitesJson = env.WP_SITES_CONFIG;
  if (!sitesJson) return null;
  try {
    const sites = JSON.parse(sitesJson);
    const wcSites = sites.filter(s => s.wc_consumer_key && s.wc_consumer_secret);
    return wcSites.length > 0
      ? { configured_sites: wcSites.map(s => s.id), count: wcSites.length }
      : null;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cwdArg = argv.find(a => a.startsWith('--cwd='));
  const cwd = cwdArg ? resolve(cwdArg.split('=')[1]) : process.cwd();

  const plugin = detectWcPlugin(cwd);
  const composer = detectComposerDeps(cwd);
  const hooks = detectWcHooks(cwd);
  const templates = detectTemplateOverrides(cwd);
  const config = detectWcConfig();

  const signals = [];
  if (plugin) signals.push('woocommerce_plugin');
  if (composer) signals.push('composer_dependency');
  if (hooks) signals.push('wc_hooks_usage');
  if (templates) signals.push('template_overrides');
  if (config) signals.push('wc_api_configured');

  const report = {
    tool: 'woocommerce_inspect',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cwd,
    found: signals.length > 0,
    signals,
    details: {
      plugin: plugin || undefined,
      composer: composer || undefined,
      hooks: hooks || undefined,
      templates: templates || undefined,
      api_config: config || undefined,
    },
    recommendations: [],
  };

  if (!config && signals.length > 0) {
    report.recommendations.push('Add wc_consumer_key and wc_consumer_secret to WP_SITES_CONFIG for API access');
  }
  if (plugin) {
    report.recommendations.push(`WooCommerce ${plugin.version} detected — all 30 WC tools available`);
  }
  if (hooks && !plugin) {
    report.recommendations.push('WooCommerce hooks detected but plugin not found locally — this may be a WC extension');
  }

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(signals.length > 0 ? 0 : 1);
}

main();
