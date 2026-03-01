# Tier 3 WCOP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the WCOP (WordPress Content Orchestration Platform) transformation by adding Social/Email Connectors (v2.4.0), Google Search Console Integration (v2.5.0), and AI Content Optimization (v2.6.0).

**Architecture:** Connector-First approach — new TypeScript tool files in `servers/wp-rest-bridge/src/tools/` for external API integration (Mailchimp, Buffer, SendGrid, GSC), plus Claude-native skill procedures for AI content optimization. Each service has independent auth via SiteConfig extension.

**Tech Stack:** TypeScript (WP REST Bridge), Node.js MCP SDK, axios, googleapis (v2.5.0), zod validation

---

## Release 1: v2.4.0 — Social/Email Connectors

### Task 1: Extend TypeScript Types

**Files:**
- Modify: `servers/wp-rest-bridge/src/types.ts` (append after line 271, after `WPNetworkSite`)

**Step 1: Add connector types to types.ts**

Append these interfaces after the existing `WPNetworkSite` interface:

```typescript
// ── Social/Email Connector Types ─────────────────────────────────────

export interface MCMailchimpAudience {
  id: string;
  name: string;
  member_count: number;
  campaign_defaults: { from_name: string; from_email: string; subject: string };
  stats: { member_count: number; unsubscribe_count: number; open_rate: number; click_rate: number };
  date_created: string;
}

export interface MCCampaign {
  id: string;
  type: string;
  status: string;
  emails_sent: number;
  send_time: string;
  settings: { subject_line: string; from_name: string; reply_to: string };
  report_summary?: { opens: number; unique_opens: number; clicks: number; subscriber_clicks: number };
}

export interface MCCampaignReport {
  id: string;
  campaign_title: string;
  emails_sent: number;
  opens: { opens_total: number; unique_opens: number; open_rate: number };
  clicks: { clicks_total: number; unique_clicks: number; click_rate: number };
  unsubscribed: number;
  bounces: { hard_bounces: number; soft_bounces: number };
}

export interface BufProfile {
  id: string;
  service: string;
  formatted_username: string;
  avatar: string;
  counts: { sent: number; pending: number };
}

export interface BufUpdate {
  id: string;
  text: string;
  profile_id: string;
  status: string;
  sent_at?: number;
  due_at?: number;
  statistics?: { clicks: number; reach: number; impressions: number };
}

export interface SGEmailRequest {
  personalizations: { to: { email: string; name?: string }[]; subject?: string }[];
  from: { email: string; name?: string };
  subject: string;
  content: { type: string; value: string }[];
  template_id?: string;
}

export interface SGTemplate {
  id: string;
  name: string;
  generation: string;
  updated_at: string;
  versions: { id: string; name: string; active: number; subject: string }[];
}

export interface SGStats {
  date: string;
  stats: { metrics: { requests: number; delivered: number; opens: number; clicks: number; bounces: number; spam_reports: number } }[];
}
```

**Step 2: Verify file compiles**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/types.ts
git commit -m "feat(types): add Mailchimp, Buffer, SendGrid type interfaces"
```

---

### Task 2: Extend SiteConfig and wordpress.ts

**Files:**
- Modify: `servers/wp-rest-bridge/src/wordpress.ts`

**Step 1: Extend SiteConfig interface (line 4-18)**

Add fields after `is_multisite`:

```typescript
  // Social/Email connector API keys (optional)
  mailchimp_api_key?: string;    // Format: "key-dc" (e.g., "abc123-us21")
  buffer_access_token?: string;  // Buffer OAuth access token
  sendgrid_api_key?: string;     // SendGrid API key (starts with "SG.")
```

**Step 2: Add connector client maps after line 52 (wcSiteClients)**

```typescript
const mcSiteClients = new Map<string, AxiosInstance>();
const bufSiteClients = new Map<string, AxiosInstance>();
const sgSiteClients = new Map<string, AxiosInstance>();
```

**Step 3: Add init functions for each connector**

After `initWcClient()` function (after line 191), add:

```typescript
/**
 * Initialize a Mailchimp client for a site.
 * API key format: "key-dc" where dc is the data center (e.g., "us21").
 */
