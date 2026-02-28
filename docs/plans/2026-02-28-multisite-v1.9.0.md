# v1.9.0 Multisite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add WordPress Multisite network management to the plugin via a new WP-CLI execution module, 10 new MCP tools, a skill with 6 references, and a detection script.

**Architecture:** New `wpcli.ts` module handles command execution (local or SSH), two tool files provide 10 multisite MCP tools (wp-cli for network-only, REST for plugin listing), `wp-site-manager` agent gets a multisite section, router becomes v6.

**Tech Stack:** TypeScript (ESM), Node.js child_process, Zod schemas, MCP SDK

---

## Task 1: Extend types.ts with Multisite types and SiteConfig fields

**Files:**
- Modify: `servers/wp-rest-bridge/src/types.ts`

**Step 1: Add WP-CLI/Multisite fields to SiteConfig comment and WPNetworkSite type**

Add at the end of `types.ts` (after the WCCoupon interface):

```typescript
// ── WordPress Multisite Types ────────────────────────────────────────

export interface WPNetworkSite {
  blog_id: number;
  url: string;
  domain: string;
  path: string;
  registered: string;
  last_updated: string;
  public: boolean;
  archived: boolean;
  mature: boolean;
  spam: boolean;
  deleted: boolean;
}
```

**Step 2: Verify compilation**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: no errors (the new type is just an interface export, no runtime impact)

---

## Task 2: Extend SiteConfig and create wpcli.ts module

**Files:**
- Modify: `servers/wp-rest-bridge/src/wordpress.ts` (SiteConfig interface)
- Create: `servers/wp-rest-bridge/src/wpcli.ts`

**Step 1: Add WP-CLI fields to SiteConfig in wordpress.ts**

In `servers/wp-rest-bridge/src/wordpress.ts`, extend the `SiteConfig` interface (lines 4-11) to:

```typescript
interface SiteConfig {
  id: string;
  url: string;
  username: string;
  password: string;
  wc_consumer_key?: string;
  wc_consumer_secret?: string;
  // WP-CLI access (optional, for multisite and CLI operations)
  wp_path?: string;        // Local WP installation path
  ssh_host?: string;       // SSH hostname for remote wp-cli
  ssh_user?: string;       // SSH username
  ssh_key?: string;        // Path to SSH private key
  ssh_port?: number;       // SSH port (default: 22)
  is_multisite?: boolean;  // Flag: this site is a multisite network
}
```

Also export a function to retrieve the raw SiteConfig. Add after the `getActiveSite()` function (after line 232):

```typescript
/**
 * Get the SiteConfig for a given site (needed by wpcli module).
 */
export function getSiteConfig(siteId?: string): SiteConfig | undefined {
  const id = siteId || activeSiteId;
  return parsedSiteConfigs.get(id);
}
```

And add a module-level Map to store parsed configs. After `let activeSiteId: string = '';` (line 45), add:

```typescript
const parsedSiteConfigs = new Map<string, SiteConfig>();
```

In the `initWordPress()` function, store each site config. In the for loop (line 93-96), add after `logToStderr`:

```typescript
    parsedSiteConfigs.set(site.id, site);
```

For the legacy single-site fallback (lines 75-78), also store:

```typescript
    parsedSiteConfigs.set(siteId, { id: siteId, url, username: username || '', password: password || '' });
```

**Step 2: Create wpcli.ts**

Create `servers/wp-rest-bridge/src/wpcli.ts`:

```typescript
// src/wpcli.ts - WP-CLI execution module (local + SSH)
import { exec } from 'node:child_process';
import { getSiteConfig, getActiveSite, logToStderr } from './wordpress.js';

const WPCLI_TIMEOUT_MS = 30000;

/**
 * Check if a site has WP-CLI access configured (wp_path and optionally ssh_host).
 */
export function hasWpCli(siteId?: string): boolean {
  const config = getSiteConfig(siteId || getActiveSite());
  if (!config) return false;
  return !!config.wp_path;
}

/**
 * Check if a site is configured as multisite.
 */
export function isMultisite(siteId?: string): boolean {
  const config = getSiteConfig(siteId || getActiveSite());
  if (!config) return false;
  return !!config.is_multisite;
}

/**
 * Execute a WP-CLI command for a given site.
 *
 * - If ssh_host is set: runs via SSH
 * - If only wp_path is set: runs locally
 * - Appends --format=json by default for structured output
 *
 * @param command WP-CLI command without the leading "wp " (e.g., "site list", "plugin activate hello --network")
 * @param siteId Site ID (defaults to active site)
 * @param options.skipJson Don't append --format=json (for commands that don't support it)
 * @returns stdout as string
 */
export async function executeWpCli(
  command: string,
  siteId?: string,
  options?: { skipJson?: boolean }
): Promise<string> {
  const id = siteId || getActiveSite();
  const config = getSiteConfig(id);

  if (!config) {
    throw new Error(`Site "${id}" not found in configuration.`);
  }

  if (!config.wp_path) {
    throw new Error(
      `WP-CLI not configured for site "${id}". ` +
      `Add wp_path to WP_SITES_CONFIG for this site.`
    );
  }

  const formatFlag = options?.skipJson ? '' : ' --format=json';
  const wpCommand = `wp ${command}${formatFlag}`;

  let shellCommand: string;

  if (config.ssh_host) {
    // Remote execution via SSH
    const sshUser = config.ssh_user || 'root';
    const sshPort = config.ssh_port || 22;
    const sshKeyFlag = config.ssh_key ? `-i ${config.ssh_key} ` : '';
    const escapedCommand = `cd ${config.wp_path} && ${wpCommand}`;
    shellCommand = `ssh ${sshKeyFlag}-p ${sshPort} -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 ${sshUser}@${config.ssh_host} '${escapedCommand}'`;
  } else {
    // Local execution
    shellCommand = `cd ${config.wp_path} && ${wpCommand}`;
  }

  logToStderr(`[${id}] WP-CLI: ${wpCommand}`);

  return new Promise<string>((resolve, reject) => {
    exec(shellCommand, { timeout: WPCLI_TIMEOUT_MS }, (error, stdout, stderr) => {
      if (error) {
        const msg = stderr?.trim() || error.message;
        logToStderr(`[${id}] WP-CLI error: ${msg}`);
        reject(new Error(`WP-CLI error on site "${id}": ${msg}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}
