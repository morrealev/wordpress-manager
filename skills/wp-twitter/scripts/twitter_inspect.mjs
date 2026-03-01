/**
 * twitter_inspect.mjs — Detect Twitter/X configuration readiness.
 *
 * Checks WP_SITES_CONFIG for Twitter API credentials.
 *
 * Usage:
 *   node twitter_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — Twitter configuration found
 *   1 — no Twitter configuration found
 */

import { stdout, exit, argv } from 'node:process';
import { resolve } from 'node:path';

function detectTwitterConfig() {
  const tw = { configured: false, indicators: [] };
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return tw;

  let sites;
  try { sites = JSON.parse(raw); } catch { return tw; }
  if (!Array.isArray(sites)) return tw;

  for (const site of sites) {
    const label = site.id || site.url || 'unknown';
    if (site.twitter_bearer_token) {
      tw.configured = true;
      tw.indicators.push(`twitter_bearer_token configured for ${label}`);
    }
    if (site.twitter_api_key) {
      tw.indicators.push(`twitter_api_key configured for ${label}`);
    }
    if (site.twitter_user_id) {
      tw.indicators.push(`twitter_user_id: ${site.twitter_user_id} for ${label}`);
    }
  }
  return tw;
}

function main() {
  const cwdArg = argv.find(a => a.startsWith('--cwd='));
  const cwd = cwdArg ? resolve(cwdArg.split('=')[1]) : process.cwd();

  const twitter = detectTwitterConfig();

  const report = {
    twitter_configured: twitter.configured,
    twitter,
    cwd,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(twitter.configured ? 0 : 1);
}

main();