async function initMailchimpClient(id: string, apiKey: string) {
  const dc = apiKey.split('-').pop() || 'us21';
  const client = axios.create({
    baseURL: `https://${dc}.api.mailchimp.com/3.0/`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
    },
    timeout: DEFAULT_TIMEOUT_MS,
  });
  mcSiteClients.set(id, client);
}

/**
 * Initialize a Buffer client for a site.
 */
async function initBufferClient(id: string, accessToken: string) {
  const client = axios.create({
    baseURL: 'https://api.bufferapp.com/1/',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { access_token: accessToken },
    timeout: DEFAULT_TIMEOUT_MS,
  });
  bufSiteClients.set(id, client);
}

/**
 * Initialize a SendGrid client for a site.
 */
async function initSendGridClient(id: string, apiKey: string) {
  const client = axios.create({
    baseURL: 'https://api.sendgrid.com/v3/',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    timeout: DEFAULT_TIMEOUT_MS,
  });
  sgSiteClients.set(id, client);
}
```

**Step 4: Call init functions in initWordPress() loop**

After the WooCommerce init block (line 109-114), add:

```typescript
  // Initialize Social/Email connector clients
  for (const site of sites) {
    if (site.mailchimp_api_key) {
      await initMailchimpClient(site.id, site.mailchimp_api_key);
      logToStderr(`Initialized Mailchimp for site: ${site.id}`);
    }
    if (site.buffer_access_token) {
      await initBufferClient(site.id, site.buffer_access_token);
      logToStderr(`Initialized Buffer for site: ${site.id}`);
    }
    if (site.sendgrid_api_key) {
      await initSendGridClient(site.id, site.sendgrid_api_key);
      logToStderr(`Initialized SendGrid for site: ${site.id}`);
    }
  }
```

**Step 5: Add exported request functions and has-checks**

After `makeWooCommerceRequest()` (after line 468), add:

```typescript
// ── Mailchimp Request Interface ──────────────────────────────────

export function hasMailchimp(siteId?: string): boolean {
  const id = siteId || activeSiteId;
  return mcSiteClients.has(id);
}

export async function makeMailchimpRequest(
  method: string,
  endpoint: string,
  data?: any,
  siteId?: string
): Promise<any> {
  const id = siteId || activeSiteId;
  const client = mcSiteClients.get(id);
  if (!client) {
    throw new Error(
      `Mailchimp not configured for site "${id}". Add mailchimp_api_key to WP_SITES_CONFIG.`
    );
  }
  const limiter = getLimiter(id);
  await limiter.acquire();
  try {
    const response = await client.request({ method, url: endpoint, data: method !== 'GET' ? data : undefined, params: method === 'GET' ? data : undefined });
    return response.data;
  } finally {
    limiter.release();
  }
}

// ── Buffer Request Interface ─────────────────────────────────────

export function hasBuffer(siteId?: string): boolean {
  const id = siteId || activeSiteId;
  return bufSiteClients.has(id);
}

export async function makeBufferRequest(
  method: string,
  endpoint: string,
  data?: any,
  siteId?: string
): Promise<any> {
  const id = siteId || activeSiteId;
  const client = bufSiteClients.get(id);
  if (!client) {
    throw new Error(
      `Buffer not configured for site "${id}". Add buffer_access_token to WP_SITES_CONFIG.`
    );
  }
  const limiter = getLimiter(id);
  await limiter.acquire();
  try {
    const response = await client.request({ method, url: endpoint, data: method !== 'GET' ? data : undefined, params: method === 'GET' ? data : undefined });
    return response.data;
  } finally {
    limiter.release();
  }
}

// ── SendGrid Request Interface ───────────────────────────────────

export function hasSendGrid(siteId?: string): boolean {
  const id = siteId || activeSiteId;
  return sgSiteClients.has(id);
}

export async function makeSendGridRequest(
  method: string,
  endpoint: string,
  data?: any,
  siteId?: string
): Promise<any> {
  const id = siteId || activeSiteId;
  const client = sgSiteClients.get(id);
  if (!client) {
    throw new Error(
      `SendGrid not configured for site "${id}". Add sendgrid_api_key to WP_SITES_CONFIG.`
    );
  }
  const limiter = getLimiter(id);
  await limiter.acquire();
  try {
    const response = await client.request({ method, url: endpoint, data: method !== 'GET' ? data : undefined, params: method === 'GET' ? data : undefined });
    return response.data;
  } finally {
    limiter.release();
  }
}
```

**Step 6: Verify compilation**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add servers/wp-rest-bridge/src/wordpress.ts
git commit -m "feat(bridge): add Mailchimp, Buffer, SendGrid client init and request functions"
```

