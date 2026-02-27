/**
 * detect_local_env.mjs — Detect local WordPress development environments.
 *
 * Scans for WordPress Studio, LocalWP, and wp-env installations.
 * Outputs a JSON report to stdout with discovered environments, sites,
 * recommended tool, and WP-CLI invocation paths.
 *
 * Usage:
 *   node detect_local_env.mjs [--cwd=/path/to/check]
 *
 * Exit codes:
 *   0 — at least one environment found
 *   1 — no environments found
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";
import os from "node:os";

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

function execSafe(cmd, timeoutMs = 5000) {
  try {
    return execSync(cmd, { encoding: "utf8", timeout: timeoutMs, stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

function whichSafe(bin) {
  const cmd = process.platform === "win32" ? `where ${bin}` : `command -v ${bin}`;
  return execSafe(cmd);
}

// ---------------------------------------------------------------------------
// Platform paths
// ---------------------------------------------------------------------------

function getPlatformPaths() {
  const home = os.homedir();
  const platform = process.platform;

  if (platform === "darwin") {
    return {
      studio: {
        sites: path.join(home, "Studio"),
        config: path.join(home, "Library", "Application Support", "WordPressStudio"),
      },
      localwp: {
        sites: path.join(home, "Local Sites"),
        config: path.join(home, "Library", "Application Support", "Local"),
        json: path.join(home, "Library", "Application Support", "Local", "sites.json"),
        lightning: path.join(home, "Library", "Application Support", "Local", "lightning-services"),
        run: path.join(home, "Library", "Application Support", "Local", "run"),
      },
    };
  }

  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    const localAppData = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
    return {
      studio: {
        sites: path.join(home, "Studio"),
        config: path.join(localAppData, "WordPressStudio"),
      },
      localwp: {
        sites: path.join(home, "Local Sites"),
        config: path.join(appData, "Local"),
        json: path.join(appData, "Local", "sites.json"),
        lightning: path.join(appData, "Local", "lightning-services"),
        run: path.join(appData, "Local", "run"),
      },
    };
  }

  // Linux (default)
  return {
    studio: {
      sites: path.join(home, "Studio"),
      config: path.join(home, ".config", "WordPressStudio"),
    },
    localwp: {
      sites: path.join(home, "Local Sites"),
      config: path.join(home, ".config", "Local"),
      json: path.join(home, ".config", "Local", "sites.json"),
      lightning: path.join(home, ".config", "Local", "lightning-services"),
      run: path.join(home, ".config", "Local", "run"),
    },
  };
}

// ---------------------------------------------------------------------------
// WordPress Studio detection
// ---------------------------------------------------------------------------

function detectStudio(paths) {
  const cli = whichSafe("studio");
  const sitesDir = paths.studio.sites;
  const hasSitesDir = statSafe(sitesDir)?.isDirectory();

  if (!cli && !hasSitesDir) return null;

  // Get version from CLI
  let version = null;
  if (cli) {
    const vOut = execSafe("studio --version");
    if (vOut) version = vOut.replace(/[^0-9.]/g, "") || vOut;
  }

  // Discover sites
  const sites = [];
  if (hasSitesDir) {
    try {
      const entries = fs.readdirSync(sitesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const sitePath = path.join(sitesDir, entry.name);
        const wpConfig = path.join(sitePath, "wp-config.php");
        if (!statSafe(wpConfig)) continue;

        const site = {
          name: entry.name,
          path: sitePath,
          url: null,
          status: "unknown",
          php: null,
          wp: null,
          db: "sqlite",
        };

        // Check if SQLite db exists
        const sqliteDb = path.join(sitePath, "wp-content", "database", ".ht.sqlite");
        if (statSafe(sqliteDb)) {
          site.db = "sqlite";
        }

        // Try to get site info via CLI
        if (cli) {
          const statusOut = execSafe(`studio site status --path="${sitePath}"`);
          if (statusOut) {
            const urlMatch = statusOut.match(/URL:\s*(https?:\/\/\S+)/i);
            if (urlMatch) site.url = urlMatch[1];
            const phpMatch = statusOut.match(/PHP:\s*(\d+\.\d+)/i);
            if (phpMatch) site.php = phpMatch[1];
            const wpMatch = statusOut.match(/WordPress:\s*(\d+\.\d+(?:\.\d+)?)/i);
            if (wpMatch) site.wp = wpMatch[1];
            if (/running/i.test(statusOut)) site.status = "running";
            else if (/stopped/i.test(statusOut)) site.status = "stopped";
          }
        }

        sites.push(site);
      }
    } catch {
      // Permission or read error — skip
    }
  }

  return {
    tool: "studio",
    version,
    cli: cli || null,
    sites,
  };
}

// ---------------------------------------------------------------------------
// LocalWP detection
// ---------------------------------------------------------------------------

function detectLocalWP(paths) {
  const sitesJson = paths.localwp.json;
  const sitesData = readJsonSafe(sitesJson);
  const hasSitesDir = statSafe(paths.localwp.sites)?.isDirectory();

  if (!sitesData && !hasSitesDir) return null;

  // Find wp-cli binary
  let wpCliBin = null;
  const lightningDir = paths.localwp.lightning;
  if (statSafe(lightningDir)?.isDirectory()) {
    try {
      const entries = fs.readdirSync(lightningDir);
      const wcliDir = entries.find((e) => e.startsWith("wp-cli"));
      if (wcliDir) {
        const candidate = path.join(lightningDir, wcliDir, "bin", "wp");
        if (statSafe(candidate)) wpCliBin = candidate;
      }
    } catch {
      // Skip
    }
  }

  // Parse sites from sites.json
  const sites = [];
  if (sitesData && typeof sitesData === "object") {
    const siteEntries = Array.isArray(sitesData) ? sitesData : Object.values(sitesData);
    for (const s of siteEntries) {
      if (!s || typeof s !== "object") continue;

      const sitePath = s.path
        ? path.join(s.path, "app", "public")
        : s.name
          ? path.join(paths.localwp.sites, s.name, "app", "public")
          : null;

      const site = {
        name: s.name || s.domain || "unknown",
        path: sitePath,
        url: s.url || (s.domain ? `http://${s.domain}` : null),
        port: s.services?.nginx?.port || s.services?.apache?.port || null,
        status: "unknown",
        php: s.services?.php?.version || null,
        wp: null,
        db: "mysql",
        webServer: s.services?.nginx ? "nginx" : s.services?.apache ? "apache" : null,
      };

      // Check if site directory exists
      if (sitePath && statSafe(sitePath)?.isDirectory()) {
        site.status = "stopped"; // Directory exists but we can't confirm running
      }

      // Check MySQL socket to determine if running
      if (s.id && paths.localwp.run) {
        const socketPath = path.join(paths.localwp.run, s.id, "mysql", "mysqld.sock");
        if (statSafe(socketPath)) {
          site.status = "running";
        }
      }

      sites.push(site);
    }
  }

  // Get LocalWP version
  let version = null;
  const pkgJson = readJsonSafe(path.join(paths.localwp.config, "package.json"));
  if (pkgJson?.version) version = pkgJson.version;

  return {
    tool: "localwp",
    version,
    configPath: sitesJson,
    wpCliBin,
    sites,
  };
}

// ---------------------------------------------------------------------------
// wp-env detection
// ---------------------------------------------------------------------------

function detectWpEnv(cwd) {
  const wpEnvJson = path.join(cwd, ".wp-env.json");
  const wpEnvOverride = path.join(cwd, ".wp-env.override.json");

  const config = readJsonSafe(wpEnvJson);
  if (!config) return null;

  const overrides = readJsonSafe(wpEnvOverride);
  const merged = overrides ? { ...config, ...overrides } : config;

  const devPort = merged.port || 8888;
  const testPort = merged.testsPort || 8889;

  return {
    tool: "wpenv",
    version: null,
    configPath: wpEnvJson,
    sites: [
      {
        name: "development",
        path: cwd,
        url: `http://localhost:${devPort}`,
        port: devPort,
        status: "unknown",
        php: merged.phpVersion || null,
        wp: merged.core || null,
        db: "mysql",
      },
      {
        name: "tests",
        path: cwd,
        url: `http://localhost:${testPort}`,
        port: testPort,
        status: "unknown",
        php: merged.phpVersion || null,
        wp: merged.core || null,
        db: "mysql",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Recommendation logic
// ---------------------------------------------------------------------------

function recommend(environments) {
  if (environments.length === 0) return null;
  if (environments.length === 1) return environments[0].tool;

  // Prefer Studio if CLI is available (best automation surface)
  const studio = environments.find((e) => e.tool === "studio" && e.cli);
  if (studio) return "studio";

  // Then LocalWP if it has sites
  const localwp = environments.find((e) => e.tool === "localwp" && e.sites.length > 0);
  if (localwp) return "localwp";

  // Then wp-env
  const wpenv = environments.find((e) => e.tool === "wpenv");
  if (wpenv) return "wpenv";

  return environments[0].tool;
}

function buildWpCliMap(environments) {
  const map = {};
  for (const env of environments) {
    if (env.tool === "studio" && env.cli) {
      map.studio = "studio wp --path=<site>";
    }
    if (env.tool === "localwp" && env.wpCliBin) {
      map.localwp = `${env.wpCliBin} --path=<site>`;
    }
    if (env.tool === "wpenv") {
      map.wpenv = "npx wp-env run cli wp";
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  let cwd = process.cwd();
  for (const arg of args) {
    if (arg.startsWith("--cwd=")) cwd = arg.slice(6);
  }

  const paths = getPlatformPaths();
  const environments = [];

  const studio = detectStudio(paths);
  if (studio) environments.push(studio);

  const localwp = detectLocalWP(paths);
  if (localwp) environments.push(localwp);

  const wpenv = detectWpEnv(cwd);
  if (wpenv) environments.push(wpenv);

  const report = {
    version: TOOL_VERSION,
    timestamp: new Date().toISOString(),
    platform: process.platform,
    environments,
    recommended: recommend(environments),
    wpCli: buildWpCliMap(environments),
  };

  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  process.exit(environments.length > 0 ? 0 : 1);
}

main();
