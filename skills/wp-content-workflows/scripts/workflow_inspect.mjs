/**
 * workflow_inspect.mjs — Detect workflow automation configuration readiness.
 *
 * Checks WP_SITES_CONFIG for Slack/SendGrid/Mailchimp credentials.
 * Scans for automation plugins, custom REST endpoints, WP-Cron config,
 * and webhook setup.
 *
 * Usage:
 *   node workflow_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — workflow configuration found
 *   1 — no workflow configuration found
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

function detectActionChannelConfig() {
  const channels = { configured: false, indicators: [], missing: [] };
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) { channels.missing.push('WP_SITES_CONFIG env var not set'); return channels; }

  let sites;
  try { sites = JSON.parse(raw); } catch { channels.missing.push('WP_SITES_CONFIG is not valid JSON'); return channels; }
  if (!Array.isArray(sites)) { channels.missing.push('WP_SITES_CONFIG is not an array'); return channels; }

  const keys = ['slack_webhook_url', 'slack_bot_token', 'sendgrid_api_key', 'mailchimp_api_key'];

  for (const site of sites) {
    const label = site.id || site.url || 'unknown';
    for (const key of keys) {
      if (site[key]) {
        channels.configured = true;
        channels.indicators.push(`${key} configured for ${label}`);
      } else {
        channels.missing.push(`${key} not set for ${label}`);
      }
    }
  }
  return channels;
}

function detectAutomationPlugins(cwd) {
  const result = { found: false, indicators: [], recommendations: [] };
  const pluginsDir = join(cwd, 'wp-content', 'plugins');
  const plugins = globDir(pluginsDir);

  const automationPlugins = [
    'automatewoo',
    'wp-fusion',
    'fluent-crm',
    'suretriggers',
    'wp-crontrol',
    'advanced-cron-manager',
    'advanced-cron-manager-pro',
  ];

  for (const plugin of automationPlugins) {
    if (plugins.includes(plugin)) {
      result.found = true;
      result.indicators.push(`plugin: ${plugin}`);
    }
  }

  if (!result.found) {
    result.recommendations.push('Install wp-crontrol for cron event management');
    result.recommendations.push('Consider FluentCRM or AutomateWoo for advanced workflows');
  }
  return result;
}

function detectCustomRestEndpoints(cwd) {
  const rest = { found: false, indicators: [] };

  // Look for wp-manager workflow namespace in plugin/theme files
  const muPluginsDir = join(cwd, 'wp-content', 'mu-plugins');
  const pluginsDir = join(cwd, 'wp-content', 'plugins');
  const themeDir = join(cwd, 'wp-content', 'themes');

  const searchDirs = [muPluginsDir, pluginsDir, themeDir];
  const pattern = /register_rest_route\s*\(\s*['"]wp-manager\/v1\/workflows['"]/;

  for (const dir of searchDirs) {
    const files = globDir(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      if (file.endsWith('.php')) {
        const content = readFileSafe(filePath);
        if (content && pattern.test(content)) {
          rest.found = true;
          rest.indicators.push(`REST endpoint in ${filePath}`);
        }
      }
    }
  }
  return rest;
}

function detectWpCronConfig(cwd) {
  const cron = { disabled: false, alternate: false, indicators: [], recommendations: [] };

  const wpConfig = readFileSafe(join(cwd, 'wp-config.php'));
  if (!wpConfig) {
    cron.recommendations.push('wp-config.php not found — cannot check cron config');
    return cron;
  }

  if (/define\s*\(\s*['"]DISABLE_WP_CRON['"]\s*,\s*true\s*\)/i.test(wpConfig)) {
    cron.disabled = true;
    cron.indicators.push('DISABLE_WP_CRON is true — server-side cron expected');
  }
  if (/define\s*\(\s*['"]ALTERNATE_WP_CRON['"]\s*,\s*true\s*\)/i.test(wpConfig)) {
    cron.alternate = true;
    cron.indicators.push('ALTERNATE_WP_CRON is true — redirect-based cron active');
  }

  const cronPath = join(cwd, 'wp-cron.php');
  if (existsSafe(cronPath)) {
    cron.indicators.push('wp-cron.php found');
  }

  if (cron.disabled) {
    cron.recommendations.push('Ensure server cron job calls wp-cron.php for scheduled triggers');
  }
  return cron;
}

function detectWebhookConfig() {
  const webhooks = { configured: false, indicators: [] };
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return webhooks;

  let sites;
  try { sites = JSON.parse(raw); } catch { return webhooks; }
  if (!Array.isArray(sites)) return webhooks;

  for (const site of sites) {
    const label = site.id || site.url || 'unknown';
    if (site.wc_webhook_secret || site.webhook_secret) {
      webhooks.configured = true;
      webhooks.indicators.push(`webhook secret configured for ${label}`);
    }
    if (site.url) {
      webhooks.indicators.push(`site URL available for ${label} — wc-webhooks tools can be used`);
    }
  }
  return webhooks;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cwdArg = argv.find(a => a.startsWith('--cwd='));
  const cwd = cwdArg ? resolve(cwdArg.split('=')[1]) : process.cwd();

  const channels = detectActionChannelConfig();
  const plugins = detectAutomationPlugins(cwd);
  const rest = detectCustomRestEndpoints(cwd);
  const cron = detectWpCronConfig(cwd);
  const webhooks = detectWebhookConfig();

  const anyConfigured = channels.configured || plugins.found || rest.found || webhooks.configured || cron.indicators.length > 0;

  const report = {
    workflow_configured: anyConfigured,
    action_channels: channels,
    automation_plugins: plugins,
    custom_rest_endpoints: rest,
    wp_cron: cron,
    webhooks,
    cwd,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(anyConfigured ? 0 : 1);
}

main();