---

### Task 3: Mailchimp MCP Tools

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/mailchimp.ts`

**Step 1: Create the tool file**

Follow exact pattern of `wc-webhooks.ts`. File exports `mailchimpTools: Tool[]` and `mailchimpHandlers: Record<string, Function>`. Implement 7 tools: `mc_list_audiences`, `mc_get_audience_members`, `mc_create_campaign`, `mc_update_campaign_content`, `mc_send_campaign`, `mc_get_campaign_report`, `mc_add_subscriber`.

Each tool:
- Imports `makeMailchimpRequest` from `../wordpress.js`
- Uses zod schema for input validation
- Returns JSON stringified response
- Checks `hasMailchimp()` before executing

**Step 2: Verify compilation**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/mailchimp.ts
git commit -m "feat(mc): add 7 Mailchimp MCP tools"
```

---

### Task 4: Buffer MCP Tools

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/buffer.ts`

**Step 1: Create the tool file**

Same pattern. Exports `bufferTools: Tool[]` and `bufferHandlers: Record<string, Function>`. Implement 5 tools: `buf_list_profiles`, `buf_create_update`, `buf_list_pending`, `buf_list_sent`, `buf_get_analytics`.

Each tool imports `makeBufferRequest` from `../wordpress.js`.

**Step 2: Verify compilation**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/buffer.ts
git commit -m "feat(buf): add 5 Buffer MCP tools"
```

---

### Task 5: SendGrid MCP Tools

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/sendgrid.ts`

**Step 1: Create the tool file**

Same pattern. Exports `sendgridTools: Tool[]` and `sendgridHandlers: Record<string, Function>`. Implement 6 tools: `sg_send_email`, `sg_list_templates`, `sg_get_template`, `sg_list_contacts`, `sg_add_contacts`, `sg_get_stats`.

Each tool imports `makeSendGridRequest` from `../wordpress.js`.

**Step 2: Verify compilation**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/sendgrid.ts
git commit -m "feat(sg): add 6 SendGrid MCP tools"
```

---

### Task 6: Register Tools in index.ts and Build

**Files:**
- Modify: `servers/wp-rest-bridge/src/tools/index.ts`

**Step 1: Add imports**

After the `wc-webhooks` import (line 19), add:

```typescript
import { mailchimpTools, mailchimpHandlers } from './mailchimp.js';
import { bufferTools, bufferHandlers } from './buffer.js';
import { sendgridTools, sendgridHandlers } from './sendgrid.js';
```

**Step 2: Add to allTools array**

After `...wcWebhookTools` (line 39), add:

```typescript
  ...mailchimpTools,             // 7 tools
  ...bufferTools,                // 5 tools
  ...sendgridTools,              // 6 tools
```

**Step 3: Add to toolHandlers object**

After `...wcWebhookHandlers` (line 60), add:

```typescript
  ...mailchimpHandlers,
  ...bufferHandlers,
  ...sendgridHandlers,
```

**Step 4: Build the project**

Run: `cd servers/wp-rest-bridge && npx tsc`
Expected: Build succeeds, new .js and .d.ts files in build/tools/

