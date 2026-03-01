/**
 * analytics_inspect.mjs — Detect analytics configuration readiness.
 *
 * Checks WP_SITES_CONFIG for GA4, Plausible, and Google API key credentials.
 * Scans for analytics plugins and tracking code.
 *
 * Usage:
 *   node analytics_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — analytics configuration found
 *   1 — no analytics configuration found
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { argv, stdout, exit } from 'node:process';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFileSafe(filePath) {
  try { return readFileSync(filePath, 'utf-8'); } catch { return null; }
}

function existsSafe(filePath) {
  try { return existsSync(filePath); } catch { return false; }
}

function globDir(dirPath) {
  try { return readdirSync(dirPath); } catch { return []; }
}

// ---------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------

function detectGA4Config() {
  const ga4 = { configured: false, indicators: [] };
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return ga4;

  let sites;
  try { sites = JSON.parse(raw); } catch { return ga4; }
  if (!Array.isArray(sites)) return ga4;

  for (const site of sites) {
    const label = site.id || site.url || 'unknown';
    if (site.ga4_property_id) {
      ga4.configured = true;
      ga4.indicators.push(`ga4_property_id configured for ${label}`);
    }
    if (site.ga4_service_account_key) {
      ga4.indicators.push(`ga4_service_account_key configured for ${label}`);
    }
  }
  return ga4;
}

function detectPlausibleConfig() {
  const pl = { configured: false, indicators: [] };
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return pl;

  let sites;
  try { sites = JSON.parse(raw); } catch { return pl; }
  if (!Array.isArray(sites)) return pl;

  for (const site of sites) {
    const label = site.id || site.url || 'unknown';
    if (site.plausible_api_key) {
      pl.configured = true;
      pl.indicators.push(`plausible_api_key configured for ${label}`);
    }
    if (site.plausible_base_url) {
      pl.indicators.push(`plausible_base_url: ${site.plausible_base_url}`);
    }
  }
  return pl;
}

function detectGoogleApiKey() {
  const cwv = { configured: false, indicators: [] };
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return cwv;

  let sites;
  try { sites = JSON.parse(raw); } catch { return cwv; }
  if (!Array.isArray(sites)) return cwv;

  for (const site of sites) {
    const label = site.id || site.url || 'unknown';
    if (site.google_api_key) {
      cwv.configured = true;
      cwv.indicators.push(`google_api_key configured for ${label}`);
    }
  }
  return cwv;
}

function detectAnalyticsPlugins(cwd) {
  const indicators = [];
  const pluginsDir = join(cwd, 'wp-content', 'plugins');
  const plugins = globDir(pluginsDir);

  const analyticsPlugins = [
    'google-analytics-for-wordpress',
    'google-site-kit',
    'wp-google-analytics-events',
    'plausible-analytics',
    'koko-analytics',
    'matomo',
    'independent-analytics',
  ];

  for (const plugin of analyticsPlugins) {
    if (plugins.includes(plugin)) {
      indicators.push(`plugin: ${plugin}`);
    }
  }
  return { found: indicators.length > 0, indicators };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cwdArg = argv.find(a => a.startsWith('--cwd='));
  const cwd = cwdArg ? resolve(cwdArg.split('=')[1]) : process.cwd();

  const ga4 = detectGA4Config();
  const plausible = detectPlausibleConfig();
  const googleApiKey = detectGoogleApiKey();
  const plugins = detectAnalyticsPlugins(cwd);

  const anyConfigured = ga4.configured || plausible.configured || googleApiKey.configured || plugins.found;

  const report = {
    analytics_configured: anyConfigured,
    ga4: ga4,
    plausible: plausible,
    google_api_key: googleApiKey,
    analytics_plugins: plugins,
    cwd,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(anyConfigured ? 0 : 1);
}

main();
