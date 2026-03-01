/**
 * content_optimization_inspect.mjs — Detect content optimization readiness.
 *
 * Checks WordPress content volume, content age distribution, SEO plugins,
 * readability plugins, GSC availability, and WooCommerce presence.
 *
 * Usage:
 *   node content_optimization_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — content optimization readiness found
 *   1 — no content optimization readiness found
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

function detectContent(cwd) {
  const indicators = [];

  // Check wp-content directory exists
  if (!existsSafe(join(cwd, 'wp-content'))) {
    return { has_content: false, indicators };
  }

  indicators.push('wp-content directory exists');

  // Check for uploads (indicator of content)
  const uploads = globDir(join(cwd, 'wp-content', 'uploads'));
  if (uploads.length > 0) {
    indicators.push(`wp-content/uploads contains ${uploads.length} entries`);
  }

  // Check for themes presence
  const themes = globDir(join(cwd, 'wp-content', 'themes'));
  if (themes.length > 0) {
    indicators.push(`${themes.length} theme(s) installed`);
  }

  const hasContent = uploads.length > 0 || themes.length > 0;
  return { has_content: hasContent, indicators };
}

function detectContentAge(cwd) {
  const indicators = [];
  const yearsFound = [];

  const uploadsPath = join(cwd, 'wp-content', 'uploads');
  if (!existsSafe(uploadsPath)) {
    return { years_found: yearsFound, indicators };
  }

  const entries = globDir(uploadsPath);
  const yearPattern = /^(20\d{2})$/;

  for (const entry of entries) {
    const match = entry.match(yearPattern);
    if (match) {
      yearsFound.push(parseInt(match[1], 10));
      indicators.push(`upload directory found for year ${match[1]}`);
    }
  }

  yearsFound.sort();

  if (yearsFound.length > 1) {
    indicators.push(`content spans ${yearsFound.length} years (${yearsFound[0]}–${yearsFound[yearsFound.length - 1]})`);
  }

  return { years_found: yearsFound, indicators };
}

function detectSeoPlugins(cwd) {
  const indicators = [];
  const plugins = globDir(join(cwd, 'wp-content', 'plugins'));

  const seoPlugins = [
    { dir: 'wordpress-seo', name: 'Yoast SEO' },
    { dir: 'seo-by-rank-math', name: 'RankMath' },
    { dir: 'all-in-one-seo-pack', name: 'AIOSEO' },
  ];

  for (const plugin of plugins) {
    const lower = plugin.toLowerCase();
    for (const seo of seoPlugins) {
      if (lower === seo.dir) {
        indicators.push(`seo_plugin: ${seo.name} (${plugin})`);
      }
    }
  }

  return { found: indicators.length > 0, indicators };
}

function detectReadability(cwd) {
  const indicators = [];
  const plugins = globDir(join(cwd, 'wp-content', 'plugins'));

  // Yoast and RankMath both include readability analysis
  const readabilityPlugins = [
    { dir: 'wordpress-seo', name: 'Yoast SEO (readability analysis)' },
    { dir: 'seo-by-rank-math', name: 'RankMath (readability analysis)' },
  ];

  for (const plugin of plugins) {
    const lower = plugin.toLowerCase();
    for (const rp of readabilityPlugins) {
      if (lower === rp.dir) {
        indicators.push(`readability_plugin: ${rp.name}`);
      }
    }
  }

  return { found: indicators.length > 0, indicators };
}

function detectGsc() {
  const indicators = [];
  let configured = false;

  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return { configured, indicators };

  let sites;
  try { sites = JSON.parse(raw); } catch { return { configured, indicators }; }
  if (!Array.isArray(sites)) return { configured, indicators };

  for (const site of sites) {
    const label = site.name || site.url || 'unknown';
    if (site.gsc_service_account_key) {
      configured = true;
      indicators.push(`gsc_service_account_key configured for ${label}`);
    }
  }

  return { configured, indicators };
}

function detectWoocommerce(cwd) {
  const indicators = [];
  const plugins = globDir(join(cwd, 'wp-content', 'plugins'));

  for (const plugin of plugins) {
    if (plugin.toLowerCase() === 'woocommerce') {
      indicators.push(`woocommerce plugin detected (${plugin})`);
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

  const content = detectContent(cwd);
  const contentAge = detectContentAge(cwd);
  const seoPlugins = detectSeoPlugins(cwd);
  const readability = detectReadability(cwd);
  const gscAvailable = detectGsc();
  const woocommerce = detectWoocommerce(cwd);

  const found = content.has_content &&
                (seoPlugins.found || readability.found || gscAvailable.configured);

  const recommendations = [];

  if (content.has_content) {
    recommendations.push('Content detected — ready for AI-driven optimization analysis');
  }
  if (seoPlugins.found) {
    recommendations.push('SEO plugin detected — headline and meta description optimization can use plugin data');
  }
  if (readability.found) {
    recommendations.push('Readability analysis available — use wp-content-optimization for Flesch-Kincaid scoring');
  }
  if (gscAvailable.configured) {
    recommendations.push('GSC configured — combine search data with content optimization for data-driven improvements');
  }
  if (woocommerce.found) {
    recommendations.push('WooCommerce detected — prioritize optimization of high-revenue content');
  }
  if (contentAge.years_found.length > 1) {
    recommendations.push('Content spans multiple years — run Content Freshness Audit to identify stale content');
  }
  if (!content.has_content && !seoPlugins.found && !readability.found && !gscAvailable.configured) {
    recommendations.push('No content or optimization tools detected — create content first, then use wp-content-optimization');
  }
  if (content.has_content && seoPlugins.found && gscAvailable.configured) {
    recommendations.push('Full optimization stack ready — use wp-content-optimization for comprehensive content triage');
  }

  const report = {
    tool: 'content_optimization_inspect',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cwd,
    found,
    content,
    content_age: contentAge,
    seo_plugins: seoPlugins,
    readability,
    gsc_available: gscAvailable,
    woocommerce,
    recommendations,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(found ? 0 : 1);
}

main();