**Step 5: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/index.ts servers/wp-rest-bridge/build/
git commit -m "feat(bridge): register Mailchimp, Buffer, SendGrid tools — 85 → 103 total"
```

---

### Task 7: Detection Script

**Files:**
- Create: `skills/wp-social-email/scripts/distribution_inspect.mjs`

**Step 1: Create detection script**

Node.js .mjs script that checks:
- `WP_SITES_CONFIG` env var for mailchimp_api_key, buffer_access_token, sendgrid_api_key
- WordPress plugins (Mailchimp for WP, Jetpack, JETWSE)
- Content volume (number of published posts — indicator of distribution readiness)
- Outputs JSON: `{ mailchimp: boolean, buffer: boolean, sendgrid: boolean, content_ready: boolean, recommendation: string }`

Follow pattern of existing scripts like `repurposing_inspect.mjs` and `webhook_inspect.mjs`.

**Step 2: Commit**

```bash
git add skills/wp-social-email/scripts/distribution_inspect.mjs
git commit -m "feat(detect): add distribution_inspect.mjs for Mailchimp/Buffer/SendGrid"
```

---

### Task 8: Skill wp-social-email (SKILL.md + 6 references)

**Files:**
- Create: `skills/wp-social-email/SKILL.md`
- Create: `skills/wp-social-email/references/mailchimp-integration.md`
- Create: `skills/wp-social-email/references/buffer-social-publishing.md`
- Create: `skills/wp-social-email/references/sendgrid-transactional.md`
- Create: `skills/wp-social-email/references/content-to-distribution.md`
- Create: `skills/wp-social-email/references/audience-segmentation.md`
- Create: `skills/wp-social-email/references/distribution-analytics.md`

**Step 1: Create SKILL.md**

Frontmatter: name `wp-social-email`, description with trigger keywords (social, email, Mailchimp, Buffer, SendGrid, distribution, newsletter, campaign), version 1.0.0.

Structure: Overview, When to Use, Decision Tree (Section 1: Mailchimp, Section 2: Buffer, Section 3: SendGrid, Section 4: Content-to-Distribution workflow, Section 5: Audience segmentation, Section 6: Analytics), Reference Files table, Recommended Agent (`wp-distribution-manager`), Related Skills.

**Step 2: Create 6 reference files**

Each 80-150 lines with actionable procedures, MCP tool references, and examples.

**Step 3: Commit**

```bash
git add skills/wp-social-email/
git commit -m "feat(skill): add wp-social-email skill with 6 reference files"
```

---

### Task 9: Agent wp-distribution-manager

**Files:**
- Create: `agents/wp-distribution-manager.md`

**Step 1: Create agent file**

Follow pattern of `wp-ecommerce-manager.md`. Frontmatter: name `wp-distribution-manager`, color `indigo`, description with examples, model `inherit`, tools `Read, Grep, Glob, Bash, WebFetch, WebSearch`.

Body: 5 procedures (detect services, fetch WP content, format for channel, publish/schedule, track analytics), report template, safety notes (confirm before send), related skills.

**Step 2: Commit**

```bash
git add agents/wp-distribution-manager.md
git commit -m "feat(agent): add wp-distribution-manager (indigo)"
```

---

### Task 10: Safety Hooks

**Files:**
- Modify: `hooks/hooks.json`

**Step 1: Add 2 new hooks**

In the PreToolUse array, after the `wc_delete_webhook` entry, add:

```json
,
{
  "matcher": "mcp__wp-rest-bridge__mc_send_campaign",
  "hooks": [
    {
      "type": "prompt",
      "prompt": "The agent is about to SEND a Mailchimp email campaign. This will deliver emails to all subscribers in the target audience. Verify the user explicitly requested this send and has reviewed the campaign content. Respond 'approve' only if the send was clearly intentional."
    }
  ]
},
{
  "matcher": "mcp__wp-rest-bridge__sg_send_email",
  "hooks": [
    {
      "type": "prompt",
      "prompt": "The agent is about to SEND an email via SendGrid. Verify the user explicitly requested this email send and the recipient list is correct. Respond 'approve' only if intentional."
    }
  ]
}
```

**Step 2: Commit**

```bash
git add hooks/hooks.json
git commit -m "feat(hooks): add safety gates for mc_send_campaign and sg_send_email"
```

---

### Task 11: Router v11 + Cross-references

**Files:**
- Modify: `skills/wordpress-router/SKILL.md` (version reference)
- Modify: `skills/wordpress-router/references/decision-tree.md` (add keywords + routing)
- Modify: `skills/wp-content-repurposing/SKILL.md` (add cross-ref)
- Modify: `skills/wp-webhooks/SKILL.md` (add cross-ref)
- Modify: `skills/wp-content/SKILL.md` (add cross-ref)

**Step 1: Update decision-tree.md**

- Header: change "v10" to "v11", add "+ social/email distribution" to the parenthetical
- Add keywords in Step 0 operations list: `social publish, schedule post, Buffer, email campaign, Mailchimp, SendGrid, transactional email, content distribution, newsletter send`
- Add routing entry in Step 2b after multi-language network entry:
  ```
  - **Social/email distribution / publish to social / schedule post / email campaign / Mailchimp / Buffer / SendGrid / newsletter / transactional email / content distribution**
    → `wp-social-email` skill + `wp-distribution-manager` agent
  ```

**Step 2: Update cross-references**

- `wp-content-repurposing/SKILL.md`: add to Related Skills: `- **wp-social-email** — publish repurposed content to social and email channels`
- `wp-webhooks/SKILL.md`: add to Related Skills: `- **wp-social-email** — direct publishing to social/email (alternative to webhook-based distribution)`
- `wp-content/SKILL.md`: add to Related Skills: `- **wp-social-email** — distribute content to social media and email after creation`

**Step 3: Commit**

```bash
git add skills/wordpress-router/ skills/wp-content-repurposing/SKILL.md skills/wp-webhooks/SKILL.md skills/wp-content/SKILL.md
git commit -m "feat(router): upgrade to v11 with social/email distribution routing"
```

---

### Task 12: Version Bump + CHANGELOG + Build

**Files:**
- Modify: `.claude-plugin/plugin.json` (version → 2.4.0, description update)
- Modify: `package.json` (version → 2.4.0, description update)
- Modify: `CHANGELOG.md` (add v2.4.0 entry)

**Step 1: Update versions and CHANGELOG**

plugin.json: version "2.4.0", update description to mention 103 tools, 34 skills, 12 agents, social/email connectors.
package.json: version "2.4.0", update description.
CHANGELOG.md: add full v2.4.0 entry with Added (18 tools, 1 skill, 1 agent, 1 detection script, 2 safety hooks) and Changed (router v11, cross-references, tool count 85 → 103).

**Step 2: Final build**

Run: `cd servers/wp-rest-bridge && npx tsc`

**Step 3: Stage, commit, push**

```bash
git add .claude-plugin/plugin.json package.json CHANGELOG.md servers/wp-rest-bridge/build/
git commit -m "feat: add Social/Email Connectors (Mailchimp, Buffer, SendGrid) v2.4.0"
git push origin main
```

**Step 4: Publish npm + GitHub release**

```bash
npm config set //registry.npmjs.org/:_authToken=TOKEN
npm publish --access public
npm config delete //registry.npmjs.org/:_authToken
gh release create v2.4.0 --title "v2.4.0 — Social/Email Connectors" --notes "..."
```

---

## Release 2: v2.5.0 — Google Search Console Integration

### Task 13: Install googleapis dependency

**Files:**
- Modify: `servers/wp-rest-bridge/package.json`

**Step 1: Install**

Run: `cd servers/wp-rest-bridge && npm install googleapis`

**Step 2: Commit**

```bash
git add servers/wp-rest-bridge/package.json servers/wp-rest-bridge/package-lock.json
git commit -m "chore(deps): add googleapis for GSC integration"
```

---

### Task 14: Extend SiteConfig for GSC

**Files:**
- Modify: `servers/wp-rest-bridge/src/wordpress.ts`

**Step 1: Add GSC fields to SiteConfig**

After sendgrid_api_key:

```typescript
  // Google Search Console (optional)
  gsc_service_account_key?: string;  // Path to service account JSON key file
  gsc_site_url?: string;             // GSC site URL (e.g., "sc-domain:mysite.com")
