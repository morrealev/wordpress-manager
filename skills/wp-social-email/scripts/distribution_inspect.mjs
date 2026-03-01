/**
 * distribution_inspect.mjs — Detect social/email distribution configuration.
 *
 * Checks WP_SITES_CONFIG for connector API keys, WordPress plugins,
 * and content readiness for distribution.
 *
 * Usage:
 *   node distribution_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — distribution configuration found
 *   1 — no distribution configuration found
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

function detectServices() {
  const services = {
    mailchimp: { configured: false, indicators: [] },
    buffer: { configured: false, indicators: [] },
    sendgrid: { configured: false, indicators: [] },
  };

  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return services;

  let sites;
  try { sites = JSON.parse(raw); } catch { return services; }
  if (!Array.isArray(sites)) return services;

  for (const site of sites) {
    const label = site.name || site.url || 'unknown';

    if (site.mailchimp_api_key) {
      services.mailchimp.configured = true;
      services.mailchimp.indicators.push(`mailchimp_api_key configured for ${label}`);
    }
    if (site.buffer_access_token) {
      services.buffer.configured = true;
      services.buffer.indicators.push(`buffer_access_token configured for ${label}`);
    }
    if (site.sendgrid_api_key) {
      services.sendgrid.configured = true;
      services.sendgrid.indicators.push(`sendgrid_api_key configured for ${label}`);
    }
  }

  return services;
}

function detectDistributionPlugins(cwd) {
  const indicators = [];
  const plugins = globDir(join(cwd, 'wp-content', 'plugins'));

  const distributionPlugins = [
    'mailchimp-for-wp', 'mc4wp',
    'jetpack',
    'social-warfare', 'monarch', 'shared-counts',
    'newsletter', 'email-subscribers',
  ];

  for (const plugin of plugins) {
    if (distributionPlugins.some(dp => plugin.toLowerCase().includes(dp))) {
      indicators.push(`distribution_plugin: ${plugin}`);
    }
  }

  return { found: indicators.length > 0, indicators };
}

function detectContentReadiness(cwd) {
  // Check wp-content directory exists
  if (!existsSafe(join(cwd, 'wp-content'))) return false;

  // Check for posts/content indicators
  const uploads = globDir(join(cwd, 'wp-content', 'uploads'));
  if (uploads.length > 0) return true;

  // Check for themes (site is set up)
  const themes = globDir(join(cwd, 'wp-content', 'themes'));
  if (themes.length > 0) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cwdArg = argv.find(a => a.startsWith('--cwd='));
  const cwd = cwdArg ? resolve(cwdArg.split('=')[1]) : process.cwd();

  const services = detectServices();
  const plugins = detectDistributionPlugins(cwd);
  const contentReady = detectContentReadiness(cwd);

  const hasServices = services.mailchimp.configured ||
                      services.buffer.configured ||
                      services.sendgrid.configured;
  const found = hasServices || plugins.found;

  const recommendations = [];

  if (services.mailchimp.configured) {
    recommendations.push('Mailchimp configured — use distribution_send skill to create and send email campaigns');
  }
  if (services.buffer.configured) {
    recommendations.push('Buffer configured — use distribution_send skill to schedule social media posts');
  }
  if (services.sendgrid.configured) {
    recommendations.push('SendGrid configured — use distribution_send skill for transactional and marketing emails');
  }
  if (plugins.found) {
    recommendations.push('Distribution plugins detected — check plugin settings for additional integration opportunities');
  }
  if (!found) {
    recommendations.push('No distribution configuration detected — use wp-social-email skill to set up Mailchimp, Buffer, or SendGrid');
  }
  if (!contentReady) {
    recommendations.push('No content detected — create posts before setting up distribution workflows');
  }
  if (found && contentReady) {
    recommendations.push('Distribution services and content are ready — consider scheduling an automated campaign');
  }

  const report = {
    tool: 'distribution_inspect',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cwd,
    found,
    services,
    plugins,
    content_ready: contentReady,
    recommendations,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(found ? 0 : 1);
}

main();
