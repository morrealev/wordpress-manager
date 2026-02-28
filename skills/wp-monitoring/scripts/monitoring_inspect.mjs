/**
 * monitoring_inspect.mjs — Detect existing monitoring setup for WordPress projects.
 *
 * Scans for uptime monitoring services, performance tools, security scanners,
 * cron-based health checks, and logging configuration.
 *
 * Usage:
 *   node monitoring_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — monitoring configuration found
 *   1 — no monitoring configuration found
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

function detectUptimeMonitoring(cwd) {
  const indicators = [];

  // Check wp-config.php for WP_CRON_LOCK_TIMEOUT or DISABLE_WP_CRON
  const wpConfig = readFileSafe(join(cwd, 'wp-config.php'));
  if (wpConfig) {
    if (/DISABLE_WP_CRON.*true/i.test(wpConfig)) {
      indicators.push('wp_cron_disabled');
    }
    if (/WP_CRON_LOCK_TIMEOUT/i.test(wpConfig)) {
      indicators.push('wp_cron_lock_configured');
    }
  }

  // Check for health-check scripts
  if (existsSafe(join(cwd, 'scripts', 'health-check.sh'))) {
    indicators.push('health_check_script');
  }

  // Check for custom health endpoint (mu-plugins)
  const muPlugins = globDir(join(cwd, 'wp-content', 'mu-plugins'));
  for (const file of muPlugins) {
    const content = readFileSafe(join(cwd, 'wp-content', 'mu-plugins', file));
    if (content && /health|heartbeat|status[_-]?check|ping/i.test(content)) {
      indicators.push(`mu_plugin_health: ${file}`);
    }
  }

  // Check for cron system (external cron)
  if (existsSafe(join(cwd, 'crontab')) || existsSafe(join(cwd, '.crontab'))) {
    indicators.push('crontab_file');
  }

  return indicators.length > 0 ? { found: true, indicators } : { found: false };
}

function detectPerformanceMonitoring(cwd) {
  const indicators = [];

  // Check for Lighthouse CI config
  if (existsSafe(join(cwd, 'lighthouserc.js')) ||
      existsSafe(join(cwd, 'lighthouserc.json')) ||
      existsSafe(join(cwd, '.lighthouserc.js')) ||
      existsSafe(join(cwd, '.lighthouserc.json'))) {
    indicators.push('lighthouse_ci');
  }

  // Check package.json for performance deps
  const pkg = readFileSafe(join(cwd, 'package.json'));
  if (pkg) {
    try {
      const parsed = JSON.parse(pkg);
      const allDeps = { ...parsed.dependencies, ...parsed.devDependencies };
      if (allDeps['@lhci/cli']) indicators.push('lhci_cli');
      if (allDeps['web-vitals']) indicators.push('web_vitals');
      if (allDeps['lighthouse']) indicators.push('lighthouse');
      if (allDeps['sitespeed.io']) indicators.push('sitespeed_io');
    } catch { /* ignore */ }
  }

  // Check for New Relic / Datadog / APM config
  if (existsSafe(join(cwd, 'newrelic.js')) || existsSafe(join(cwd, 'newrelic.ini'))) {
    indicators.push('new_relic');
  }
  if (existsSafe(join(cwd, 'datadog.yaml')) || existsSafe(join(cwd, 'dd-agent.conf'))) {
    indicators.push('datadog');
  }

  // Check for Query Monitor plugin
  const plugins = globDir(join(cwd, 'wp-content', 'plugins'));
  for (const plugin of plugins) {
    if (/query-monitor|debug-bar|wp-performance/i.test(plugin)) {
      indicators.push(`plugin: ${plugin}`);
    }
  }

  return indicators.length > 0 ? { found: true, indicators } : { found: false };
}