```

**Step 3: Verify compilation**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: no errors

---

## Task 3: Create multisite-sites.ts (5 tools)

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/multisite-sites.ts`

**Step 1: Create the tool file**

Create `servers/wp-rest-bridge/src/tools/multisite-sites.ts`:

```typescript
// src/tools/multisite-sites.ts — Multisite sub-site management (WP-CLI)
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { executeWpCli, isMultisite } from '../wpcli.js';
import { z } from 'zod';

// ── Schemas ──────────────────────────────────────────────────────────

const msListSitesSchema = z.object({
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

const msGetSiteSchema = z.object({
  blog_id: z.number().describe('Blog ID of the sub-site to retrieve'),
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

const msCreateSiteSchema = z.object({
  slug: z.string().describe('URL slug for the new sub-site (e.g., "blog", "shop")'),
  title: z.string().describe('Title of the new sub-site'),
  email: z.string().describe('Admin email for the new sub-site'),
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

const msActivateSiteSchema = z.object({
  blog_id: z.number().describe('Blog ID of the sub-site'),
  active: z.boolean().describe('true to activate, false to deactivate'),
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

const msDeleteSiteSchema = z.object({
  blog_id: z.number().describe('Blog ID of the sub-site to delete'),
  confirm: z.literal(true).describe('Must be true to confirm deletion (safety gate)'),
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

// ── Tools ────────────────────────────────────────────────────────────

export const multisiteSiteTools: Tool[] = [
  {
    name: 'ms_list_sites',
    description: 'Lists all sub-sites in a WordPress Multisite network. Requires wp-cli and is_multisite configuration.',
    inputSchema: { type: 'object', properties: msListSitesSchema.shape }
  },
  {
    name: 'ms_get_site',
    description: 'Gets details of a specific sub-site by blog ID.',
    inputSchema: { type: 'object', properties: msGetSiteSchema.shape }
  },
  {
    name: 'ms_create_site',
    description: 'Creates a new sub-site in the multisite network.',
    inputSchema: { type: 'object', properties: msCreateSiteSchema.shape }
  },
  {
    name: 'ms_activate_site',
    description: 'Activates or deactivates a sub-site in the multisite network.',
    inputSchema: { type: 'object', properties: msActivateSiteSchema.shape }
  },
  {
    name: 'ms_delete_site',
    description: 'Permanently deletes a sub-site. Requires confirm: true as safety gate.',
    inputSchema: { type: 'object', properties: msDeleteSiteSchema.shape }
  }
];

// ── Helpers ──────────────────────────────────────────────────────────

function requireMultisite(siteId?: string): void {
  if (!isMultisite(siteId)) {
    throw new Error(
      `Site is not configured as multisite. ` +
      `Set is_multisite: true in WP_SITES_CONFIG.`
    );
  }
}

// ── Handlers ─────────────────────────────────────────────────────────

export const multisiteSiteHandlers = {
  ms_list_sites: async (params: z.infer<typeof msListSitesSchema>) => {
    try {
      requireMultisite(params.site_id);
      const result = await executeWpCli('site list', params.site_id);
      return {
        toolResult: {
          content: [{ type: 'text', text: result }]
        }
      };
    } catch (error: any) {
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error listing sites: ${error.message}` }]
        }
      };
    }
  },

  ms_get_site: async (params: z.infer<typeof msGetSiteSchema>) => {
    try {
      requireMultisite(params.site_id);
      const result = await executeWpCli(`site list --blog_id=${params.blog_id}`, params.site_id);
      return {
        toolResult: {
          content: [{ type: 'text', text: result }]
        }
      };
    } catch (error: any) {
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error getting site: ${error.message}` }]
        }
      };
    }
  },

  ms_create_site: async (params: z.infer<typeof msCreateSiteSchema>) => {
    try {
      requireMultisite(params.site_id);
      const result = await executeWpCli(
        `site create --slug=${params.slug} --title="${params.title}" --email=${params.email}`,
        params.site_id,
        { skipJson: true }
      );
      return {
        toolResult: {
          content: [{ type: 'text', text: result }]
        }
      };
    } catch (error: any) {
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error creating site: ${error.message}` }]
        }
      };
    }
  },

  ms_activate_site: async (params: z.infer<typeof msActivateSiteSchema>) => {
    try {
      requireMultisite(params.site_id);
      const action = params.active ? 'activate' : 'deactivate';
      const result = await executeWpCli(
        `site ${action} ${params.blog_id}`,
        params.site_id,
        { skipJson: true }
      );
      return {
        toolResult: {
          content: [{ type: 'text', text: result || `Site ${params.blog_id} ${action}d successfully.` }]
        }
      };
    } catch (error: any) {
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error ${params.active ? 'activating' : 'deactivating'} site: ${error.message}` }]
        }
      };
    }
  },

  ms_delete_site: async (params: z.infer<typeof msDeleteSiteSchema>) => {
    try {
      requireMultisite(params.site_id);
      const result = await executeWpCli(
        `site delete ${params.blog_id} --yes`,
        params.site_id,
        { skipJson: true }
      );
      return {
        toolResult: {
          content: [{ type: 'text', text: result || `Site ${params.blog_id} deleted successfully.` }]
        }
      };
    } catch (error: any) {
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error deleting site: ${error.message}` }]
        }
      };
    }
  }
};
```

**Step 2: Verify compilation**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: no errors

---

## Task 4: Create multisite-network.ts (5 tools)

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/multisite-network.ts`

**Step 1: Create the tool file**

Create `servers/wp-rest-bridge/src/tools/multisite-network.ts`:

