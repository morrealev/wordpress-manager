/**
 * search_console_inspect.mjs — Detect Google Search Console configuration readiness.
 *
 * Checks WP_SITES_CONFIG for GSC credentials, sitemaps, robots.txt,
 * and SEO plugin presence.
 *
 * Usage:
 *   node search_console_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — GSC or SEO configuration found
 *   1 — no GSC or SEO configuration found
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

function detectGSCConfig() {
  const gsc = { configured: false, indicators: [] };

  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return gsc;

  let sites;
  try { sites = JSON.parse(raw); } catch { return gsc; }
  if (!Array.isArray(sites)) return gsc;

  for (const site of sites) {
    const label = site.name || site.url || 'unknown';

    if (site.gsc_service_account_key) {
      gsc.configured = true;
      gsc.indicators.push(`gsc_service_account_key configured for ${label}`);
    }
    if (site.gsc_site_url) {
      gsc.configured = true;
      gsc.indicators.push(`gsc_site_url configured for ${label}`);
    }
  }

  return gsc;
}

function detectSitemaps(cwd) {
  const indicators = [];
  const sitemapPaths = [
    'sitemap.xml',
    'sitemap_index.xml',
    'wp-sitemap.xml',
  ];

  for (const sitemapFile of sitemapPaths) {
    if (existsSafe(join(cwd, sitemapFile))) {
      indicators.push(`sitemap: ${sitemapFile}`);
    }
  }

  return { found: indicators.length > 0, indicators };
}

function detectRobotsTxt(cwd) {
  const indicators = [];
  const robotsPath = join(cwd, 'robots.txt');

  if (!existsSafe(robotsPath)) {
    return { found: false, indicators };
  }

  indicators.push('robots.txt exists');

  const content = readFileSafe(robotsPath);
  if (content) {
    const lower = content.toLowerCase();
    if (lower.includes('sitemap:') || lower.includes('sitemap_index')) {
      indicators.push('robots.txt references sitemap');
    }
  }

  return { found: true, indicators };
}

function detectSEOPlugins(cwd) {
  const indicators = [];
  const plugins = globDir(join(cwd, 'wp-content', 'plugins'));

  const seoPlugins = [
    { dir: 'wordpress-seo', name: 'Yoast SEO' },
    { dir: 'seo-by-rank-math', name: 'RankMath' },
    { dir: 'all-in-one-seo-pack', name: 'AIOSEO' },
  ];

  for (const plugin of plugins) {
    const pluginLower = plugin.toLowerCase();
    for (const seo of seoPlugins) {
      if (pluginLower.includes(seo.dir)) {
        indicators.push(`seo_plugin: ${seo.name} (${plugin})`);
      }
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

  const gsc = detectGSCConfig();
  const sitemaps = detectSitemaps(cwd);
  const robots_txt = detectRobotsTxt(cwd);
  const seo_plugins = detectSEOPlugins(cwd);

  const found = gsc.configured || sitemaps.found || robots_txt.found || seo_plugins.found;

  const recommendations = [];

  if (gsc.configured) {
    recommendations.push('GSC configured — use wp-search-console skill to track keyword rankings and indexing');
  }
  if (sitemaps.found) {
    recommendations.push('Sitemap detected — GSC can be configured to monitor indexing coverage');
  }
  if (seo_plugins.found) {
    recommendations.push('SEO plugin detected — integrate with GSC for keyword-to-content feedback loop');
  }
  if (robots_txt.found && robots_txt.indicators.some(i => i.includes('references sitemap'))) {
    recommendations.push('Sitemap reference found in robots.txt — good for GSC crawling');
  }
  if (!found) {
    recommendations.push('No GSC or SEO configuration detected — use wp-search-console skill to set up Google Search Console');
  }
  if (gsc.configured && sitemaps.found && seo_plugins.found) {
    recommendations.push('Full SEO stack ready — use wp-search-console for keyword tracking and content optimization');
  }

  const report = {
    tool: 'search_console_inspect',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cwd,
    found,
    gsc,
    sitemaps,
    robots_txt,
    seo_plugins,
    recommendations,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(found ? 0 : 1);
}

main();
