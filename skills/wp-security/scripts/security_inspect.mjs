/**
 * security_inspect.mjs — Detect WordPress security configuration and potential issues.
 *
 * Scans wp-config.php constants, file permissions, debug settings,
 * .htaccess hardening, and security plugin presence.
 * Outputs a JSON report to stdout.
 *
 * Usage:
 *   node security_inspect.mjs [--cwd=/path/to/wordpress]
 *
 * Exit codes:
 *   0 — WordPress installation found and scanned
 *   1 — no WordPress installation found
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const TOOL_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statSafe(p) {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function readJsonSafe(p) {
  const raw = readFileSafe(p);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function execSafe(cmd, cwd, timeoutMs = 5000) {
  try {
    return execSync(cmd, { encoding: "utf8", timeout: timeoutMs, cwd, stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Parse --cwd argument
// ---------------------------------------------------------------------------

function parseCwd() {
  const cwdArg = process.argv.find((a) => a.startsWith("--cwd="));
  return cwdArg ? cwdArg.slice(6) : process.cwd();
}

// ---------------------------------------------------------------------------
// Detect WordPress installation
// ---------------------------------------------------------------------------

function findWpRoot(cwd) {
  // Check common locations
  const candidates = [
    cwd,
    path.join(cwd, "wordpress"),
    path.join(cwd, "wp"),
    path.join(cwd, "public_html"),
    path.join(cwd, "htdocs"),
  ];

  for (const dir of candidates) {
    if (statSafe(path.join(dir, "wp-config.php"))?.isFile()) return dir;
    if (statSafe(path.join(dir, "wp-includes", "version.php"))?.isFile()) return dir;
  }

  // wp-config.php one level up (common security practice)
  const parent = path.dirname(cwd);
  if (statSafe(path.join(parent, "wp-config.php"))?.isFile()) {
    return cwd;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Scan wp-config.php
// ---------------------------------------------------------------------------

function scanWpConfig(wpRoot) {
  const result = {
    found: false,
    location: null,
    constants: {},
    issues: [],
  };

  // Check current dir and parent
  let configPath = path.join(wpRoot, "wp-config.php");
  if (!statSafe(configPath)?.isFile()) {
    configPath = path.join(path.dirname(wpRoot), "wp-config.php");
  }
  if (!statSafe(configPath)?.isFile()) return result;

  result.found = true;
  result.location = configPath;

  const content = readFileSafe(configPath);
  if (!content) return result;

  // Extract defined constants
  const constantPattern = /define\s*\(\s*['"](\w+)['"]\s*,\s*(.+?)\s*\)/g;
  let match;
  while ((match = constantPattern.exec(content)) !== null) {
    const name = match[1];
    const rawValue = match[2].trim().replace(/['"]/g, "").replace(/\);$/, "");
    result.constants[name] = rawValue;
  }

  // Check security constants
  const securityConstants = {
    WP_DEBUG: { safe: "false", risk: "Exposes error details in production" },
    WP_DEBUG_DISPLAY: { safe: "false", risk: "Shows errors to visitors" },
    WP_DEBUG_LOG: { safe: "false", risk: "Log file may be publicly accessible" },
    DISALLOW_FILE_EDIT: { safe: "true", risk: "Theme/plugin editor is enabled" },
    FORCE_SSL_ADMIN: { safe: "true", risk: "Admin not forced to HTTPS" },
  };

  for (const [name, check] of Object.entries(securityConstants)) {
    const value = result.constants[name];
    if (value !== undefined && value.toLowerCase() !== check.safe) {
      result.issues.push({ constant: name, value, risk: check.risk });
    }
    if (value === undefined && name === "DISALLOW_FILE_EDIT") {
      result.issues.push({ constant: name, value: "not set", risk: "File editor not explicitly disabled" });
    }
    if (value === undefined && name === "FORCE_SSL_ADMIN") {
      result.issues.push({ constant: name, value: "not set", risk: "SSL not forced for admin" });
    }
  }

  // Check security keys for defaults
  const keyNames = ["AUTH_KEY", "SECURE_AUTH_KEY", "LOGGED_IN_KEY", "NONCE_KEY"];
  for (const key of keyNames) {
    const val = result.constants[key];
    if (val && val.includes("put your unique phrase here")) {
      result.issues.push({ constant: key, value: "default", risk: "Security key not changed from default" });
    }
  }

  // Check table prefix
  const prefixMatch = content.match(/\$table_prefix\s*=\s*['"](\w+)['"]/);
  if (prefixMatch) {
    result.constants._table_prefix = prefixMatch[1];
    if (prefixMatch[1] === "wp_") {
      result.issues.push({ constant: "$table_prefix", value: "wp_", risk: "Default table prefix" });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Scan file permissions
// ---------------------------------------------------------------------------

function scanPermissions(wpRoot) {
  const result = { checks: [], issues: [] };

  if (process.platform === "win32") {
    result.checks.push({ file: "N/A", note: "Permission checks not available on Windows" });
    return result;
  }

  const fileChecks = [
    { path: "wp-config.php", maxMode: 0o440, label: "wp-config.php" },
    { path: ".htaccess", maxMode: 0o644, label: ".htaccess" },
    { path: "wp-content", maxMode: 0o755, label: "wp-content/" },
    { path: "wp-content/uploads", maxMode: 0o755, label: "wp-content/uploads/" },
  ];

  for (const check of fileChecks) {
    const full = path.join(wpRoot, check.path);
    const stat = statSafe(full);
    if (!stat) {
      result.checks.push({ file: check.label, exists: false });
      continue;
    }

    const mode = stat.mode & 0o777;
    const modeStr = "0" + mode.toString(8);
    const isWorldWritable = (mode & 0o002) !== 0;

    result.checks.push({
      file: check.label,
      exists: true,
      mode: modeStr,
      worldWritable: isWorldWritable,
    });

    if (isWorldWritable) {
      result.issues.push({ file: check.label, mode: modeStr, risk: "World-writable" });
    }

    if (check.label === "wp-config.php" && mode > check.maxMode) {
      result.issues.push({
        file: check.label,
        mode: modeStr,
        recommended: "0" + check.maxMode.toString(8),
        risk: "wp-config.php permissions too open",
      });
    }
  }

  // Check for PHP files in uploads
  const uploadsDir = path.join(wpRoot, "wp-content", "uploads");
  if (statSafe(uploadsDir)?.isDirectory()) {
    const phpInUploads = execSafe(
      `find "${uploadsDir}" -name "*.php" -type f 2>/dev/null | head -5`,
      wpRoot
    );
    if (phpInUploads && phpInUploads.length > 0) {
      result.issues.push({
        file: "wp-content/uploads/",
        risk: "PHP files found in uploads directory",
        files: phpInUploads.split("\n").map((f) => path.relative(wpRoot, f)),
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Scan .htaccess
// ---------------------------------------------------------------------------

function scanHtaccess(wpRoot) {
  const result = { found: false, hardening: [], missing: [] };

  const htaccessPath = path.join(wpRoot, ".htaccess");
  const content = readFileSafe(htaccessPath);
  if (!content) return result;

  result.found = true;

  const hardeningChecks = [
    { name: "xmlrpc-blocked", pattern: /xmlrpc\.php/i },
    { name: "directory-listing-disabled", pattern: /Options\s+-Indexes/i },
    { name: "wp-config-protected", pattern: /wp-config\.php/i },
    { name: "server-signature-off", pattern: /ServerSignature\s+Off/i },
    { name: "file-type-restriction", pattern: /FilesMatch.*\.(php|phtml)/i },
  ];

  for (const check of hardeningChecks) {
    if (check.pattern.test(content)) {
      result.hardening.push(check.name);
    } else {
      result.missing.push(check.name);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Scan security plugins
// ---------------------------------------------------------------------------

function scanSecurityPlugins(wpRoot) {
  const pluginsDir = path.join(wpRoot, "wp-content", "plugins");
  if (!statSafe(pluginsDir)?.isDirectory()) return { detected: [] };

  const securityPlugins = [
    { dir: "wordfence", name: "Wordfence Security" },
    { dir: "sucuri-scanner", name: "Sucuri Security" },
    { dir: "ithemes-security-pro", name: "iThemes Security Pro" },
    { dir: "better-wp-security", name: "iThemes Security" },
    { dir: "all-in-one-wp-security-and-firewall", name: "All In One WP Security" },
    { dir: "wp-cerber", name: "WP Cerber Security" },
    { dir: "limit-login-attempts-reloaded", name: "Limit Login Attempts Reloaded" },
    { dir: "two-factor", name: "Two Factor Authentication" },
    { dir: "disable-xml-rpc", name: "Disable XML-RPC" },
  ];

  const detected = [];
  for (const plugin of securityPlugins) {
    if (statSafe(path.join(pluginsDir, plugin.dir))?.isDirectory()) {
      detected.push(plugin.name);
    }
  }

  return { detected };
}

// ---------------------------------------------------------------------------
// Scan HTTP headers (via WP-CLI if available)
// ---------------------------------------------------------------------------

function scanHeaders(wpRoot) {
  // Only possible if site is running — skip if no WP-CLI
  const wpCli = execSafe("command -v wp", wpRoot);
  if (!wpCli) return { available: false };

  const siteUrl = execSafe("wp option get siteurl --skip-themes --skip-plugins 2>/dev/null", wpRoot);
  if (!siteUrl) return { available: false };

  // Try to fetch headers
  const headers = execSafe(`curl -sI -o /dev/null -w '%{http_code}' "${siteUrl}" 2>/dev/null`, wpRoot);
  return { available: true, siteUrl, reachable: headers === "200" || headers === "301" || headers === "302" };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cwd = parseCwd();

  if (!statSafe(cwd)?.isDirectory()) {
    console.error(`Error: directory not found: ${cwd}`);
    process.exit(1);
  }

  const wpRoot = findWpRoot(cwd);
  if (!wpRoot) {
    console.log(JSON.stringify({
      tool: "security_inspect",
      version: TOOL_VERSION,
      cwd,
      detected: false,
      error: "No WordPress installation found",
    }, null, 2));
    process.exit(1);
  }

  const wpConfig = scanWpConfig(wpRoot);
  const permissions = scanPermissions(wpRoot);
  const htaccess = scanHtaccess(wpRoot);
  const plugins = scanSecurityPlugins(wpRoot);
  const headers = scanHeaders(wpRoot);

  const totalIssues = wpConfig.issues.length + permissions.issues.length + htaccess.missing.length;

  const report = {
    tool: "security_inspect",
    version: TOOL_VERSION,
    cwd,
    wpRoot,
    detected: true,
    summary: {
      totalIssues,
      severity: totalIssues === 0 ? "good" : totalIssues <= 3 ? "moderate" : "needs-attention",
    },
    wpConfig,
    permissions,
    htaccess,
    securityPlugins: plugins,
    headers,
    recommendations: [],
  };

  // Generate recommendations
  if (plugins.detected.length === 0) {
    report.recommendations.push("No security plugin detected. Consider installing Wordfence or Sucuri.");
  }
  if (wpConfig.issues.length > 0) {
    report.recommendations.push(`${wpConfig.issues.length} wp-config.php issue(s) found. Review security constants.`);
  }
  if (htaccess.missing.length > 0) {
    report.recommendations.push(`Missing .htaccess hardening: ${htaccess.missing.join(", ")}`);
  }
  if (permissions.issues.length > 0) {
    report.recommendations.push(`${permissions.issues.length} file permission issue(s) found.`);
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

main();
