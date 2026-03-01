/**
 * linkedin_inspect.mjs — Detect LinkedIn configuration readiness.
 *
 * Checks WP_SITES_CONFIG for LinkedIn credentials.
 *
 * Usage:
 *   node linkedin_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — LinkedIn configuration found
 *   1 — no LinkedIn configuration found
 */

import { stdout, exit, argv } from 'node:process';
import { resolve } from 'node:path';

function detectLinkedInConfig() {
  const li = { configured: false, indicators: [] };
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return li;

  let sites;
  try { sites = JSON.parse(raw); } catch { return li; }
  if (!Array.isArray(sites)) return li;

  for (const site of sites) {
    const label = site.id || site.url || 'unknown';
    if (site.linkedin_access_token) {
      li.configured = true;
      li.indicators.push(`linkedin_access_token configured for ${label}`);
    }
    if (site.linkedin_person_urn) {
      li.indicators.push(`linkedin_person_urn: ${site.linkedin_person_urn} for ${label}`);
    }
  }
  return li;
}

function main() {
  const cwdArg = argv.find(a => a.startsWith('--cwd='));
  const cwd = cwdArg ? resolve(cwdArg.split('=')[1]) : process.cwd();

  const linkedin = detectLinkedInConfig();

  const report = {
    linkedin_configured: linkedin.configured,
    linkedin,
    cwd,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(linkedin.configured ? 0 : 1);
}

main();