function detectSecurityScanning(cwd) {
  const indicators = [];

  // Check for security plugins
  const plugins = globDir(join(cwd, 'wp-content', 'plugins'));
  const securityPlugins = ['wordfence', 'sucuri', 'ithemes-security', 'better-wp-security',
    'all-in-one-wp-security', 'wp-cerber', 'security-ninja', 'shield-security'];

  for (const plugin of plugins) {
    if (securityPlugins.some(sp => plugin.toLowerCase().includes(sp))) {
      indicators.push(`security_plugin: ${plugin}`);
    }
  }

  // Check for WP-CLI doctor config
  if (existsSafe(join(cwd, 'doctor.yml')) || existsSafe(join(cwd, '.doctor.yml'))) {
    indicators.push('wp_cli_doctor');
  }

  // Check for file integrity monitoring in wp-config
  const wpConfig = readFileSafe(join(cwd, 'wp-config.php'));
  if (wpConfig) {
    if (/DISALLOW_FILE_EDIT.*true/i.test(wpConfig)) {
      indicators.push('file_edit_disabled');
    }
    if (/DISALLOW_FILE_MODS.*true/i.test(wpConfig)) {
      indicators.push('file_mods_disabled');
    }
  }

  return indicators.length > 0 ? { found: true, indicators } : { found: false };
}

function detectLogging(cwd) {
  const indicators = [];

  // Check wp-config for debug logging
  const wpConfig = readFileSafe(join(cwd, 'wp-config.php'));
  if (wpConfig) {
    if (/WP_DEBUG_LOG.*true/i.test(wpConfig)) indicators.push('wp_debug_log');
    if (/WP_DEBUG.*true/i.test(wpConfig)) indicators.push('wp_debug_enabled');
    if (/SAVEQUERIES.*true/i.test(wpConfig)) indicators.push('save_queries');
  }

  // Check for log files
  if (existsSafe(join(cwd, 'wp-content', 'debug.log'))) {
    indicators.push('debug_log_exists');
  }

  // Check for error log
  if (existsSafe(join(cwd, 'error_log')) || existsSafe(join(cwd, 'php_errors.log'))) {
    indicators.push('error_log_exists');
  }

  return indicators.length > 0 ? { found: true, indicators } : { found: false };
}

function detectContentIntegrity(cwd) {
  const indicators = [];

  // Check for broken link checker plugin
  const plugins = globDir(join(cwd, 'wp-content', 'plugins'));
  for (const plugin of plugins) {
    if (/broken-link|link-checker|redirection/i.test(plugin)) {
      indicators.push(`plugin: ${plugin}`);
    }
  }

  // Check for spam protection plugins
  for (const plugin of plugins) {
    if (/akismet|antispam|spam/i.test(plugin)) {
      indicators.push(`spam_protection: ${plugin}`);
    }
  }

  return indicators.length > 0 ? { found: true, indicators } : { found: false };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cwdArg = argv.find(a => a.startsWith('--cwd='));
  const cwd = cwdArg ? resolve(cwdArg.split('=')[1]) : process.cwd();

  const uptime = detectUptimeMonitoring(cwd);
  const performance = detectPerformanceMonitoring(cwd);
  const security = detectSecurityScanning(cwd);
  const logging = detectLogging(cwd);
  const contentIntegrity = detectContentIntegrity(cwd);

  const hasMonitoring = uptime.found || performance.found || security.found || logging.found || contentIntegrity.found;

  const recommendations = [];

  if (!uptime.found) {
    recommendations.push('No uptime monitoring detected — set up HTTP health checks with alerting');
  }
  if (!performance.found) {
    recommendations.push('No performance monitoring detected — add Lighthouse CI or web-vitals tracking');
  }
  if (!security.found) {
    recommendations.push('No security scanning detected — install a security plugin or configure WP-CLI doctor');
  }
  if (!logging.found) {
    recommendations.push('No logging configuration detected — enable WP_DEBUG_LOG for error tracking');
  }
  if (!contentIntegrity.found) {
    recommendations.push('No content integrity checks detected — add broken link checker and spam protection');
  }
  if (logging.found && logging.indicators.includes('wp_debug_enabled')) {
    recommendations.push('WP_DEBUG is enabled — ensure this is disabled in production');
  }
  if (logging.found && logging.indicators.includes('debug_log_exists')) {
    recommendations.push('debug.log file exists — ensure it is not publicly accessible');
  }
  if (!hasMonitoring) {
    recommendations.push('No monitoring setup found — use wp-monitoring skill to establish a baseline');
  }

  const report = {
    tool: 'monitoring_inspect',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cwd,
    found: hasMonitoring,
    areas: {
      uptime,
      performance,
      security,
      logging,
      content_integrity: contentIntegrity,
    },
    recommendations,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(hasMonitoring ? 0 : 1);
}

main();
