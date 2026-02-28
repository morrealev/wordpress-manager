/**
 * webhook_inspect.mjs — Detect webhook configuration for WordPress projects.
 *
 * Scans for WooCommerce webhooks, mu-plugin webhooks, webhook plugins,
 * and wp-config.php webhook constants.
 *
 * Usage:
 *   node webhook_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — webhook configuration found
 *   1 — no webhook configuration found
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

function detectWooCommerceWebhooks(cwd) {
  const indicators = [];

  // Check for WooCommerce plugin
  const plugins = globDir(join(cwd, 'wp-content', 'plugins'));
  if (plugins.some(p => p.toLowerCase().includes('woocommerce'))) {
    indicators.push('woocommerce_installed');
  }

  return { found: indicators.length > 0, indicators };
}

function detectMuPluginWebhooks(cwd) {
  const indicators = [];

  const muPlugins = globDir(join(cwd, 'wp-content', 'mu-plugins'));
  for (const file of muPlugins) {
    if (!file.endsWith('.php')) continue;
    const content = readFileSafe(join(cwd, 'wp-content', 'mu-plugins', file));
    if (!content) continue;

    if (/wp_remote_post/i.test(content) && /webhook|hook|notify|propagat/i.test(content)) {
      indicators.push(`mu_plugin_webhook: ${file}`);
    }
    if (/HEADLESS_WEBHOOK_URL|WEBHOOK_URL/i.test(content)) {
      indicators.push(`mu_plugin_webhook_constant: ${file}`);
    }
  }

  return { found: indicators.length > 0, indicators };
}

function detectWebhookPlugins(cwd) {
  const indicators = [];
  const plugins = globDir(join(cwd, 'wp-content', 'plugins'));
  const webhookPlugins = [
    'wp-webhooks', 'zapier', 'uncanny-automator', 'automator',
    'wp-fusion', 'webhook', 'notification', 'hookpress',
  ];

  for (const plugin of plugins) {
    if (webhookPlugins.some(wp => plugin.toLowerCase().includes(wp))) {
      indicators.push(`webhook_plugin: ${plugin}`);
    }
  }

  return { found: indicators.length > 0, indicators };
}

function detectWebhookConstants(cwd) {
  const indicators = [];

  const wpConfig = readFileSafe(join(cwd, 'wp-config.php'));
  if (wpConfig) {
    if (/WEBHOOK_URL/i.test(wpConfig)) {
      indicators.push('webhook_url_constant');
    }
    if (/WEBHOOK_SECRET/i.test(wpConfig)) {
      indicators.push('webhook_secret_constant');
    }
    if (/HEADLESS_WEBHOOK_URL/i.test(wpConfig)) {
      indicators.push('headless_webhook_url');
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

  const wcWebhooks = detectWooCommerceWebhooks(cwd);
  const muPluginWebhooks = detectMuPluginWebhooks(cwd);
  const webhookPlugins = detectWebhookPlugins(cwd);
  const webhookConstants = detectWebhookConstants(cwd);

  const hasWebhooks = wcWebhooks.found || muPluginWebhooks.found ||
                      webhookPlugins.found || webhookConstants.found;

  const recommendations = [];

  if (wcWebhooks.found) {
    recommendations.push('WooCommerce detected — use wc_list_webhooks / wc_create_webhook MCP tools for webhook management');
  }
  if (muPluginWebhooks.found) {
    recommendations.push('mu-plugin webhooks detected — review delivery URLs and secrets for security');
  }
  if (!hasWebhooks) {
    recommendations.push('No webhook configuration detected — use wp-webhooks skill to set up outbound notifications');
  }
  if (webhookConstants.found && !webhookConstants.indicators.includes('webhook_secret_constant')) {
    recommendations.push('Webhook URL configured but no secret found — add WEBHOOK_SECRET to wp-config.php for signature verification');
  }

  const report = {
    tool: 'webhook_inspect',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cwd,
    found: hasWebhooks,
    areas: {
      wc_webhooks: wcWebhooks,
      mu_plugin_webhooks: muPluginWebhooks,
      webhook_plugins: webhookPlugins,
      webhook_constants: webhookConstants,
    },
    recommendations,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(hasWebhooks ? 0 : 1);
}

main();
