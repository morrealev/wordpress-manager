/**
 * multisite_inspect.mjs — Detect WordPress Multisite configuration.
 *
 * Scans for multisite indicators: wp-config.php constants, WP_SITES_CONFIG flags,
 * sunrise.php (domain mapping), .htaccess multisite rewrite rules.
 *
 * Usage:
 *   node multisite_inspect.mjs [--cwd=/path/to/check]
 *
 * Exit codes:
 *   0 — multisite indicators found
 *   1 — no multisite indicators found
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { argv, env, stdout, exit } from 'node:process';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFileSafe(filePath) {
  try { return readFileSync(filePath, 'utf-8'); } catch { return null; }
}

function existsSafe(filePath) {
  try { return existsSync(filePath); } catch { return false; }
}

// ---------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------

function detectWpConfig(cwd) {
  const paths = [
    join(cwd, 'wp-config.php'),
    join(cwd, '../wp-config.php'),  // wp-config one level up (common setup)
  ];

  for (const p of paths) {
    const content = readFileSafe(p);
    if (!content) continue;

    const multisite = /define\s*\(\s*['"]MULTISITE['"]\s*,\s*true\s*\)/i.test(content);
    const subdomain = content.match(/define\s*\(\s*['"]SUBDOMAIN_INSTALL['"]\s*,\s*(true|false)\s*\)/i);
    const domain = content.match(/define\s*\(\s*['"]DOMAIN_CURRENT_SITE['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);
    const pathMatch = content.match(/define\s*\(\s*['"]PATH_CURRENT_SITE['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);

    if (multisite) {
      return {
        found: true,
        path: p,
        subdomain_install: subdomain ? subdomain[1] === 'true' : null,
        domain_current_site: domain ? domain[1] : null,
        path_current_site: pathMatch ? pathMatch[1] : null,
      };
    }
  }
  return null;
}

function detectSitesConfig() {
  const sitesJson = env.WP_SITES_CONFIG;
  if (!sitesJson) return null;
  try {
    const sites = JSON.parse(sitesJson);
    const msSites = sites.filter(s => s.is_multisite === true);
    const cliSites = sites.filter(s => s.wp_path);
    return {
      multisite_sites: msSites.map(s => ({
        id: s.id,
        wp_path: s.wp_path || null,
        ssh_host: s.ssh_host || null,
        has_wpcli: !!s.wp_path,
      })),
      cli_ready_sites: cliSites.map(s => s.id),
      count: msSites.length,
    };
  } catch { return null; }
}

function detectSunrise(cwd) {
  const paths = [
    join(cwd, 'wp-content/sunrise.php'),
    join(cwd, 'sunrise.php'),
  ];
  for (const p of paths) {
    if (existsSafe(p)) {
      return { found: true, path: p };
    }
  }
  return null;
}

function detectHtaccessMultisite(cwd) {
  const content = readFileSafe(join(cwd, '.htaccess'));
  if (!content) return null;

  // WordPress multisite .htaccess has specific rewrite rules
  const hasMultisiteRules = /RewriteRule\s+\.\s+index\.php/i.test(content) &&
    (/upload/.test(content) || /files/.test(content) || /blogs\.dir/.test(content));

  return hasMultisiteRules ? { found: true } : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cwdArg = argv.find(a => a.startsWith('--cwd='));
  const cwd = cwdArg ? resolve(cwdArg.split('=')[1]) : process.cwd();

  const wpConfig = detectWpConfig(cwd);
  const sitesConfig = detectSitesConfig();
  const sunrise = detectSunrise(cwd);
  const htaccess = detectHtaccessMultisite(cwd);

  const signals = [];
  if (wpConfig) signals.push('wp_config_multisite');
  if (sitesConfig?.count > 0) signals.push('sites_config_multisite');
  if (sunrise) signals.push('sunrise_domain_mapping');
  if (htaccess) signals.push('htaccess_multisite_rules');

  const report = {
    tool: 'multisite_inspect',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cwd,
    found: signals.length > 0,
    signals,
    details: {
      wp_config: wpConfig || undefined,
      sites_config: sitesConfig || undefined,
      sunrise: sunrise || undefined,
      htaccess: htaccess || undefined,
    },
    recommendations: [],
  };

  if (wpConfig && !sitesConfig?.count) {
    report.recommendations.push('Multisite detected in wp-config.php but no site in WP_SITES_CONFIG has is_multisite: true');
  }
  if (sitesConfig?.count > 0) {
    const noCli = sitesConfig.multisite_sites.filter(s => !s.has_wpcli);
    if (noCli.length > 0) {
      report.recommendations.push(`Sites without wp_path (no wp-cli access): ${noCli.map(s => s.id).join(', ')}`);
    }
    report.recommendations.push(`${sitesConfig.count} multisite network(s) configured — 10 ms_* tools available`);
  }
  if (sunrise) {
    report.recommendations.push('sunrise.php detected — domain mapping is active');
  }

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(signals.length > 0 ? 0 : 1);
}

main();