```typescript
// src/tools/multisite-network.ts — Multisite network admin (REST + WP-CLI hybrid)
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { makeWordPressRequest } from '../wordpress.js';
import { executeWpCli, isMultisite } from '../wpcli.js';
import { z } from 'zod';

// ── Schemas ──────────────────────────────────────────────────────────

const msListNetworkPluginsSchema = z.object({
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

const msNetworkActivatePluginSchema = z.object({
  plugin_slug: z.string().describe('Plugin slug to network-activate (e.g., "akismet", "jetpack")'),
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

const msNetworkDeactivatePluginSchema = z.object({
  plugin_slug: z.string().describe('Plugin slug to network-deactivate'),
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

const msListSuperAdminsSchema = z.object({
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

const msGetNetworkSettingsSchema = z.object({
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

// ── Tools ────────────────────────────────────────────────────────────

export const multisiteNetworkTools: Tool[] = [
  {
    name: 'ms_list_network_plugins',
    description: 'Lists all plugins on the multisite network with their activation status (uses REST API).',
    inputSchema: { type: 'object', properties: msListNetworkPluginsSchema.shape }
  },
  {
    name: 'ms_network_activate_plugin',
    description: 'Network-activates a plugin across all sites in the multisite network (uses wp-cli).',
    inputSchema: { type: 'object', properties: msNetworkActivatePluginSchema.shape }
  },
  {
    name: 'ms_network_deactivate_plugin',
    description: 'Network-deactivates a plugin from all sites in the multisite network (uses wp-cli).',
    inputSchema: { type: 'object', properties: msNetworkDeactivatePluginSchema.shape }
  },
  {
    name: 'ms_list_super_admins',
    description: 'Lists all Super Admin users in the multisite network (uses wp-cli).',
    inputSchema: { type: 'object', properties: msListSuperAdminsSchema.shape }
  },
  {
    name: 'ms_get_network_settings',
    description: 'Gets network-wide settings (site name, admin email, registration policy) via wp-cli.',
    inputSchema: { type: 'object', properties: msGetNetworkSettingsSchema.shape }
  }
];

// ── Helpers ──────────────────────────────────────────────────────────

function requireMultisite(siteId?: string): void {
  if (!isMultisite(siteId)) {
    throw new Error(
      `Site is not configured as multisite. ` +
      `Set is_multisite: true in WP_SITES_CONFIG.`
    );
  }
}

// ── Handlers ─────────────────────────────────────────────────────────

export const multisiteNetworkHandlers = {
  ms_list_network_plugins: async (params: z.infer<typeof msListNetworkPluginsSchema>) => {
    try {
      requireMultisite(params.site_id);
      // Use REST API — list_plugins works on multisite, returns network_only field
      const result = await makeWordPressRequest('GET', 'plugins', undefined, {
        siteId: params.site_id
      });
      return {
        toolResult: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        }
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error listing network plugins: ${errorMessage}` }]
        }
      };
    }
  },

  ms_network_activate_plugin: async (params: z.infer<typeof msNetworkActivatePluginSchema>) => {
    try {
      requireMultisite(params.site_id);
      const result = await executeWpCli(
        `plugin activate ${params.plugin_slug} --network`,
        params.site_id,
        { skipJson: true }
      );
      return {
        toolResult: {
          content: [{ type: 'text', text: result || `Plugin "${params.plugin_slug}" network-activated successfully.` }]
        }
      };
    } catch (error: any) {
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error network-activating plugin: ${error.message}` }]
        }
      };
    }
  },

  ms_network_deactivate_plugin: async (params: z.infer<typeof msNetworkDeactivatePluginSchema>) => {
    try {
      requireMultisite(params.site_id);
      const result = await executeWpCli(
        `plugin deactivate ${params.plugin_slug} --network`,
        params.site_id,
        { skipJson: true }
      );
      return {
        toolResult: {
          content: [{ type: 'text', text: result || `Plugin "${params.plugin_slug}" network-deactivated successfully.` }]
        }
      };
    } catch (error: any) {
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error network-deactivating plugin: ${error.message}` }]
        }
      };
    }
  },

  ms_list_super_admins: async (params: z.infer<typeof msListSuperAdminsSchema>) => {
    try {
      requireMultisite(params.site_id);
      const result = await executeWpCli('super-admin list', params.site_id, { skipJson: true });
      return {
        toolResult: {
          content: [{ type: 'text', text: result }]
        }
      };
    } catch (error: any) {
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error listing super admins: ${error.message}` }]
        }
      };
    }
  },

  ms_get_network_settings: async (params: z.infer<typeof msGetNetworkSettingsSchema>) => {
    try {
      requireMultisite(params.site_id);
      const result = await executeWpCli('network meta list 1', params.site_id);
      return {
        toolResult: {
          content: [{ type: 'text', text: result }]
        }
      };
    } catch (error: any) {
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error getting network settings: ${error.message}` }]
        }
      };
    }
  }
};
```

**Step 2: Verify compilation**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: no errors

---

## Task 5: Register multisite tools in index.ts

**Files:**
- Modify: `servers/wp-rest-bridge/src/tools/index.ts`

**Step 1: Add imports and spread into allTools/toolHandlers**

Add after the `wc-settings.js` import (line 16):

```typescript
import { multisiteSiteTools, multisiteSiteHandlers } from './multisite-sites.js';
import { multisiteNetworkTools, multisiteNetworkHandlers } from './multisite-network.js';
```

Add to `allTools` array (after `...wcSettingTools`):

```typescript
  ...multisiteSiteTools,           // 5 tools
  ...multisiteNetworkTools,        // 5 tools
```

Add to `toolHandlers` object (after `...wcSettingHandlers`):

```typescript
  ...multisiteSiteHandlers,
  ...multisiteNetworkHandlers,