```

**Step 2: Add GSC auth module**

Create exported function `getGSCAuth(siteId)` that reads the service account JSON key, creates a `google.auth.GoogleAuth` client with `webmasters.readonly` scope, and returns an authenticated searchconsole client.

Add `hasGSC(siteId)` check function.

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/wordpress.ts
git commit -m "feat(bridge): add GSC Service Account auth to SiteConfig"
```

---

### Task 15: GSC MCP Tools

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/gsc.ts`

**Step 1: Create the tool file**

Exports `gscTools: Tool[]` and `gscHandlers: Record<string, Function>`. Implement 8 tools: `gsc_list_sites`, `gsc_search_analytics`, `gsc_inspect_url`, `gsc_list_sitemaps`, `gsc_submit_sitemap`, `gsc_delete_sitemap`, `gsc_top_queries`, `gsc_page_performance`.

Uses `googleapis` `searchconsole` and `webmasters` APIs.

**Step 2: Register in index.ts**

Add import and spread into allTools/toolHandlers.

**Step 3: Build and verify**

Run: `cd servers/wp-rest-bridge && npx tsc`

**Step 4: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/gsc.ts servers/wp-rest-bridge/src/tools/index.ts servers/wp-rest-bridge/build/
git commit -m "feat(gsc): add 8 Google Search Console MCP tools"
```

