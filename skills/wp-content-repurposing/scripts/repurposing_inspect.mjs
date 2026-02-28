/**
 * repurposing_inspect.mjs — Detect content repurposing readiness for WordPress projects.
 *
 * Scans for existing content volume, social media plugins, and email marketing
 * integrations to assess repurposing potential.
 *
 * Usage:
 *   node repurposing_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — repurposing-relevant configuration found
 *   1 — no relevant configuration found
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

function detectSocialPlugins(cwd) {
  const indicators = [];
  const plugins = globDir(join(cwd, 'wp-content', 'plugins'));
  const socialPlugins = [
    'jetpack', 'blog2social', 'social-auto-poster', 'nextscripts-social',
    'revive-old-posts', 'social-warfare', 'monarch', 'shareaholic',
    'add-to-any', 'social-snap', 'novashare',
  ];

  for (const plugin of plugins) {
    if (socialPlugins.some(sp => plugin.toLowerCase().includes(sp))) {
      indicators.push(`social_plugin: ${plugin}`);
    }
  }

  return { found: indicators.length > 0, indicators };
}

function detectEmailPlugins(cwd) {
  const indicators = [];
  const plugins = globDir(join(cwd, 'wp-content', 'plugins'));
  const emailPlugins = [
    'mailchimp', 'newsletter', 'mailpoet', 'convertkit', 'sendinblue',
    'brevo', 'constant-contact', 'hubspot', 'activecampaign', 'fluentcrm',
  ];

  for (const plugin of plugins) {
    if (emailPlugins.some(ep => plugin.toLowerCase().includes(ep))) {
      indicators.push(`email_plugin: ${plugin}`);
    }
  }

  return { found: indicators.length > 0, indicators };
}

function detectContentVolume(cwd) {
  const indicators = [];

  // Check for wp-content/themes (WordPress presence indicator)
  if (existsSafe(join(cwd, 'wp-content', 'themes'))) {
    indicators.push('wordpress_detected');
  }

  // Check for XML export files (content volume indicator)
  const rootFiles = globDir(cwd);
  for (const file of rootFiles) {
    if (/\.xml$/i.test(file) && /export|wordpress/i.test(file)) {
      indicators.push(`xml_export: ${file}`);
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

  const social = detectSocialPlugins(cwd);
  const email = detectEmailPlugins(cwd);
  const content = detectContentVolume(cwd);

  const hasRelevantSetup = social.found || email.found || content.found;

  const recommendations = [];

  if (!social.found) {
    recommendations.push('No social media plugins detected — consider Blog2Social or Jetpack Social for automated sharing');
  }
  if (!email.found) {
    recommendations.push('No email marketing plugins detected — consider MailPoet or FluentCRM for newsletter integration');
  }
  if (content.found) {
    recommendations.push('WordPress content detected — use wp-content-strategist agent to select and repurpose existing content');
  }
  if (social.found && email.found) {
    recommendations.push('Social + email plugins detected — ideal setup for multi-channel content repurposing');
  }

  const report = {
    tool: 'repurposing_inspect',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cwd,
    found: hasRelevantSetup,
    areas: {
      social_plugins: social,
      email_plugins: email,
      content_volume: content,
    },
    recommendations,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(hasRelevantSetup ? 0 : 1);
}

main();