```

**Step 2: Build and verify tool count**

Run: `cd servers/wp-rest-bridge && npx tsc`
Expected: build succeeds

Run: `node -e "const {allTools} = require('./servers/wp-rest-bridge/build/tools/index.js'); console.log('Total tools:', allTools.length)"`
Expected: `Total tools: 81` (71 existing + 10 multisite)

Note: If `require` fails due to ESM, use:
```bash
node --input-type=module -e "import {allTools} from './servers/wp-rest-bridge/build/tools/index.js'; console.log('Total tools:', allTools.length)"
```

---

## Task 6: Create detection script multisite_inspect.mjs

**Files:**
- Create: `skills/wp-multisite/scripts/multisite_inspect.mjs`

**Step 1: Create the detection script**

First create directory: `mkdir -p skills/wp-multisite/scripts`

Create `skills/wp-multisite/scripts/multisite_inspect.mjs`:

```javascript
/**
 * multisite_inspect.mjs — Detect WordPress Multisite configuration.
 *
 * Scans for multisite indicators: wp-config.php constants, WP_SITES_CONFIG flags,
 * sunrise.php (domain mapping), .htaccess multisite rewrite rules.
 *
 * Usage:
 *   node multisite_inspect.mjs [--cwd=/path/to/check]
 *
 * Exit codes:
 *   0 — multisite indicators found
 *   1 — no multisite indicators found
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { argv, env, stdout, exit } from 'node:process';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFileSafe(filePath) {
  try { return readFileSync(filePath, 'utf-8'); } catch { return null; }
}

function existsSafe(filePath) {
  try { return existsSync(filePath); } catch { return false; }
}

// ---------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------

function detectWpConfig(cwd) {
  const paths = [
    join(cwd, 'wp-config.php'),
    join(cwd, '../wp-config.php'),  // wp-config one level up (common setup)
  ];

  for (const p of paths) {
    const content = readFileSafe(p);
    if (!content) continue;

    const multisite = /define\s*\(\s*['"]MULTISITE['"]\s*,\s*true\s*\)/i.test(content);
    const subdomain = content.match(/define\s*\(\s*['"]SUBDOMAIN_INSTALL['"]\s*,\s*(true|false)\s*\)/i);
    const domain = content.match(/define\s*\(\s*['"]DOMAIN_CURRENT_SITE['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);
    const pathMatch = content.match(/define\s*\(\s*['"]PATH_CURRENT_SITE['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);

    if (multisite) {
      return {
        found: true,
        path: p,
        subdomain_install: subdomain ? subdomain[1] === 'true' : null,
        domain_current_site: domain ? domain[1] : null,
        path_current_site: pathMatch ? pathMatch[1] : null,
      };
    }
  }
  return null;
}

function detectSitesConfig() {
  const sitesJson = env.WP_SITES_CONFIG;
  if (!sitesJson) return null;
  try {
    const sites = JSON.parse(sitesJson);
    const msSites = sites.filter(s => s.is_multisite === true);
    const cliSites = sites.filter(s => s.wp_path);
    return {
      multisite_sites: msSites.map(s => ({
        id: s.id,
        wp_path: s.wp_path || null,
        ssh_host: s.ssh_host || null,
        has_wpcli: !!s.wp_path,
      })),
      cli_ready_sites: cliSites.map(s => s.id),
      count: msSites.length,
    };
  } catch { return null; }
}

function detectSunrise(cwd) {
  const paths = [
    join(cwd, 'wp-content/sunrise.php'),
    join(cwd, 'sunrise.php'),
  ];
  for (const p of paths) {
    if (existsSafe(p)) {
      return { found: true, path: p };
    }
  }
  return null;
}

function detectHtaccessMultisite(cwd) {
  const content = readFileSafe(join(cwd, '.htaccess'));
  if (!content) return null;

  // WordPress multisite .htaccess has specific rewrite rules
  const hasMultisiteRules = /RewriteRule\s+\.\s+index\.php/i.test(content) &&
    (/upload/.test(content) || /files/.test(content) || /blogs\.dir/.test(content));

  return hasMultisiteRules ? { found: true } : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cwdArg = argv.find(a => a.startsWith('--cwd='));
  const cwd = cwdArg ? resolve(cwdArg.split('=')[1]) : process.cwd();

  const wpConfig = detectWpConfig(cwd);
  const sitesConfig = detectSitesConfig();
  const sunrise = detectSunrise(cwd);
  const htaccess = detectHtaccessMultisite(cwd);

  const signals = [];
  if (wpConfig) signals.push('wp_config_multisite');
  if (sitesConfig?.count > 0) signals.push('sites_config_multisite');
  if (sunrise) signals.push('sunrise_domain_mapping');
  if (htaccess) signals.push('htaccess_multisite_rules');

  const report = {
    tool: 'multisite_inspect',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cwd,
    found: signals.length > 0,
    signals,
    details: {
      wp_config: wpConfig || undefined,
      sites_config: sitesConfig || undefined,
      sunrise: sunrise || undefined,
      htaccess: htaccess || undefined,
    },
    recommendations: [],
  };

  if (wpConfig && !sitesConfig?.count) {
    report.recommendations.push('Multisite detected in wp-config.php but no site in WP_SITES_CONFIG has is_multisite: true');
  }
  if (sitesConfig?.count > 0) {
    const noCli = sitesConfig.multisite_sites.filter(s => !s.has_wpcli);
    if (noCli.length > 0) {
      report.recommendations.push(`Sites without wp_path (no wp-cli access): ${noCli.map(s => s.id).join(', ')}`);
    }
    report.recommendations.push(`${sitesConfig.count} multisite network(s) configured — 10 ms_* tools available`);
  }
  if (sunrise) {
    report.recommendations.push('sunrise.php detected — domain mapping is active');
  }

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(signals.length > 0 ? 0 : 1);
}

main();
```

**Step 2: Test detection script**

Run: `node skills/wp-multisite/scripts/multisite_inspect.mjs`
Expected: exit code 1 (no multisite indicators in plugin dev directory), JSON output with `found: false`

---

## Task 7: Create wp-multisite SKILL.md

**Files:**
- Create: `skills/wp-multisite/SKILL.md`

**Step 1: Create SKILL.md**

Create `skills/wp-multisite/SKILL.md`:

```markdown
---
name: wp-multisite
description: |
  This skill should be used when the user asks about "multisite", "network admin",
  "sub-sites", "domain mapping", "super admin", "network activate",
  "WordPress Multisite network", or any multisite network management operations.
version: 1.0.0
---

## Overview

WordPress Multisite network management via WP-CLI (10 MCP tools). Covers sub-site CRUD, network plugin management, Super Admin listing, network settings, and domain mapping guidance. Uses a hybrid approach: REST API where available, WP-CLI for network-only operations.

## When to Use

- User mentions multisite, network, sub-sites, or domain mapping
- User needs to create, activate, deactivate, or delete sub-sites
- User wants to network-activate or network-deactivate plugins
- User needs Super Admin listing or network settings
- User asks about migrating single-site to multisite or vice versa

## Prerequisites

WP-CLI access and multisite flag must be configured in `WP_SITES_CONFIG`:

```json
{
  "id": "mynetwork",
  "url": "https://network.example.com",
  "username": "superadmin",
  "password": "xxxx xxxx xxxx xxxx",
  "wp_path": "/var/www/wordpress",
  "ssh_host": "network.example.com",
  "ssh_user": "deploy",
  "ssh_key": "~/.ssh/id_rsa",
  "is_multisite": true
}
```

- `wp_path` — required for all wp-cli operations
- `ssh_host` / `ssh_user` — required for remote sites (omit for local)
- `is_multisite: true` — required flag to enable ms_* tools

## Detection

Run the detection script to check multisite presence:

```bash
node skills/wp-multisite/scripts/multisite_inspect.mjs
```

## Multisite Operations Decision Tree

1. **Sub-site management?**
   - List all sub-sites → `ms_list_sites`
   - Get sub-site details → `ms_get_site`
   - Create new sub-site → `ms_create_site`
   - Activate/deactivate → `ms_activate_site`
   - Delete sub-site → `ms_delete_site`

2. **Network plugin management?**
   - List all plugins (with network status) → `ms_list_network_plugins`
   - Network-activate plugin → `ms_network_activate_plugin`
   - Network-deactivate plugin → `ms_network_deactivate_plugin`

3. **Network administration?**
   - List Super Admins → `ms_list_super_admins`
   - Get network settings → `ms_get_network_settings`

4. **Domain mapping / network setup / migration?**
   - See reference files below (no dedicated MCP tool — use wp-cli via Bash)

## Recommended Agent

For complex multi-step multisite operations, use the `wp-site-manager` agent (which has a dedicated Multisite Network Management section).

## Additional Resources

### Reference Files

- **`references/network-setup.md`** — Sub-directory vs sub-domain, wp-config constants, installation
- **`references/site-management.md`** — CRUD sub-sites, templates, bulk operations
- **`references/domain-mapping.md`** — Custom domains, SSL, DNS CNAME, sunrise.php
- **`references/network-plugins.md`** — Network-activated vs per-site plugins, must-use plugins
- **`references/user-roles.md`** — Super Admin capabilities, site-level roles
- **`references/migration-multisite.md`** — Single to multisite and back, database tables

### Related Skills

- `wp-wpcli-and-ops` — WP-CLI command reference and multisite flags
- `wp-security` — Super Admin capabilities and multisite security
- `wp-deploy` — Deploy to multisite network
```

---

## Task 8: Create 6 reference files

**Files:**
- Create: `skills/wp-multisite/references/network-setup.md`
- Create: `skills/wp-multisite/references/site-management.md`
- Create: `skills/wp-multisite/references/domain-mapping.md`
- Create: `skills/wp-multisite/references/network-plugins.md`
- Create: `skills/wp-multisite/references/user-roles.md`
- Create: `skills/wp-multisite/references/migration-multisite.md`

**Step 1: Create directory and all 6 files**

First: `mkdir -p skills/wp-multisite/references`

Create each file with content specified in the substeps below.

**Step 1a: network-setup.md**

```markdown
# Network Setup

WordPress Multisite allows a single WordPress installation to host multiple websites (sub-sites) sharing the same codebase and database. Understanding the setup options is critical for architecture decisions.

## MCP Tools

| Tool | Usage |
|------|-------|
| `ms_get_network_settings` | View current network configuration |

## Sub-directory vs Sub-domain

| Mode | URL Pattern | Example | Requirements |
|------|------------|---------|-------------|
| Sub-directory | `example.com/site1/` | `example.com/blog/` | Default, works everywhere |
| Sub-domain | `site1.example.com` | `blog.example.com` | Wildcard DNS (`*.example.com`), wildcard SSL |

Decision factors:
- **Sub-directory**: simpler DNS, single SSL cert, better for related sites
- **Sub-domain**: each site feels independent, better for unrelated brands

## wp-config.php Constants

Required constants for multisite (set during network installation):

```php
define('WP_ALLOW_MULTISITE', true);     // Step 1: enables Network Setup menu
define('MULTISITE', true);               // Step 2: after network creation
define('SUBDOMAIN_INSTALL', false);      // true for sub-domain, false for sub-directory
define('DOMAIN_CURRENT_SITE', 'example.com');
define('PATH_CURRENT_SITE', '/');
define('SITE_ID_CURRENT_SITE', 1);
define('BLOG_ID_CURRENT_SITE', 1);
```

## Installation Procedure

1. Start with a fresh single-site WordPress installation
2. Add `define('WP_ALLOW_MULTISITE', true);` to wp-config.php
3. Navigate to Tools > Network Setup in wp-admin
4. Choose sub-directory or sub-domain
5. WordPress generates the remaining constants and .htaccess rules
6. Add the generated code to wp-config.php and .htaccess
7. Log in again — Network Admin menu appears

## .htaccess Rules (sub-directory mode)

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]

# add a trailing slash to /wp-admin
RewriteRule ^([_0-9a-zA-Z-]+/)?wp-admin$ $1wp-admin/ [R=301,L]

RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^([_0-9a-zA-Z-]+/)?(wp-(content|admin|includes).*) $2 [L]
RewriteRule ^([_0-9a-zA-Z-]+/)?(.*\.php)$ $2 [L]
RewriteRule . index.php [L]
```

## Tips and Gotchas

- **Cannot switch modes**: You cannot change from sub-directory to sub-domain (or vice versa) after network creation without a fresh install or complex migration.
- **Existing content**: If the single site already has content, sub-directory mode may conflict with existing page slugs.
- **SSL**: Sub-domain mode requires wildcard SSL (`*.example.com`). Let's Encrypt supports wildcard via DNS-01 challenge.
- **WP_ALLOW_MULTISITE vs MULTISITE**: `WP_ALLOW_MULTISITE` enables the setup UI; `MULTISITE` activates the network. They are different constants.
```

**Step 1b: site-management.md**

```markdown
# Site Management

Sub-site lifecycle in a WordPress Multisite network: creating, configuring, activating/deactivating, and deleting sites.

## MCP Tools

| Tool | Usage |
|------|-------|
| `ms_list_sites` | List all sub-sites with status |
| `ms_get_site` | Get details of a specific sub-site |
| `ms_create_site` | Create a new sub-site |
| `ms_activate_site` | Activate or deactivate a sub-site |
| `ms_delete_site` | Permanently delete a sub-site |

## Sub-site Lifecycle

```
Create → Active → [Deactivate → Archived/Spam/Deleted]
                 → [Delete permanently]
```

## Common Procedures

### List All Sub-sites

1. `ms_list_sites` — returns blog_id, url, registered date, status for all sites
2. Review the `archived`, `spam`, `deleted` flags for each

### Create a New Sub-site

1. `ms_create_site` with slug, title, admin email
2. WordPress creates the sub-site with default theme and plugins
3. The specified email becomes the sub-site admin

### Deactivate a Sub-site

1. `ms_activate_site` with `active: false` and the target blog_id
2. Deactivated sites return a "This site has been archived" message to visitors
3. Content and settings are preserved

### Delete a Sub-site

1. `ms_delete_site` with blog_id and `confirm: true`
2. **Permanent**: removes all content, settings, and uploads for that sub-site
3. Database tables for the sub-site are dropped

## Site Properties

| Property | Description |
|----------|-------------|
| `blog_id` | Unique numeric identifier |
| `domain` | Domain name of the sub-site |
| `path` | URL path (e.g., `/blog/` in sub-directory mode) |
| `registered` | Creation timestamp |
| `last_updated` | Last modification timestamp |
| `public` | Whether the site appears in search results |
| `archived` | Manually archived by network admin |
| `spam` | Marked as spam |
| `deleted` | Soft-deleted (not permanently removed) |

## Tips and Gotchas

- **Blog ID 1**: The main site always has `blog_id: 1`. Do not delete it.
- **Uploads**: Each sub-site has its own uploads directory under `wp-content/uploads/sites/{blog_id}/`.
- **Database tables**: Each sub-site gets its own set of tables with prefix `wp_{blog_id}_` (e.g., `wp_2_posts`, `wp_2_options`).
- **Default content**: New sub-sites get a "Hello World" post and sample page, similar to a fresh WordPress install.
- **Themes**: Sub-sites can only use themes that are network-enabled or network-activated. See `network-plugins.md`.
```

**Step 1c: domain-mapping.md**

```markdown
# Domain Mapping

Domain mapping allows each sub-site in a WordPress Multisite network to use its own custom domain instead of the default sub-directory or sub-domain URL.

## Overview

| Default URL | Mapped Domain |
|-------------|---------------|
| `network.com/shopA/` | `shopA.com` |
| `shopB.network.com` | `shopB.com` |

Since WordPress 4.5+, domain mapping is built into core (no plugin required for basic mapping).

## Setup Procedure

### 1. DNS Configuration

For each custom domain, create a DNS record pointing to the network server:

| Record Type | Name | Value |
|-------------|------|-------|
| A | `shopA.com` | `<server-ip>` |
| CNAME | `www.shopA.com` | `shopA.com` |

### 2. WordPress Configuration

In Network Admin > Sites > Edit Site > Domain:
- Change the site URL to the custom domain

Or via WP-CLI:
```bash
wp site list  # find the blog_id
wp option update home 'https://shopA.com' --url=network.com/shopA/
wp option update siteurl 'https://shopA.com' --url=network.com/shopA/
```

### 3. SSL Certificate

Each mapped domain needs its own SSL certificate:
- **Let's Encrypt**: Use Certbot with `--domains shopA.com,shopB.com`
- **Wildcard**: Only covers `*.network.com`, NOT custom domains
- **Multi-domain SAN cert**: Can cover all mapped domains in one cert

### 4. Web Server Configuration

The web server must accept requests for all mapped domains. In Nginx:

```nginx
server {
    server_name shopA.com shopB.com network.com *.network.com;
    # ... standard WordPress config
}
```

## sunrise.php (Advanced)

For complex domain mapping logic, WordPress supports a `sunrise.php` drop-in:

- Location: `wp-content/sunrise.php`
- Loaded very early in the WordPress bootstrap (before plugins)
- Must be enabled: `define('SUNRISE', true);` in wp-config.php
- Used by plugins like "WordPress MU Domain Mapping" (legacy) or "Mercator"

## Tips and Gotchas

- **Cookie domain**: After mapping, update `COOKIE_DOMAIN` if login issues occur.
- **Mixed content**: Ensure all mapped domains use HTTPS to avoid mixed content warnings.
- **Caching**: Flush caches after domain mapping changes — both server-side and CDN.
- **Search Console**: Register each mapped domain separately in Google Search Console.
- **Reverse proxy**: If using Cloudflare or similar, configure the DNS to point to the origin server's IP, not the CDN.
```

**Step 1d: network-plugins.md**

```markdown
# Network Plugins and Themes

In WordPress Multisite, plugins and themes can be managed at the network level (Super Admin) or at the individual site level (Site Admin). Understanding the activation modes prevents conflicts.

## MCP Tools

| Tool | Usage |
|------|-------|
| `ms_list_network_plugins` | List all plugins with network activation status |
| `ms_network_activate_plugin` | Activate a plugin across the entire network |
| `ms_network_deactivate_plugin` | Deactivate a plugin from the entire network |

## Plugin Activation Modes

| Mode | Who Controls | Scope | Use Case |
|------|-------------|-------|----------|
| Network-activated | Super Admin | All sites | Security plugins, caching, essential functionality |
| Per-site activated | Site Admin | One site | Site-specific features |
| Must-use (mu-plugins) | Developer | All sites, always on | Core business logic, cannot be deactivated |

## Procedures

### Network-Activate a Plugin

1. `ms_network_activate_plugin` with the plugin slug
2. The plugin immediately activates on ALL sub-sites
3. Site Admins cannot deactivate a network-activated plugin

### Network-Deactivate a Plugin

1. `ms_network_deactivate_plugin` with the plugin slug
2. The plugin deactivates on ALL sub-sites simultaneously
3. Per-site activation state is lost

### Check Plugin Status

1. `ms_list_network_plugins` — returns all plugins with their status
2. Look for `network_only: true` in the response for network-activated plugins

## Theme Management

Themes in multisite work differently from plugins:

| Action | Level | Effect |
|--------|-------|--------|
| Network Enable | Super Admin | Theme becomes available for site admins to activate |
| Network Disable | Super Admin | Theme removed from site admin's theme list |
| Activate | Site Admin | Theme becomes active for that specific site |

A theme must be **network-enabled** before any site admin can use it.

## Must-Use Plugins

- Location: `wp-content/mu-plugins/`
- Always active on ALL sites — cannot be deactivated via UI
- Loaded before regular plugins
- No activation hooks (code runs immediately)
- Useful for: custom login, security rules, performance optimizations

## Tips and Gotchas

- **Network activation is immediate**: No confirmation dialog. All sites are affected instantly.
- **Plugin conflicts**: A network-activated plugin may conflict with per-site plugins. Test thoroughly.
- **Updates**: Plugin updates on multisite affect all sites. Test in staging first.
- **Memory**: Each network-activated plugin increases memory usage across all sites.
- **Drop-in replacements**: `object-cache.php`, `advanced-cache.php`, `db.php` are shared across all sites.
```

**Step 1e: user-roles.md**

```markdown
# User Roles in Multisite

WordPress Multisite adds a Super Admin role above the standard role hierarchy. Users can have different roles on different sub-sites within the same network.

## MCP Tools

| Tool | Usage |
|------|-------|
| `ms_list_super_admins` | List all Super Admin users in the network |

## Role Hierarchy

| Role | Scope | Key Capabilities |
|------|-------|-----------------|
| Super Admin | Entire network | All capabilities on all sites, network settings, site CRUD |
| Administrator | Single site | Full control of one sub-site (cannot install plugins/themes) |
| Editor | Single site | Manage and publish all posts on one site |
| Author | Single site | Publish own posts |
| Contributor | Single site | Write drafts, cannot publish |
| Subscriber | Single site | Read-only access |

## Super Admin vs Administrator (Multisite)

| Capability | Super Admin | Site Administrator |
|-----------|-------------|-------------------|
| Install plugins | Yes | No |
| Install themes | Yes | No |
| Create/delete sub-sites | Yes | No |
| Network activate plugins | Yes | No |
| Edit wp-config.php | Yes | No |
| Manage network settings | Yes | No |
| Edit files (theme/plugin editor) | Yes | No (disabled by default) |
| Manage site users | Yes | Yes (own site only) |
| Manage site options | Yes | Yes (own site only) |

## User Registration Modes

Network-wide setting (Network Admin > Settings):

| Mode | Description |
|------|-------------|
| Registration disabled | No one can register |
| User accounts may be registered | Users can register but not create sites |
| Logged-in users may register new sites | Existing users can create sub-sites |
| Both user accounts and sites can be registered | Open registration for users and sites |

## Common Operations

### List Super Admins
1. `ms_list_super_admins` — returns usernames with super admin status

### Add Super Admin (via wp-cli)
```bash
wp super-admin add username
```

### Remove Super Admin (via wp-cli)
```bash
wp super-admin remove username
```

### Add User to Sub-site (via wp-cli)
```bash
wp user set-role username editor --url=site1.example.com
```

## Tips and Gotchas

- **Super Admin bypass**: Super Admins bypass all capability checks. Use this role sparingly.
- **User exists once**: A user account exists once in the network but can have different roles on different sub-sites.
- **Cannot demote yourself**: The last Super Admin cannot remove their own super admin status.
- **wp-admin vs network-admin**: Super Admins see both site-level wp-admin and network-level wp-admin/network/.
- **Plugin capability checks**: Plugins using `current_user_can()` should work correctly with multisite, but some older plugins may not distinguish Super Admin from site Administrator.
```

**Step 1f: migration-multisite.md**

```markdown
# Migration: Single-site to Multisite and Back

Migrating between single-site and multisite WordPress installations requires careful planning due to database structure differences.

## Single-site to Multisite

### Prerequisites
- WordPress installed at domain root (not a subdirectory)
- All plugins deactivated
- Permalink structure using "pretty permalinks" (not plain)
- Full database and file backup

### Procedure

1. **Backup**: Full database dump + wp-content directory
2. **Deactivate all plugins** via wp-admin or wp-cli
3. **Enable multisite**: Add `define('WP_ALLOW_MULTISITE', true);` to wp-config.php
4. **Network Setup**: Navigate to Tools > Network Setup, choose sub-directory or sub-domain
5. **Apply configuration**: Copy generated code to wp-config.php and .htaccess
6. **Re-login**: WordPress redirects to login — sign in as Super Admin
7. **Re-activate plugins**: One by one, test each plugin for multisite compatibility
8. **Verify**: Check permalink structure, media uploads, and user roles

### What Changes in the Database

| Component | Before | After |
|-----------|--------|-------|
| Tables | `wp_posts`, `wp_options`, ... | Same (become site 1) |
| New tables | — | `wp_blogs`, `wp_site`, `wp_sitemeta`, `wp_registration_log`, `wp_signups` |
| Options | `wp_options` | `wp_options` (site 1) + `wp_sitemeta` (network) |

## Multisite to Single-site

This migration is more complex because you need to extract one sub-site from the network.

### Procedure (extract sub-site)

1. **Backup**: Full database dump + wp-content directory
2. **Export content**: Use WordPress Export (Tools > Export) on the target sub-site
3. **Fresh WordPress install**: Install a clean single-site WordPress
4. **Import content**: Use WordPress Importer plugin
5. **Copy uploads**: Copy `wp-content/uploads/sites/{blog_id}/` to `wp-content/uploads/`
6. **Activate theme and plugins**: Install and activate the same theme and plugins
7. **Verify**: Check media URLs, internal links, shortcodes

### Alternative: Direct Database Extraction

For large sites where export/import is impractical:

1. Export tables with prefix `wp_{blog_id}_` (e.g., `wp_2_posts`, `wp_2_options`)
2. Rename tables to standard prefix (e.g., `wp_2_posts` → `wp_posts`)
3. Update `siteurl` and `home` in `wp_options`
4. Search-replace old URLs in content
5. Remove multisite constants from wp-config.php
6. Update .htaccess to standard WordPress rules

## WP-CLI Migration Commands

```bash
# Export single site from multisite
wp db export site-backup.sql --url=subsite.example.com

# Search-replace URLs after migration
wp search-replace 'subsite.example.com' 'newdomain.com' --all-tables

# Export content as WXR
wp export --url=subsite.example.com --dir=/tmp/exports/
```

## Tips and Gotchas

- **Media paths**: Multisite stores uploads in `uploads/sites/{blog_id}/`. After migration to single-site, media URLs need search-replace.
- **User roles**: Users may have different roles on different sub-sites. When extracting, only the target site's role assignments transfer.
- **Plugins**: Some plugins store network-wide options in `wp_sitemeta`. These are lost when extracting to single-site.
- **Test first**: Always perform migration on a staging environment before production.
- **Backup twice**: Keep backups of both the source (multisite) and target (single-site) before starting.
```

---

## Task 9: Update wp-site-manager agent

**Files:**
- Modify: `agents/wp-site-manager.md`

**Step 1: Add Multisite section and update delegation table**

After the "### Multi-Site Operations" section (after line 103), add a new section:

```markdown

### Multisite Network Management
For WordPress Multisite networks (sites with `is_multisite: true` in WP_SITES_CONFIG):

**Prerequisites check:**
1. Verify the site is multisite: `ms_list_sites` (will error if not multisite)
2. Verify wp-cli access is configured (`wp_path` in config)

**Sub-site operations:**
- List sub-sites → `ms_list_sites`
- Create sub-site → `ms_create_site` (slug, title, admin email)
- Activate/deactivate → `ms_activate_site`
- Delete → `ms_delete_site` (requires `confirm: true`)

**Network administration:**
- List plugins with network status → `ms_list_network_plugins`
- Network-activate → `ms_network_activate_plugin`
- Network-deactivate → `ms_network_deactivate_plugin`
- List Super Admins → `ms_list_super_admins`
- Network settings → `ms_get_network_settings`

**Safety rules for multisite:**
- NEVER delete blog_id 1 (main site)
- ALWAYS confirm before network-activating plugins (affects ALL sites)
- Announce which network you're operating on when multiple multisite networks are configured
```

Also update the Specialized Agents delegation table to add multisite cross-reference. In the table at the end (line 124), add a row:

```markdown
| Multisite network management | `wp-site-manager` (this agent) | Sub-sites, network plugins, Super Admin — see section above |
```

---

## Task 10: Update router decision-tree.md to v6

**Files:**
- Modify: `skills/wordpress-router/references/decision-tree.md`

**Step 1: Update version header**

Change line 1 from:
```
# Router decision tree (v4 — development + local environment + operations)
```
to:
```
# Router decision tree (v6 — development + local environment + operations + multisite)
```

**Step 2: Add multisite keywords to Step 0**

In the "Keywords that indicate **operations**:" section (line 17), add multisite keywords:

Change:
```
deploy, push to production, audit, security check, backup, restore, migrate, move site, create post, manage content, site status, check plugins, performance check, SEO audit, WooCommerce, prodotto, ordine, coupon, negozio, catalogo, inventario, vendite, carrello
```
to:
```
deploy, push to production, audit, security check, backup, restore, migrate, move site, create post, manage content, site status, check plugins, performance check, SEO audit, WooCommerce, prodotto, ordine, coupon, negozio, catalogo, inventario, vendite, carrello, multisite, network, sub-site, sub-sito, domain mapping, super admin, network activate
```

**Step 3: Add multisite routing entry to Step 2b**

After the WooCommerce entry (line 90), add:

```markdown
- **Multisite / network / sub-sites / domain mapping / super admin / network activate**
  → `wp-multisite` skill + `wp-site-manager` agent
```

---

## Task 11: Add cross-references to existing skills

**Files:**
- Modify: `skills/wp-wpcli-and-ops/SKILL.md`
- Modify: `skills/wp-security/SKILL.md`

**Step 1: Add cross-ref to wp-wpcli-and-ops SKILL.md**

Add at the end of the file:

```markdown

### Multisite Operations

For WordPress Multisite network management (sub-sites, network plugins, Super Admin), see the `wp-multisite` skill which provides 10 dedicated MCP tools.
```

**Step 2: Add cross-ref to wp-security SKILL.md**

Add at the end of the file:

```markdown

### Multisite Security

For Super Admin capabilities and multisite-specific security considerations, see the `wp-multisite` skill (`references/user-roles.md`).
```

---

## Task 12: Version bump + CHANGELOG

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `package.json`
- Modify: `CHANGELOG.md`

**Step 1: plugin.json — version 1.9.0**

Update `version` from `"1.8.0"` to `"1.9.0"`.
Update `description` to mention 26 skills, 81+ MCP tools, multisite.

**Step 2: package.json — version 1.9.0**

Update `version` from `"1.8.0"` to `"1.9.0"`.
Add `"multisite"` and `"network"` to `keywords` array.

**Step 3: CHANGELOG.md — add v1.9.0 entry**

Add at the top (after the header):

```markdown
## [1.9.0] — 2026-02-28

### Added
- **WordPress Multisite support** — 10 new MCP tools for network management
- **WP-CLI execution module** (`wpcli.ts`) — local and SSH remote command execution
- **New skill**: `wp-multisite` with 6 reference files (network setup, site management, domain mapping, network plugins, user roles, migration)
- **Detection script**: `multisite_inspect.mjs` — detects multisite configuration
- **SiteConfig extended**: `wp_path`, `ssh_host`, `ssh_user`, `ssh_key`, `ssh_port`, `is_multisite` fields
- **Router v6**: multisite keywords and routing to wp-multisite skill + wp-site-manager agent

### New MCP Tools (10)
- `ms_list_sites` — List all sub-sites in the network
- `ms_get_site` — Get sub-site details
- `ms_create_site` — Create a new sub-site
- `ms_activate_site` — Activate or deactivate a sub-site
- `ms_delete_site` — Delete a sub-site (with safety gate)
- `ms_list_network_plugins` — List plugins with network activation status (REST)
- `ms_network_activate_plugin` — Network-activate a plugin (wp-cli)
- `ms_network_deactivate_plugin` — Network-deactivate a plugin (wp-cli)
- `ms_list_super_admins` — List Super Admin users (wp-cli)
- `ms_get_network_settings` — Get network-wide settings (wp-cli)

### Changed
- `wp-site-manager` agent: added Multisite Network Management section
- Router decision-tree.md upgraded to v6 with multisite keywords
- `wp-wpcli-and-ops` and `wp-security` skills: added multisite cross-references
```

**Step 4: Build final**

Run: `cd servers/wp-rest-bridge && npx tsc`
Expected: clean build, 81 total tools

---

## Execution Order

```
Phase 1 — TypeScript (sequential, dependencies):
  Task 1: types.ts (WPNetworkSite)
  Task 2: wordpress.ts (SiteConfig) + wpcli.ts (NEW)
  Task 3: multisite-sites.ts (5 tools)
  Task 4: multisite-network.ts (5 tools)
  Task 5: index.ts (register 10 tools) + build

Phase 2 — Skill & Detection (parallelizable):
  Task 6: multisite_inspect.mjs
  Task 7: SKILL.md
  Task 8: 6 reference files

Phase 3 — Integration (parallelizable):
  Task 9: wp-site-manager.md update
  Task 10: decision-tree.md → v6
  Task 11: cross-references (2 SKILL.md)

Phase 4 — Finalize:
  Task 12: version bump + CHANGELOG + final build
```