---

### Task 16: GSC Detection Script

**Files:**
- Create: `skills/wp-search-console/scripts/search_console_inspect.mjs`

**Step 1: Create detection script**

Checks: WP_SITES_CONFIG for gsc_service_account_key, sitemap.xml existence (via WebFetch), robots.txt, SEO plugins (Yoast, RankMath, AIOSEO), GSC config readiness.

**Step 2: Commit**

```bash
git add skills/wp-search-console/scripts/search_console_inspect.mjs
git commit -m "feat(detect): add search_console_inspect.mjs"
```

---

### Task 17: Skill wp-search-console (SKILL.md + 5 references)

**Files:**
- Create: `skills/wp-search-console/SKILL.md`
- Create: `skills/wp-search-console/references/gsc-setup.md`
- Create: `skills/wp-search-console/references/keyword-tracking.md`
- Create: `skills/wp-search-console/references/indexing-management.md`
- Create: `skills/wp-search-console/references/content-seo-feedback.md`
- Create: `skills/wp-search-console/references/competitor-gap-analysis.md`

**Step 1: Create SKILL.md and references**

SKILL.md: frontmatter with triggers (Search Console, GSC, keyword tracking, indexing, sitemap), decision tree for 5 sections, reference files table, recommended agent `wp-content-strategist`, related skills.

**Step 2: Commit**

```bash
git add skills/wp-search-console/
git commit -m "feat(skill): add wp-search-console skill with 5 reference files"
```

---

### Task 18: Update wp-content-strategist Agent for GSC

**Files:**
- Modify: `agents/wp-content-strategist.md`

**Step 1: Add SEO Feedback Loop section**

After the existing Programmatic SEO section, add "## SEO Feedback Loop (GSC)" with the 6-step procedure from the design doc. Add example in frontmatter for GSC-driven optimization.

**Step 2: Add cross-references**

Update `wp-programmatic-seo/SKILL.md`, `wp-content-attribution/SKILL.md`, `wp-monitoring/SKILL.md` with cross-refs to `wp-search-console`.

**Step 3: Commit**

```bash
git add agents/wp-content-strategist.md skills/wp-programmatic-seo/SKILL.md skills/wp-content-attribution/SKILL.md skills/wp-monitoring/SKILL.md
git commit -m "feat(agent): add SEO Feedback Loop to wp-content-strategist + cross-refs"
```

---

### Task 19: Router v12 + Version Bump + Publish v2.5.0

**Files:**
- Modify: `skills/wordpress-router/references/decision-tree.md` (v11 → v12, add GSC keywords)
- Modify: `.claude-plugin/plugin.json` (version → 2.5.0)
- Modify: `package.json` (version → 2.5.0)
- Modify: `CHANGELOG.md` (add v2.5.0 entry)

**Step 1: Update router**

Add GSC keywords to Step 0 and routing entry in Step 2b:
```
- **Google Search Console / keyword tracking / indexing status / sitemap submit / search performance / GSC / SERP data**
  → `wp-search-console` skill + `wp-content-strategist` agent
```

**Step 2: Version bump + CHANGELOG**

v2.5.0 entry: 8 GSC tools, 1 skill, detection script, agent update, router v12, googleapis dependency, 103 → 111 total tools.

**Step 3: Build, commit, push, publish**

```bash
cd servers/wp-rest-bridge && npx tsc
git add -A && git commit -m "feat: add Google Search Console integration v2.5.0"
git push origin main
npm publish --access public
gh release create v2.5.0 --title "v2.5.0 — Google Search Console Integration" --notes "..."
```

---

## Release 3: v2.6.0 — AI Content Optimization

### Task 20: Detection Script

**Files:**
- Create: `skills/wp-content-optimization/scripts/content_optimization_inspect.mjs`

**Step 1: Create detection script**

Checks: content volume (published posts count via REST), content age distribution, SEO plugins, readability plugins (Yoast readability, RankMath), GSC availability (from SiteConfig), WooCommerce availability (for attribution combo).

