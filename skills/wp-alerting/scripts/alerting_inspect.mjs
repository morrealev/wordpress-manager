/**
 * alerting_inspect.mjs — Detect alerting configuration readiness.
 *
 * Checks WP_SITES_CONFIG for Slack and SendGrid credentials.
 * Scans for monitoring plugins and alerting infrastructure.
 *
 * Usage:
 *   node alerting_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — alerting configuration found
 *   1 — no alerting configuration found
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

function detectSlackConfig() {
  const slack = { configured: false, indicators: [] };
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return slack;

  let sites;
  try { sites = JSON.parse(raw); } catch { return slack; }
  if (!Array.isArray(sites)) return slack;

  for (const site of sites) {
    const label = site.id || site.url || 'unknown';
    if (site.slack_webhook_url) {
      slack.configured = true;
      slack.indicators.push(`slack_webhook_url configured for ${label}`);
    }
    if (site.slack_bot_token) {
      slack.configured = true;
      slack.indicators.push(`slack_bot_token configured for ${label}`);
    }
    if (site.slack_channel) {
      slack.indicators.push(`slack_channel: ${site.slack_channel} for ${label}`);
    }
  }
  return slack;
}

function detectSendGridConfig() {
  const sg = { configured: false, indicators: [] };
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return sg;

  let sites;
  try { sites = JSON.parse(raw); } catch { return sg; }
  if (!Array.isArray(sites)) return sg;

  for (const site of sites) {
    const label = site.id || site.url || 'unknown';
    if (site.sg_api_key) {
      sg.configured = true;
      sg.indicators.push(`sg_api_key configured for ${label}`);
    }
    if (site.sg_from_email) {
      sg.indicators.push(`sg_from_email: ${site.sg_from_email} for ${label}`);
    }
    if (site.sg_from_name) {
      sg.indicators.push(`sg_from_name: ${site.sg_from_name} for ${label}`);
    }
  }
  return sg;
}

function detectMonitoringSetup(cwd) {
  const monitoring = { plugins_found: false, cron_available: false, indicators: [] };

  // Check for monitoring-related plugins
  const pluginsDir = join(cwd, 'wp-content', 'plugins');
  const plugins = globDir(pluginsDir);

  const monitoringPlugins = [
    'query-monitor',
    'new-relic-reporting-for-wordpress',
    'jetpack',
    'developer',
    'wp-crontrol',
    'debug-bar',
    'health-check',
  ];

  for (const plugin of monitoringPlugins) {
    if (plugins.includes(plugin)) {
      monitoring.plugins_found = true;
      monitoring.indicators.push(`plugin: ${plugin}`);
    }
  }

  // Check for wp-cron.php availability
  const cronPath = join(cwd, 'wp-cron.php');
  if (existsSafe(cronPath)) {
    monitoring.cron_available = true;
    monitoring.indicators.push('wp-cron.php found');
  }

  return monitoring;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cwdArg = argv.find(a => a.startsWith('--cwd='));
  const cwd = cwdArg ? resolve(cwdArg.split('=')[1]) : process.cwd();

  const slack = detectSlackConfig();
  const sendgrid = detectSendGridConfig();
  const monitoring = detectMonitoringSetup(cwd);

  const anyConfigured = slack.configured || sendgrid.configured || monitoring.plugins_found || monitoring.cron_available;

  const report = {
    alerting_configured: anyConfigured,
    slack,
    sendgrid,
    monitoring,
    cwd,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(anyConfigured ? 0 : 1);
}

main();
