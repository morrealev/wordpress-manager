/**
 * i18n_inspect.mjs — Detect internationalization setup in a WordPress project.
 *
 * Scans for text domain, .pot/.po/.mo files, i18n function usage,
 * and WP-CLI i18n availability.
 * Outputs a JSON report to stdout.
 *
 * Usage:
 *   node i18n_inspect.mjs [--cwd=/path/to/check]
 *
 * Exit codes:
 *   0 — i18n setup detected
 *   1 — no i18n setup detected
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

function readdirSafe(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
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
// Detect text domain
// ---------------------------------------------------------------------------

function detectTextDomain(cwd) {
  const result = { found: false, domain: null, source: null };

  // Check plugin header
  const phpFiles = readdirSafe(cwd).filter((f) => f.endsWith(".php"));
  for (const file of phpFiles) {
    const content = readFileSafe(path.join(cwd, file));
    if (!content) continue;

    const domainMatch = content.match(/Text\s*Domain:\s*(\S+)/i);
    if (domainMatch) {
      result.found = true;
      result.domain = domainMatch[1];
      result.source = file;
      return result;
    }
  }

  // Check style.css (theme)
  const styleContent = readFileSafe(path.join(cwd, "style.css"));
  if (styleContent) {
    const domainMatch = styleContent.match(/Text\s*Domain:\s*(\S+)/i);
    if (domainMatch) {
      result.found = true;
      result.domain = domainMatch[1];
      result.source = "style.css";
      return result;
    }
  }

  // Check block.json files
  const blockJson = readJsonSafe(path.join(cwd, "block.json"));
  if (blockJson?.textdomain) {
    result.found = true;
    result.domain = blockJson.textdomain;
    result.source = "block.json";
    return result;
  }

  const srcBlockJson = readJsonSafe(path.join(cwd, "src", "block.json"));
  if (srcBlockJson?.textdomain) {
    result.found = true;
    result.domain = srcBlockJson.textdomain;
    result.source = "src/block.json";
    return result;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect translation files
// ---------------------------------------------------------------------------

function detectTranslationFiles(cwd) {
  const result = { languagesDir: null, pot: [], po: [], mo: [], json: [] };

  const langDirs = ["languages", "lang", "i18n"];
  for (const dir of langDirs) {
    const full = path.join(cwd, dir);
    if (statSafe(full)?.isDirectory()) {
      result.languagesDir = dir;
      break;
    }
  }

  if (!result.languagesDir) return result;

  const files = readdirSafe(path.join(cwd, result.languagesDir));
  for (const file of files) {
    if (file.endsWith(".pot")) result.pot.push(file);
    else if (file.endsWith(".po")) result.po.push(file);
    else if (file.endsWith(".mo")) result.mo.push(file);
    else if (file.endsWith(".json") && !file.startsWith(".")) result.json.push(file);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect i18n function usage
// ---------------------------------------------------------------------------

function detectI18nUsage(cwd) {
  const result = { php: { detected: false, functions: {} }, js: { detected: false, functions: {} } };

  // PHP i18n functions
  const phpFunctions = ["__", "_e", "_x", "_ex", "_n", "_nx", "esc_html__", "esc_html_e", "esc_attr__", "esc_attr_e"];
  const phpPattern = phpFunctions.map((f) => f.replace(/_/g, "_")).join("|");
  const phpCount = execSafe(
    `grep -rl --include="*.php" -E "(${phpPattern})\\s*\\(" . 2>/dev/null | wc -l`,
    cwd
  );

  if (phpCount && parseInt(phpCount) > 0) {
    result.php.detected = true;

    // Count per function
    for (const func of phpFunctions) {
      const count = execSafe(
        `grep -r --include="*.php" -c "${func}(" . 2>/dev/null | awk -F: '{s+=$2} END {print s}'`,
        cwd
      );
      if (count && parseInt(count) > 0) {
        result.php.functions[func] = parseInt(count);
      }
    }
  }

  // JS i18n functions (@wordpress/i18n)
  const jsCount = execSafe(
    `grep -rl --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" "@wordpress/i18n" . 2>/dev/null | wc -l`,
    cwd
  );

  if (jsCount && parseInt(jsCount) > 0) {
    result.js.detected = true;
  }

  // Also check for import
  const jsImportCount = execSafe(
    `grep -rl --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" "from '@wordpress/i18n'" . 2>/dev/null | wc -l`,
    cwd
  );
  if (jsImportCount && parseInt(jsImportCount) > 0) {
    result.js.detected = true;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect Domain Path header
// ---------------------------------------------------------------------------

function detectDomainPath(cwd) {
  const phpFiles = readdirSafe(cwd).filter((f) => f.endsWith(".php"));
  for (const file of phpFiles) {
    const content = readFileSafe(path.join(cwd, file));
    if (!content) continue;
    const match = content.match(/Domain\s*Path:\s*(\S+)/i);
    if (match) return match[1];
  }

  const styleContent = readFileSafe(path.join(cwd, "style.css"));
  if (styleContent) {
    const match = styleContent.match(/Domain\s*Path:\s*(\S+)/i);
    if (match) return match[1];
  }

  return null;
}

// ---------------------------------------------------------------------------
// Detect load_textdomain calls
// ---------------------------------------------------------------------------

function detectTextdomainLoading(cwd) {
  const functions = [
    "load_plugin_textdomain",
    "load_theme_textdomain",
    "load_child_theme_textdomain",
    "wp_set_script_translations",
  ];

  const detected = [];
  for (const func of functions) {
    const found = execSafe(
      `grep -rl --include="*.php" "${func}" . 2>/dev/null | head -1`,
      cwd
    );
    if (found) detected.push(func);
  }

  return detected;
}

// ---------------------------------------------------------------------------
// Check WP-CLI i18n availability
// ---------------------------------------------------------------------------

function checkWpCliI18n(cwd) {
  const wpCli = execSafe("command -v wp", cwd);
  if (!wpCli) return { available: false };

  const i18nHelp = execSafe("wp i18n --help 2>/dev/null", cwd);
  return { available: !!i18nHelp };
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

  const textDomain = detectTextDomain(cwd);
  const translationFiles = detectTranslationFiles(cwd);
  const i18nUsage = detectI18nUsage(cwd);
  const domainPath = detectDomainPath(cwd);
  const textdomainLoading = detectTextdomainLoading(cwd);
  const wpCliI18n = checkWpCliI18n(cwd);

  const detected = textDomain.found || i18nUsage.php.detected || i18nUsage.js.detected || translationFiles.pot.length > 0;

  const report = {
    tool: "i18n_inspect",
    version: TOOL_VERSION,
    cwd,
    detected,
    textDomain,
    domainPath,
    textdomainLoading,
    translationFiles,
    i18nUsage,
    wpCliI18n,
    recommendations: [],
  };

  // Recommendations
  if (!textDomain.found && (i18nUsage.php.detected || i18nUsage.js.detected)) {
    report.recommendations.push("i18n functions used but no Text Domain header found. Add 'Text Domain:' to plugin/theme header.");
  }
  if (textDomain.found && translationFiles.pot.length === 0) {
    report.recommendations.push("Text domain set but no .pot file found. Run: wp i18n make-pot . languages/" + textDomain.domain + ".pot");
  }
  if (translationFiles.po.length > 0 && translationFiles.mo.length === 0) {
    report.recommendations.push("PO files found but no compiled MO files. Run: wp i18n make-mo languages/");
  }
  if (i18nUsage.js.detected && translationFiles.json.length === 0) {
    report.recommendations.push("JS i18n detected but no JSON translation files. Run: wp i18n make-json languages/ --no-purge");
  }
  if (textDomain.found && textdomainLoading.length === 0) {
    report.recommendations.push("Text domain found but no load_plugin_textdomain/load_theme_textdomain call detected.");
  }
  if (!domainPath && textDomain.found) {
    report.recommendations.push("Consider adding 'Domain Path: /languages' to the plugin/theme header.");
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(detected ? 0 : 1);
}

main();