**Step 2: Commit**

```bash
git add skills/wp-content-optimization/scripts/content_optimization_inspect.mjs
git commit -m "feat(detect): add content_optimization_inspect.mjs"
```

---

### Task 21: Skill wp-content-optimization (SKILL.md + 5 references)

**Files:**
- Create: `skills/wp-content-optimization/SKILL.md`
- Create: `skills/wp-content-optimization/references/headline-optimization.md`
- Create: `skills/wp-content-optimization/references/readability-analysis.md`
- Create: `skills/wp-content-optimization/references/seo-content-scoring.md`
- Create: `skills/wp-content-optimization/references/meta-optimization.md`
- Create: `skills/wp-content-optimization/references/content-freshness.md`

**Step 1: Create SKILL.md and references**

SKILL.md: frontmatter with triggers (optimize content, headline, readability, SEO score, meta description, content freshness, content triage), 6 procedures detailed, decision tree, bulk triage classification table, reference files table, recommended agent `wp-content-strategist`, related skills.

**Step 2: Commit**

```bash
git add skills/wp-content-optimization/
git commit -m "feat(skill): add wp-content-optimization skill with 5 reference files"
```

---

### Task 22: Update wp-content-strategist Agent for AI Optimization

**Files:**
- Modify: `agents/wp-content-strategist.md`

**Step 1: Add AI Content Optimization Workflow section**

After the SEO Feedback Loop section, add "## AI Content Optimization Workflow" with the 5-step pipeline from the design doc and bulk triage classification table.

Add example in frontmatter for content optimization.

**Step 2: Add cross-references**

Update `wp-content/SKILL.md`, `wp-search-console/SKILL.md`, `wp-content-attribution/SKILL.md`, `wp-programmatic-seo/SKILL.md` with cross-refs to `wp-content-optimization`.

**Step 3: Commit**

```bash
git add agents/wp-content-strategist.md skills/wp-content/SKILL.md skills/wp-search-console/SKILL.md skills/wp-content-attribution/SKILL.md skills/wp-programmatic-seo/SKILL.md
git commit -m "feat(agent): add AI Content Optimization Workflow to wp-content-strategist"
```

---

### Task 23: Router v13 + Version Bump + GUIDE.md + Publish v2.6.0

**Files:**
- Modify: `skills/wordpress-router/references/decision-tree.md` (v12 → v13)
- Modify: `.claude-plugin/plugin.json` (version → 2.6.0)
- Modify: `package.json` (version → 2.6.0)
- Modify: `CHANGELOG.md` (add v2.6.0 entry)
- Modify: `docs/GUIDE.md` (full update from v2.3.0 to v2.6.0)

**Step 1: Update router**

Add content optimization keywords to Step 0 and routing entry in Step 2b:
```
- **Content optimization / headline scoring / readability / SEO score / meta optimization / content freshness / content triage / optimize posts**
  → `wp-content-optimization` skill + `wp-content-strategist` agent
```

**Step 2: Version bump + CHANGELOG**

v2.6.0 entry: 0 new tools, 1 skill, detection script, agent update, router v13. Final Tier 3 WCOP metrics: 36 skills, 12 agents, 111 MCP tools.

**Step 3: Update GUIDE.md**

Full update covering v2.4.0-v2.6.0: new capabilities list, structure tree, routing examples (3 new scenarios), skill tables (Social/Email + GSC + AI Optimization), detection scripts table (+3), glossary terms.

**Step 4: Build, commit, push, publish**

```bash
git add -A && git commit -m "feat: add AI Content Optimization + complete GUIDE.md update v2.6.0"
git push origin main
npm publish --access public
gh release create v2.6.0 --title "v2.6.0 — AI Content Optimization (Tier 3 WCOP Complete)" --notes "..."
```

---

### Task 24: Update Memory

**Files:**
- Modify: `/home/vinmor/.claude/projects/-home-vinmor/memory/wordpress-manager.md`

**Step 1: Update memory file**

Update version to 2.6.0, add Tier 3 skills/agent, update counts (36 skills, 12 agents, 111 tools, 24 detection scripts, 178 references), add version history entries for v2.4.0-v2.6.0, update router version to v13.

---

*Implementation plan for Tier 3 WCOP — 24 tasks across 3 releases*
