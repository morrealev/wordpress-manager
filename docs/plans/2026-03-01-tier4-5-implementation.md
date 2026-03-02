# Tier 4+5 WCOP Implementation Plan (v2.7.0 → v2.9.0)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Observability (analytics + CWV + alerting) and Automation (workflow templates + event triggers) to the wordpress-manager plugin, raising WCOP score from 8/10 to 8.8/10.

**Architecture:** Three incremental releases adding MCP tool files (TypeScript in `servers/wp-rest-bridge/src/tools/`), skills (SKILL.md + reference files), detection scripts (.mjs), agent updates, router updates, and safety hooks. All follow existing Tier 3 patterns exactly (Zod schemas → Tool[] → handlers Record with has*/make* guards).

**Tech Stack:** TypeScript, `googleapis` npm package (GA4 Data API, CrUX API), `axios` (Plausible, PageSpeed Insights, Slack), Zod, MCP SDK.

**Design doc:** `docs/plans/2026-03-01-tier4-5-observability-automation-design.md`

---

## Release 1: v2.7.0 — Analytics (GA4 + Plausible + CWV)

### Task 1: Extend SiteConfig with analytics fields

**Files:**
- Modify: `servers/wp-rest-bridge/src/wordpress.ts:6-27` (SiteConfig interface)
- Modify: `servers/wp-rest-bridge/src/wordpress.ts:57-63` (module state — add client maps)
- Modify: `servers/wp-rest-bridge/src/wordpress.ts:114-141` (initWordPress loop — add GA4/Plausible init)

**Step 1: Add SiteConfig fields**

Add after the `gsc_site_url` line (line 26) in `wordpress.ts`:

```typescript
  // Google Analytics 4 (optional)
  ga4_property_id?: string;            // GA4 property (e.g., "properties/123456789")
  ga4_service_account_key?: string;    // Path to service account JSON (can reuse GSC key)
  // Plausible Analytics (optional)
  plausible_api_key?: string;          // Plausible API key (Bearer token)
  plausible_base_url?: string;         // Default: "https://plausible.io" (or self-hosted)
  // Google API key for public APIs (PageSpeed Insights, CrUX)
  google_api_key?: string;
```

**Step 2: Add module state maps**

Add after `const sgSiteClients` (around line 63):

```typescript
const plSiteClients = new Map<string, AxiosInstance>();
```

**Step 3: Add Plausible client init function**

Add after `initSendGridClient` function:

```typescript
async function initPlausibleClient(id: string, apiKey: string, baseUrl?: string) {
  const client = axios.create({
    baseURL: (baseUrl || 'https://plausible.io') + '/api/v1/',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    timeout: DEFAULT_TIMEOUT_MS,
  });
  plSiteClients.set(id, client);
}
```

**Step 4: Add init call in initWordPress loop**

In the `for (const site of sites)` loop (after SendGrid init, ~line 137):

```typescript
    if (site.plausible_api_key) {
      await initPlausibleClient(site.id, site.plausible_api_key, site.plausible_base_url);
      logToStderr(`Initialized Plausible for site: ${site.id}`);
    }
```

**Step 5: Add has/make/get functions for GA4, Plausible, CWV**

Add before the `// ── Plugin Repository` section (~line 670):

```typescript
// ── Google Analytics 4 Interface ─────────────────────────────────

const ga4AuthClients = new Map<string, any>();

export function hasGA4(siteId?: string): boolean {
  const id = siteId || activeSiteId;
  const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
  const site = sites.find((s: SiteConfig) => s.id === id);
  return !!(site?.ga4_property_id && site?.ga4_service_account_key);
}

export function getGA4PropertyId(siteId?: string): string {
  const id = siteId || activeSiteId;
  const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
  const site = sites.find((s: SiteConfig) => s.id === id);
  if (!site?.ga4_property_id) {
    throw new Error(`GA4 property not configured for site "${id}". Add ga4_property_id to WP_SITES_CONFIG.`);
  }
  return site.ga4_property_id;
}

export async function getGA4Auth(siteId?: string) {
  const id = siteId || activeSiteId;
  if (ga4AuthClients.has(id)) return ga4AuthClients.get(id);

  const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
  const site = sites.find((s: SiteConfig) => s.id === id);
  if (!site?.ga4_service_account_key) {
    throw new Error(`GA4 not configured for site "${id}". Add ga4_service_account_key to WP_SITES_CONFIG.`);
  }

  const keyContent = JSON.parse(readFileSync(site.ga4_service_account_key, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials: keyContent,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  const authClient = await auth.getClient();
  ga4AuthClients.set(id, authClient);
  return authClient;
}

// ── Plausible Analytics Interface ────────────────────────────────

export function hasPlausible(siteId?: string): boolean {
  const id = siteId || activeSiteId;
  return plSiteClients.has(id);
}

export async function makePlausibleRequest(
  method: string,
  endpoint: string,
  params?: Record<string, any>,
  siteId?: string
): Promise<any> {
  const id = siteId || activeSiteId;
  const client = plSiteClients.get(id);
  if (!client) {
    throw new Error(`Plausible not configured for site "${id}". Add plausible_api_key to WP_SITES_CONFIG.`);
  }
  const limiter = getLimiter(id);
  await limiter.acquire();
  try {
    const response = await client.request({ method, url: endpoint, params });
    return response.data;
  } finally {
    limiter.release();
  }
}

// ── Core Web Vitals Interface (Google API Key) ───────────────────

export function hasGoogleApiKey(siteId?: string): boolean {
  const id = siteId || activeSiteId;
  const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
  const site = sites.find((s: SiteConfig) => s.id === id);
  return !!site?.google_api_key;
}

export function getGoogleApiKey(siteId?: string): string {
  const id = siteId || activeSiteId;
  const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
  const site = sites.find((s: SiteConfig) => s.id === id);
  if (!site?.google_api_key) {
    throw new Error(`Google API key not configured for site "${id}". Add google_api_key to WP_SITES_CONFIG.`);
  }
  return site.google_api_key;
}
```

**Step 6: Build to verify**

```bash
cd servers/wp-rest-bridge && npx tsc
```
Expected: No errors.

**Step 7: Commit**

```bash
git add servers/wp-rest-bridge/src/wordpress.ts
git commit -m "feat(wp-rest-bridge): extend SiteConfig with GA4, Plausible, CWV fields

- Add ga4_property_id, ga4_service_account_key to SiteConfig
- Add plausible_api_key, plausible_base_url to SiteConfig
- Add google_api_key for PageSpeed Insights / CrUX
- Add initPlausibleClient + plSiteClients map
- Add hasGA4/getGA4Auth/getGA4PropertyId (googleapis Service Account)
- Add hasPlausible/makePlausibleRequest (axios Bearer token)
- Add hasGoogleApiKey/getGoogleApiKey

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Create GA4 tool file (6 tools)

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/ga4.ts`

**Step 1: Write the GA4 tool file**

Follow the exact pattern from `gsc.ts`: import from `../wordpress.js`, Zod schemas, Tool[] array, handlers Record.

```typescript
// src/tools/ga4.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { hasGA4, getGA4Auth, getGA4PropertyId } from '../wordpress.js';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────

const ga4RunReportSchema = z.object({
  dimensions: z.array(z.string()).describe('Dimension names (e.g., ["date", "country", "pagePath"])'),
  metrics: z.array(z.string()).describe('Metric names (e.g., ["sessions", "activeUsers", "screenPageViews"])'),
  start_date: z.string().describe('Start date (YYYY-MM-DD or relative like "30daysAgo")'),
  end_date: z.string().describe('End date (YYYY-MM-DD or "today")'),
  limit: z.number().optional().default(100).describe('Max rows (default 100)'),
}).strict();

const ga4GetRealtimeSchema = z.object({
  metrics: z.array(z.string()).optional().default(['activeUsers'])
    .describe('Realtime metrics (default: ["activeUsers"])'),
  dimensions: z.array(z.string()).optional()
    .describe('Optional realtime dimensions (e.g., ["country", "unifiedScreenName"])'),
}).strict();

const ga4TopPagesSchema = z.object({
  start_date: z.string().describe('Start date (YYYY-MM-DD or "30daysAgo")'),
  end_date: z.string().describe('End date (YYYY-MM-DD or "today")'),
  limit: z.number().optional().default(25).describe('Number of top pages (default 25)'),
}).strict();

const ga4TrafficSourcesSchema = z.object({
  start_date: z.string().describe('Start date'),
  end_date: z.string().describe('End date'),
  limit: z.number().optional().default(25).describe('Number of sources (default 25)'),
}).strict();

const ga4UserDemographicsSchema = z.object({
  start_date: z.string().describe('Start date'),
  end_date: z.string().describe('End date'),
  breakdown: z.enum(['country', 'deviceCategory', 'browser']).optional().default('country')
    .describe('Breakdown dimension (default: country)'),
  limit: z.number().optional().default(25).describe('Max rows (default 25)'),
}).strict();

const ga4ConversionEventsSchema = z.object({
  start_date: z.string().describe('Start date'),
  end_date: z.string().describe('End date'),
  limit: z.number().optional().default(25).describe('Max events (default 25)'),
}).strict();

// ── Tool Definitions ────────────────────────────────────────────

export const ga4Tools: Tool[] = [
  {
    name: "ga4_run_report",
    description: "Runs a custom GA4 report with specified dimensions and metrics",
    inputSchema: {
      type: "object",
      properties: {
        dimensions: { type: "array", items: { type: "string" }, description: "Dimension names (e.g., date, country, pagePath)" },
        metrics: { type: "array", items: { type: "string" }, description: "Metric names (e.g., sessions, activeUsers)" },
        start_date: { type: "string", description: "Start date (YYYY-MM-DD or 30daysAgo)" },
        end_date: { type: "string", description: "End date (YYYY-MM-DD or today)" },
        limit: { type: "number", description: "Max rows to return (default 100)" },
      },
      required: ["dimensions", "metrics", "start_date", "end_date"],
    },
  },
  {
    name: "ga4_get_realtime",
    description: "Gets real-time active users and optional dimensions from GA4",
    inputSchema: {
      type: "object",
      properties: {
        metrics: { type: "array", items: { type: "string" }, description: "Realtime metrics (default: activeUsers)" },
        dimensions: { type: "array", items: { type: "string" }, description: "Realtime dimensions (e.g., country)" },
      },
    },
  },
  {
    name: "ga4_top_pages",
    description: "Gets top pages by pageviews from GA4 (convenience shortcut)",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date" },
        end_date: { type: "string", description: "End date" },
        limit: { type: "number", description: "Number of top pages (default 25)" },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "ga4_traffic_sources",
    description: "Gets traffic sources breakdown by source/medium from GA4",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date" },
        end_date: { type: "string", description: "End date" },
        limit: { type: "number", description: "Number of sources (default 25)" },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "ga4_user_demographics",
    description: "Gets user demographic breakdown (country, device, browser) from GA4",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date" },
        end_date: { type: "string", description: "End date" },
        breakdown: { type: "string", enum: ["country", "deviceCategory", "browser"], description: "Breakdown type (default: country)" },
        limit: { type: "number", description: "Max rows (default 25)" },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "ga4_conversion_events",
    description: "Gets conversion events and rates from GA4",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date" },
        end_date: { type: "string", description: "End date" },
        limit: { type: "number", description: "Max events (default 25)" },
      },
      required: ["start_date", "end_date"],
    },
  },
];

// ── Handlers ────────────────────────────────────────────────────

export const ga4Handlers: Record<string, Function> = {
  ga4_run_report: async (params: z.infer<typeof ga4RunReportSchema>) => {
    if (!hasGA4()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "GA4 not configured. Add ga4_property_id and ga4_service_account_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const auth = await getGA4Auth();
      const propertyId = getGA4PropertyId();
      const { dimensions, metrics, start_date, end_date, limit } = params;
      const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
      const response = await analyticsdata.properties.runReport({
        property: propertyId,
        requestBody: {
          dimensions: dimensions.map(d => ({ name: d })),
          metrics: metrics.map(m => ({ name: m })),
          dateRanges: [{ startDate: start_date, endDate: end_date }],
          limit: limit || 100,
        },
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error running GA4 report: ${errorMessage}` }] } };
    }
  },

  ga4_get_realtime: async (params: z.infer<typeof ga4GetRealtimeSchema>) => {
    if (!hasGA4()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "GA4 not configured. Add ga4_property_id and ga4_service_account_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const auth = await getGA4Auth();
      const propertyId = getGA4PropertyId();
      const { metrics, dimensions } = params;
      const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
      const requestBody: Record<string, any> = {
        metrics: (metrics || ['activeUsers']).map((m: string) => ({ name: m })),
      };
      if (dimensions) requestBody.dimensions = dimensions.map((d: string) => ({ name: d }));
      const response = await analyticsdata.properties.runRealtimeReport({
        property: propertyId,
        requestBody,
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting GA4 realtime: ${errorMessage}` }] } };
    }
  },

  ga4_top_pages: async (params: z.infer<typeof ga4TopPagesSchema>) => {
    if (!hasGA4()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "GA4 not configured. Add ga4_property_id and ga4_service_account_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const auth = await getGA4Auth();
      const propertyId = getGA4PropertyId();
      const { start_date, end_date, limit } = params;
      const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
      const response = await analyticsdata.properties.runReport({
        property: propertyId,
        requestBody: {
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'averageSessionDuration' }],
          dateRanges: [{ startDate: start_date, endDate: end_date }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: limit || 25,
        },
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting top pages: ${errorMessage}` }] } };
    }
  },

  ga4_traffic_sources: async (params: z.infer<typeof ga4TrafficSourcesSchema>) => {
    if (!hasGA4()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "GA4 not configured. Add ga4_property_id and ga4_service_account_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const auth = await getGA4Auth();
      const propertyId = getGA4PropertyId();
      const { start_date, end_date, limit } = params;
      const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
      const response = await analyticsdata.properties.runReport({
        property: propertyId,
        requestBody: {
          dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'conversions' }],
          dateRanges: [{ startDate: start_date, endDate: end_date }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: limit || 25,
        },
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting traffic sources: ${errorMessage}` }] } };
    }
  },

  ga4_user_demographics: async (params: z.infer<typeof ga4UserDemographicsSchema>) => {
    if (!hasGA4()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "GA4 not configured. Add ga4_property_id and ga4_service_account_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const auth = await getGA4Auth();
      const propertyId = getGA4PropertyId();
      const { start_date, end_date, breakdown, limit } = params;
      const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
      const response = await analyticsdata.properties.runReport({
        property: propertyId,
        requestBody: {
          dimensions: [{ name: breakdown || 'country' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
          dateRanges: [{ startDate: start_date, endDate: end_date }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: limit || 25,
        },
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting demographics: ${errorMessage}` }] } };
    }
  },

  ga4_conversion_events: async (params: z.infer<typeof ga4ConversionEventsSchema>) => {
    if (!hasGA4()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "GA4 not configured. Add ga4_property_id and ga4_service_account_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const auth = await getGA4Auth();
      const propertyId = getGA4PropertyId();
      const { start_date, end_date, limit } = params;
      const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
      const response = await analyticsdata.properties.runReport({
        property: propertyId,
        requestBody: {
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }, { name: 'conversions' }, { name: 'totalRevenue' }],
          dateRanges: [{ startDate: start_date, endDate: end_date }],
          orderBys: [{ metric: { metricName: 'conversions' }, desc: true }],
          limit: limit || 25,
        },
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting conversion events: ${errorMessage}` }] } };
    }
  },
};
```

**Step 2: Build to verify**

```bash
cd servers/wp-rest-bridge && npx tsc
```
Expected: No errors.

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/ga4.ts
git commit -m "feat(wp-rest-bridge): add GA4 Analytics tool file (6 tools)

- ga4_run_report: custom report with dimensions/metrics/date range
- ga4_get_realtime: real-time active users
- ga4_top_pages: top pages by pageviews (shortcut)
- ga4_traffic_sources: source/medium breakdown (shortcut)
- ga4_user_demographics: country/device/browser breakdown (shortcut)
- ga4_conversion_events: conversion events and rates (shortcut)
- Uses googleapis analyticsdata v1beta with Service Account auth

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Create Plausible tool file (4 tools)

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/plausible.ts`

**Step 1: Write the Plausible tool file**

```typescript
// src/tools/plausible.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { hasPlausible, makePlausibleRequest } from '../wordpress.js';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────

const plGetStatsSchema = z.object({
  site_id: z.string().describe('Plausible site domain (e.g., "mysite.com")'),
  period: z.enum(['day', '7d', '30d', 'month', '6mo', '12mo', 'custom']).optional().default('30d')
    .describe('Time period (default: 30d)'),
  date: z.string().optional().describe('Date or date range for custom period (YYYY-MM-DD or YYYY-MM-DD,YYYY-MM-DD)'),
  metrics: z.string().optional().default('visitors,pageviews,bounce_rate,visit_duration')
    .describe('Comma-separated metrics'),
}).strict();

const plGetTimeseriesSchema = z.object({
  site_id: z.string().describe('Plausible site domain'),
  period: z.enum(['day', '7d', '30d', 'month', '6mo', '12mo', 'custom']).optional().default('30d'),
  date: z.string().optional(),
  metrics: z.string().optional().default('visitors,pageviews'),
  interval: z.enum(['date', 'month']).optional().default('date')
    .describe('Data point interval (default: date)'),
}).strict();

const plGetBreakdownSchema = z.object({
  site_id: z.string().describe('Plausible site domain'),
  property: z.enum(['event:page', 'visit:source', 'visit:country', 'visit:device', 'visit:browser', 'visit:os', 'visit:utm_medium', 'visit:utm_source', 'visit:utm_campaign'])
    .describe('Property to break down by'),
  period: z.enum(['day', '7d', '30d', 'month', '6mo', '12mo', 'custom']).optional().default('30d'),
  date: z.string().optional(),
  metrics: z.string().optional().default('visitors,pageviews'),
  limit: z.number().optional().default(100).describe('Max results (default 100)'),
}).strict();

const plGetRealtimeSchema = z.object({
  site_id: z.string().describe('Plausible site domain'),
}).strict();

// ── Tool Definitions ────────────────────────────────────────────

export const plausibleTools: Tool[] = [
  {
    name: "pl_get_stats",
    description: "Gets aggregate statistics from Plausible Analytics (visitors, pageviews, bounce rate, visit duration)",
    inputSchema: {
      type: "object",
      properties: {
        site_id: { type: "string", description: "Plausible site domain (e.g., mysite.com)" },
        period: { type: "string", enum: ["day", "7d", "30d", "month", "6mo", "12mo", "custom"], description: "Time period (default: 30d)" },
        date: { type: "string", description: "Date for custom period (YYYY-MM-DD or range)" },
        metrics: { type: "string", description: "Comma-separated metrics (default: visitors,pageviews,bounce_rate,visit_duration)" },
      },
      required: ["site_id"],
    },
  },
  {
    name: "pl_get_timeseries",
    description: "Gets time-series statistics from Plausible (daily/monthly data points)",
    inputSchema: {
      type: "object",
      properties: {
        site_id: { type: "string", description: "Plausible site domain" },
        period: { type: "string", enum: ["day", "7d", "30d", "month", "6mo", "12mo", "custom"], description: "Time period" },
        date: { type: "string", description: "Date for custom period" },
        metrics: { type: "string", description: "Comma-separated metrics" },
        interval: { type: "string", enum: ["date", "month"], description: "Data interval (default: date)" },
      },
      required: ["site_id"],
    },
  },
  {
    name: "pl_get_breakdown",
    description: "Gets breakdown statistics from Plausible by property (page, source, country, device, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        site_id: { type: "string", description: "Plausible site domain" },
        property: { type: "string", enum: ["event:page", "visit:source", "visit:country", "visit:device", "visit:browser", "visit:os", "visit:utm_medium", "visit:utm_source", "visit:utm_campaign"], description: "Breakdown property" },
        period: { type: "string", enum: ["day", "7d", "30d", "month", "6mo", "12mo", "custom"], description: "Time period" },
        date: { type: "string", description: "Date for custom period" },
        metrics: { type: "string", description: "Comma-separated metrics" },
        limit: { type: "number", description: "Max results (default 100)" },
      },
      required: ["site_id", "property"],
    },
  },
  {
    name: "pl_get_realtime",
    description: "Gets the current number of visitors on the site from Plausible",
    inputSchema: {
      type: "object",
      properties: {
        site_id: { type: "string", description: "Plausible site domain" },
      },
      required: ["site_id"],
    },
  },
];

// ── Handlers ────────────────────────────────────────────────────

export const plausibleHandlers: Record<string, Function> = {
  pl_get_stats: async (params: z.infer<typeof plGetStatsSchema>) => {
    if (!hasPlausible()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Plausible not configured. Add plausible_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { site_id, period, date, metrics } = params;
      const queryParams: Record<string, any> = { site_id, period: period || '30d' };
      if (date) queryParams.date = date;
      if (metrics) queryParams.metrics = metrics;
      const response = await makePlausibleRequest('GET', 'stats/aggregate', queryParams);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting Plausible stats: ${errorMessage}` }] } };
    }
  },

  pl_get_timeseries: async (params: z.infer<typeof plGetTimeseriesSchema>) => {
    if (!hasPlausible()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Plausible not configured. Add plausible_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { site_id, period, date, metrics, interval } = params;
      const queryParams: Record<string, any> = { site_id, period: period || '30d' };
      if (date) queryParams.date = date;
      if (metrics) queryParams.metrics = metrics;
      if (interval) queryParams.interval = interval;
      const response = await makePlausibleRequest('GET', 'stats/timeseries', queryParams);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting Plausible timeseries: ${errorMessage}` }] } };
    }
  },

  pl_get_breakdown: async (params: z.infer<typeof plGetBreakdownSchema>) => {
    if (!hasPlausible()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Plausible not configured. Add plausible_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { site_id, property, period, date, metrics, limit } = params;
      const queryParams: Record<string, any> = { site_id, property, period: period || '30d' };
      if (date) queryParams.date = date;
      if (metrics) queryParams.metrics = metrics;
      if (limit) queryParams.limit = limit;
      const response = await makePlausibleRequest('GET', 'stats/breakdown', queryParams);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting Plausible breakdown: ${errorMessage}` }] } };
    }
  },

  pl_get_realtime: async (params: z.infer<typeof plGetRealtimeSchema>) => {
    if (!hasPlausible()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Plausible not configured. Add plausible_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { site_id } = params;
      const response = await makePlausibleRequest('GET', 'stats/realtime/visitors', { site_id });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify({ visitors: response }, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting Plausible realtime: ${errorMessage}` }] } };
    }
  },
};
```

**Step 2: Build**

```bash
cd servers/wp-rest-bridge && npx tsc
```

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/plausible.ts
git commit -m "feat(wp-rest-bridge): add Plausible Analytics tool file (4 tools)

- pl_get_stats: aggregate stats (visitors, pageviews, bounce rate)
- pl_get_timeseries: daily/monthly data points
- pl_get_breakdown: by page, source, country, device, UTM
- pl_get_realtime: current visitor count
- Uses Plausible REST API v1 with Bearer token auth

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Create CWV tool file (4 tools)

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/cwv.ts`

**Step 1: Write the CWV tool file**

```typescript
// src/tools/cwv.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { hasGoogleApiKey, getGoogleApiKey } from '../wordpress.js';
import axios from 'axios';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────

const cwvAnalyzeUrlSchema = z.object({
  url: z.string().describe('URL to analyze'),
  strategy: z.enum(['mobile', 'desktop']).optional().default('mobile')
    .describe('Analysis strategy (default: mobile)'),
  categories: z.array(z.enum(['performance', 'accessibility', 'best-practices', 'seo'])).optional()
    .describe('Lighthouse categories to include (default: performance only)'),
}).strict();

const cwvBatchAnalyzeSchema = z.object({
  urls: z.array(z.string()).describe('Array of URLs to analyze (max 10)'),
  strategy: z.enum(['mobile', 'desktop']).optional().default('mobile'),
}).strict();

const cwvGetFieldDataSchema = z.object({
  url: z.string().optional().describe('Specific URL for field data (omit for origin-level data)'),
  origin: z.string().optional().describe('Origin URL (e.g., https://mysite.com)'),
  form_factor: z.enum(['PHONE', 'DESKTOP', 'TABLET', 'ALL_FORM_FACTORS']).optional().default('ALL_FORM_FACTORS'),
}).strict();

const cwvComparePagesSchema = z.object({
  urls: z.array(z.string()).describe('URLs to compare (2-5)'),
  strategy: z.enum(['mobile', 'desktop']).optional().default('mobile'),
}).strict();

// ── Tool Definitions ────────────────────────────────────────────

export const cwvTools: Tool[] = [
  {
    name: "cwv_analyze_url",
    description: "Analyzes Core Web Vitals for a URL via PageSpeed Insights (LCP, INP, CLS, FCP, TTFB)",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to analyze" },
        strategy: { type: "string", enum: ["mobile", "desktop"], description: "Strategy (default: mobile)" },
        categories: { type: "array", items: { type: "string", enum: ["performance", "accessibility", "best-practices", "seo"] }, description: "Categories to include" },
      },
      required: ["url"],
    },
  },
  {
    name: "cwv_batch_analyze",
    description: "Analyzes Core Web Vitals for multiple URLs (max 10) via PageSpeed Insights",
    inputSchema: {
      type: "object",
      properties: {
        urls: { type: "array", items: { type: "string" }, description: "URLs to analyze (max 10)" },
        strategy: { type: "string", enum: ["mobile", "desktop"], description: "Strategy (default: mobile)" },
      },
      required: ["urls"],
    },
  },
  {
    name: "cwv_get_field_data",
    description: "Gets real-user CWV field data from Chrome UX Report (28-day aggregate)",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Specific URL (omit for origin-level)" },
        origin: { type: "string", description: "Origin URL (e.g., https://mysite.com)" },
        form_factor: { type: "string", enum: ["PHONE", "DESKTOP", "TABLET", "ALL_FORM_FACTORS"], description: "Form factor (default: ALL)" },
      },
    },
  },
  {
    name: "cwv_compare_pages",
    description: "Compares Core Web Vitals across multiple pages and ranks optimization priority",
    inputSchema: {
      type: "object",
      properties: {
        urls: { type: "array", items: { type: "string" }, description: "URLs to compare (2-5)" },
        strategy: { type: "string", enum: ["mobile", "desktop"], description: "Strategy (default: mobile)" },
      },
      required: ["urls"],
    },
  },
];

// ── Handlers ────────────────────────────────────────────────────

const PSI_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const CRUX_BASE = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

function extractCWV(lighthouse: any) {
  const audits = lighthouse?.audits || {};
  return {
    lcp: audits['largest-contentful-paint']?.numericValue,
    fcp: audits['first-contentful-paint']?.numericValue,
    cls: audits['cumulative-layout-shift']?.numericValue,
    inp: audits['interaction-to-next-paint']?.numericValue,
    ttfb: audits['server-response-time']?.numericValue,
    performance_score: lighthouse?.categories?.performance?.score,
  };
}

export const cwvHandlers: Record<string, Function> = {
  cwv_analyze_url: async (params: z.infer<typeof cwvAnalyzeUrlSchema>) => {
    if (!hasGoogleApiKey()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Google API key not configured. Add google_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { url, strategy, categories } = params;
      const apiKey = getGoogleApiKey();
      const queryParams: Record<string, any> = { url, key: apiKey, strategy: strategy || 'mobile' };
      if (categories) {
        categories.forEach(c => { queryParams[`category`] = c; });
      } else {
        queryParams.category = 'performance';
      }
      const response = await axios.get(PSI_BASE, { params: queryParams, timeout: 60000 });
      const cwv = extractCWV(response.data.lighthouseResult);
      const result = { url, strategy: strategy || 'mobile', cwv, fieldData: response.data.loadingExperience || null };
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error analyzing URL: ${errorMessage}` }] } };
    }
  },

  cwv_batch_analyze: async (params: z.infer<typeof cwvBatchAnalyzeSchema>) => {
    if (!hasGoogleApiKey()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Google API key not configured. Add google_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { urls, strategy } = params;
      const limitedUrls = urls.slice(0, 10);
      const apiKey = getGoogleApiKey();
      const results = [];
      for (const url of limitedUrls) {
        try {
          const response = await axios.get(PSI_BASE, {
            params: { url, key: apiKey, strategy: strategy || 'mobile', category: 'performance' },
            timeout: 60000,
          });
          const cwv = extractCWV(response.data.lighthouseResult);
          results.push({ url, cwv, status: 'ok' });
        } catch (err: any) {
          results.push({ url, status: 'error', error: err.response?.data?.error?.message || err.message });
        }
      }
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] } };
    } catch (error: any) {
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error in batch analysis: ${error.message}` }] } };
    }
  },

  cwv_get_field_data: async (params: z.infer<typeof cwvGetFieldDataSchema>) => {
    if (!hasGoogleApiKey()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Google API key not configured. Add google_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { url, origin, form_factor } = params;
      const apiKey = getGoogleApiKey();
      const requestBody: Record<string, any> = {};
      if (url) requestBody.url = url;
      else if (origin) requestBody.origin = origin;
      else return { toolResult: { isError: true, content: [{ type: "text", text: "Provide either url or origin parameter." }] } };
      if (form_factor && form_factor !== 'ALL_FORM_FACTORS') requestBody.formFactor = form_factor;
      const response = await axios.post(`${CRUX_BASE}?key=${apiKey}`, requestBody, { timeout: 30000 });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting CrUX data: ${errorMessage}` }] } };
    }
  },

  cwv_compare_pages: async (params: z.infer<typeof cwvComparePagesSchema>) => {
    if (!hasGoogleApiKey()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Google API key not configured. Add google_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { urls, strategy } = params;
      const limitedUrls = urls.slice(0, 5);
      const apiKey = getGoogleApiKey();
      const results = [];
      for (const url of limitedUrls) {
        try {
          const response = await axios.get(PSI_BASE, {
            params: { url, key: apiKey, strategy: strategy || 'mobile', category: 'performance' },
            timeout: 60000,
          });
          const cwv = extractCWV(response.data.lighthouseResult);
          results.push({ url, cwv });
        } catch (err: any) {
          results.push({ url, cwv: null, error: err.message });
        }
      }
      // Rank by worst LCP
      const ranked = results
        .filter(r => r.cwv)
        .sort((a, b) => (b.cwv!.lcp || 0) - (a.cwv!.lcp || 0))
        .map((r, i) => ({ ...r, priority: i + 1 }));
      return { toolResult: { content: [{ type: "text", text: JSON.stringify({ comparison: ranked, worst_first: true }, null, 2) }] } };
    } catch (error: any) {
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error comparing pages: ${error.message}` }] } };
    }
  },
};
```

**Step 2: Build**

```bash
cd servers/wp-rest-bridge && npx tsc
```

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/cwv.ts
git commit -m "feat(wp-rest-bridge): add Core Web Vitals tool file (4 tools)

- cwv_analyze_url: PageSpeed Insights single URL (LCP, INP, CLS, FCP, TTFB)
- cwv_batch_analyze: batch analysis up to 10 URLs
- cwv_get_field_data: Chrome UX Report real-user data (28-day aggregate)
- cwv_compare_pages: compare CWV across pages with priority ranking
- Uses Google API key (no OAuth) for PageSpeed + CrUX APIs

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Register analytics tools in index.ts and build

**Files:**
- Modify: `servers/wp-rest-bridge/src/tools/index.ts`

**Step 1: Add imports**

Add after the `gscTools` import line:

```typescript
import { ga4Tools, ga4Handlers } from './ga4.js';
import { plausibleTools, plausibleHandlers } from './plausible.js';
import { cwvTools, cwvHandlers } from './cwv.js';
```

**Step 2: Add to allTools array**

Add after `...gscTools`:

```typescript
  ...ga4Tools,                   // 6 tools
  ...plausibleTools,             // 4 tools
  ...cwvTools,                   // 4 tools
```

**Step 3: Add to toolHandlers object**

Add after `...gscHandlers`:

```typescript
  ...ga4Handlers,
  ...plausibleHandlers,
  ...cwvHandlers,
```

**Step 4: Build**

```bash
cd servers/wp-rest-bridge && npx tsc
```

**Step 5: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/index.ts
git commit -m "feat(wp-rest-bridge): register GA4 + Plausible + CWV tools in index

14 new tools registered (6 GA4 + 4 Plausible + 4 CWV), total 125

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Create analytics detection script

**Files:**
- Create: `skills/wp-analytics/scripts/analytics_inspect.mjs`

**Step 1: Write the detection script**

Follow the exact pattern from `search_console_inspect.mjs`: helpers, detectors, main(), JSON report, exit code.

```javascript
/**
 * analytics_inspect.mjs — Detect analytics configuration readiness.
 *
 * Checks WP_SITES_CONFIG for GA4, Plausible, and Google API key credentials.
 * Scans for analytics plugins and tracking code.
 *
 * Usage:
 *   node analytics_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — analytics configuration found
 *   1 — no analytics configuration found
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

function detectGA4Config() {
  const ga4 = { configured: false, indicators: [] };
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return ga4;

  let sites;
  try { sites = JSON.parse(raw); } catch { return ga4; }
  if (!Array.isArray(sites)) return ga4;

  for (const site of sites) {
    const label = site.id || site.url || 'unknown';
    if (site.ga4_property_id) {
      ga4.configured = true;
      ga4.indicators.push(`ga4_property_id configured for ${label}`);
    }
    if (site.ga4_service_account_key) {
      ga4.indicators.push(`ga4_service_account_key configured for ${label}`);
    }
  }
  return ga4;
}

function detectPlausibleConfig() {
  const pl = { configured: false, indicators: [] };
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return pl;

  let sites;
  try { sites = JSON.parse(raw); } catch { return pl; }
  if (!Array.isArray(sites)) return pl;

  for (const site of sites) {
    const label = site.id || site.url || 'unknown';
    if (site.plausible_api_key) {
      pl.configured = true;
      pl.indicators.push(`plausible_api_key configured for ${label}`);
    }
    if (site.plausible_base_url) {
      pl.indicators.push(`plausible_base_url: ${site.plausible_base_url}`);
    }
  }
  return pl;
}

function detectGoogleApiKey() {
  const cwv = { configured: false, indicators: [] };
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return cwv;

  let sites;
  try { sites = JSON.parse(raw); } catch { return cwv; }
  if (!Array.isArray(sites)) return cwv;

  for (const site of sites) {
    const label = site.id || site.url || 'unknown';
    if (site.google_api_key) {
      cwv.configured = true;
      cwv.indicators.push(`google_api_key configured for ${label}`);
    }
  }
  return cwv;
}

function detectAnalyticsPlugins(cwd) {
  const indicators = [];
  const pluginsDir = join(cwd, 'wp-content', 'plugins');
  const plugins = globDir(pluginsDir);

  const analyticsPlugins = [
    'google-analytics-for-wordpress',
    'google-site-kit',
    'wp-google-analytics-events',
    'plausible-analytics',
    'koko-analytics',
    'matomo',
    'independent-analytics',
  ];

  for (const plugin of analyticsPlugins) {
    if (plugins.includes(plugin)) {
      indicators.push(`plugin: ${plugin}`);
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

  const ga4 = detectGA4Config();
  const plausible = detectPlausibleConfig();
  const googleApiKey = detectGoogleApiKey();
  const plugins = detectAnalyticsPlugins(cwd);

  const anyConfigured = ga4.configured || plausible.configured || googleApiKey.configured || plugins.found;

  const report = {
    analytics_configured: anyConfigured,
    ga4: ga4,
    plausible: plausible,
    google_api_key: googleApiKey,
    analytics_plugins: plugins,
    cwd,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(anyConfigured ? 0 : 1);
}

main();
```

**Step 2: Commit**

```bash
git add skills/wp-analytics/scripts/analytics_inspect.mjs
git commit -m "feat(wp-analytics): add analytics detection script

Detects GA4, Plausible, Google API key config in WP_SITES_CONFIG.
Scans for analytics plugins (Site Kit, Plausible, Matomo, etc.).
JSON report to stdout, exit 0 if any config found.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Create wp-analytics skill (SKILL.md + 5 references)

**Files:**
- Create: `skills/wp-analytics/SKILL.md`
- Create: `skills/wp-analytics/references/ga4-integration.md`
- Create: `skills/wp-analytics/references/plausible-setup.md`
- Create: `skills/wp-analytics/references/cwv-monitoring.md`
- Create: `skills/wp-analytics/references/analytics-dashboards.md`
- Create: `skills/wp-analytics/references/traffic-attribution.md`

**Step 1: Write SKILL.md**

Follow the 10-section pattern from existing skills (frontmatter, overview, detection, prerequisites, procedures, references, recommended agent, related skills, cross-references, troubleshooting).

The SKILL.md should define:
- **Frontmatter**: name `wp-analytics`, version 1.0.0, description, tags
- **Section 1 — Overview**: Unified analytics (GA4 + Plausible + CWV) for WordPress
- **Section 2 — Detection**: Run `analytics_inspect.mjs`
- **Section 3 — Prerequisites**: GA4 Data API enabled, Service Account, Plausible API key, Google API key
- **Section 4 — Procedures**: 6 procedures (GA4 setup, Plausible setup, CWV analysis, traffic report, performance dashboard, cross-platform comparison)
- **Section 5 — MCP Tools Reference**: 14 tools table (6 GA4 + 4 PL + 4 CWV)
- **Section 6 — Reference Files**: 5 files listed
- **Section 7 — Recommended Agent**: wp-monitoring-agent
- **Section 8 — Related Skills**: wp-search-console, wp-content-optimization, wp-content-attribution, wp-monitoring
- **Section 9 — Cross-references**: Links to related skills
- **Section 10 — Troubleshooting**: Common issues (quota limits, missing scopes, field data not available)

**Step 2: Write 5 reference files**

Each reference file should be 50-100 lines covering the topic from the design doc table.

**Step 3: Commit**

```bash
git add skills/wp-analytics/
git commit -m "feat(wp-analytics): add skill with 5 reference files

Unified analytics skill covering GA4, Plausible, and Core Web Vitals.
14 MCP tools documented across 6 procedures.
References: ga4-integration, plausible-setup, cwv-monitoring,
analytics-dashboards, traffic-attribution.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Update wp-monitoring-agent (Analytics Monitoring + CWV)

**Files:**
- Modify: `agents/wp-monitoring-agent.md`

**Step 1: Add Analytics Monitoring procedure**

Add after "Procedure 7: Fleet Monitoring" section:

```markdown
### Procedure 8: Analytics Monitoring (Performance Dashboard)

1. Fetch traffic data from GA4 (`ga4_top_pages`, `ga4_traffic_sources`) or Plausible (`pl_get_stats`, `pl_get_breakdown`)
2. Fetch CWV for top pages (`cwv_batch_analyze`)
3. Fetch keyword data from GSC (`gsc_top_queries`) if available
4. Correlate: pages with high traffic + Poor CWV = optimization priority
5. Generate Performance Dashboard Report
6. If CWV Poor on top pages → recommend delegation to `wp-performance-optimizer`

### Procedure 9: CWV Trend Check

1. Run `cwv_analyze_url` on homepage and top landing pages
2. Compare with CWV thresholds (Good: LCP<2.5s, INP<200ms, CLS<0.1)
3. If available, fetch field data via `cwv_get_field_data` for real-user metrics
4. Report status (Good/Needs Improvement/Poor) per metric
5. If any metric is Poor → alert with specific pages and metrics
```

**Step 2: Update Available Tools section**

Add after WP REST Bridge tools:

```markdown
### Analytics MCP Tools (`mcp__wp-rest-bridge__ga4_*`, `mcp__wp-rest-bridge__pl_*`, `mcp__wp-rest-bridge__cwv_*`)
- **GA4**: `ga4_run_report`, `ga4_get_realtime`, `ga4_top_pages`, `ga4_traffic_sources`, `ga4_user_demographics`, `ga4_conversion_events`
- **Plausible**: `pl_get_stats`, `pl_get_timeseries`, `pl_get_breakdown`, `pl_get_realtime`
- **CWV**: `cwv_analyze_url`, `cwv_batch_analyze`, `cwv_get_field_data`, `cwv_compare_pages`
```

**Step 3: Update Related Skills section**

Add:
```markdown
- **`wp-analytics` skill** — analytics setup, traffic reports, CWV monitoring
```

**Step 4: Commit**

```bash
git add agents/wp-monitoring-agent.md
git commit -m "feat(wp-monitoring-agent): add Analytics Monitoring + CWV procedures

- Procedure 8: Performance Dashboard (GA4/Plausible + CWV + GSC correlation)
- Procedure 9: CWV Trend Check (thresholds, field data comparison)
- Added 14 analytics MCP tools to Available Tools
- Updated Related Skills with wp-analytics

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Update router to v14 + cross-references

**Files:**
- Modify: `skills/wordpress-router/SKILL.md` (version bump in frontmatter)
- Modify: `skills/wordpress-router/references/decision-tree.md` (v14 header + new keywords + new route)
- Modify: `skills/wp-search-console/SKILL.md` (add cross-ref to wp-analytics)
- Modify: `skills/wp-content-attribution/SKILL.md` (add cross-ref)
- Modify: `skills/wp-content-optimization/SKILL.md` (add cross-ref)

**Step 1: Update decision-tree.md**

- Change header from v13 to v14 (add `+ analytics`)
- Add to Step 0 operations keywords: `Google Analytics, GA4, traffic analytics, pageviews, sessions, user analytics, Plausible, privacy analytics, Core Web Vitals, CWV, LCP, INP, CLS, PageSpeed, page speed, site speed, performance score`
- Add new route in Step 2b after the content optimization entry:
  ```
  - **Google Analytics / GA4 / Plausible / traffic analytics / pageviews / sessions / user analytics / Core Web Vitals / CWV / PageSpeed / site speed / performance score**
    → `wp-analytics` skill + `wp-monitoring-agent` agent
  ```

**Step 2: Add cross-references in related skills**

- In `wp-search-console/SKILL.md` cross-references section, add: "Per correlare keyword GSC con traffico GA4, vedi `wp-analytics`"
- In `wp-content-attribution/SKILL.md`: "Per correlazione contenuto→conversione completa, combina `wp-analytics` + `wp-content-attribution`"
- In `wp-content-optimization/SKILL.md`: "Per prioritizzare ottimizzazione con dati CWV, combina `wp-analytics` + `wp-content-optimization`"

**Step 3: Commit**

```bash
git add skills/wordpress-router/ skills/wp-search-console/SKILL.md skills/wp-content-attribution/SKILL.md skills/wp-content-optimization/SKILL.md
git commit -m "feat(router): update to v14 with analytics routing

- Add GA4, Plausible, CWV keywords to Step 0 operations
- Add wp-analytics + wp-monitoring-agent route in Step 2b
- Add cross-references in wp-search-console, wp-content-attribution,
  wp-content-optimization

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Version bump to v2.7.0 + CHANGELOG

**Files:**
- Modify: `package.json` (version, description)
- Modify: `CHANGELOG.md` (add v2.7.0 entry)

**Step 1: Bump version to 2.7.0**

In `package.json`, change `"version": "2.6.0"` to `"version": "2.7.0"` and update description to mention analytics count.

**Step 2: Add CHANGELOG entry**

Add at top of CHANGELOG (after header), following existing format:

```markdown
## [2.7.0] — 2026-03-XX

### Added — Analytics (WCOP Tier 4a)
- **wp-analytics skill** — unified analytics: GA4, Plausible, Core Web Vitals
- **14 new MCP tools**: 6 GA4 (`ga4_run_report`, `ga4_get_realtime`, `ga4_top_pages`, `ga4_traffic_sources`, `ga4_user_demographics`, `ga4_conversion_events`), 4 Plausible (`pl_get_stats`, `pl_get_timeseries`, `pl_get_breakdown`, `pl_get_realtime`), 4 CWV (`cwv_analyze_url`, `cwv_batch_analyze`, `cwv_get_field_data`, `cwv_compare_pages`)
- **5 reference files**: ga4-integration, plausible-setup, cwv-monitoring, analytics-dashboards, traffic-attribution
- **Detection script**: `analytics_inspect.mjs` — detects GA4, Plausible, Google API key config
- **SiteConfig extension**: `ga4_property_id`, `ga4_service_account_key`, `plausible_api_key`, `plausible_base_url`, `google_api_key`

### Changed
- **wp-monitoring-agent**: added Procedure 8 (Analytics Monitoring) and Procedure 9 (CWV Trend Check) with 14 analytics MCP tools
- **Router v14**: added GA4, Plausible, CWV keywords and route
- **Cross-references**: wp-search-console, wp-content-attribution, wp-content-optimization → wp-analytics

### Metrics
- Skills: 37 (+1) | MCP tools: 125 (+14) | Reference files: 183 (+5) | Detection scripts: 25 (+1)
```

**Step 3: Build final**

```bash
cd servers/wp-rest-bridge && npx tsc
```

**Step 4: Commit**

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump version to v2.7.0 — Analytics (GA4 + Plausible + CWV)

WCOP Tier 4a: 14 new MCP tools, wp-analytics skill, router v14.
Skills: 37 | MCP tools: 125 | Agents: 12 | Detection scripts: 25

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Release 2: v2.8.0 — Smart Alerting (Slack + Email)

### Task 11: Create Slack tool file (3 tools)

**Files:**
- Modify: `servers/wp-rest-bridge/src/wordpress.ts` (SiteConfig + init + has/make)
- Create: `servers/wp-rest-bridge/src/tools/slack.ts`

**Step 1: Add SiteConfig fields for Slack**

In `wordpress.ts` SiteConfig, add after `google_api_key`:

```typescript
  // Slack Integration (optional)
  slack_webhook_url?: string;    // Incoming Webhook URL for alerts
  slack_bot_token?: string;      // Bot Token (xoxb-...) for advanced messaging
```

**Step 2: Add Slack client map and init**

Add `slackSiteClients` map. Add `initSlackClient` function (axios with Bearer token). Add init call in loop for `slack_bot_token`.

**Step 3: Add has/make functions**

```typescript
export function hasSlackWebhook(siteId?: string): boolean { ... }
export function hasSlackBot(siteId?: string): boolean { ... }
export async function makeSlackBotRequest(method, endpoint, data, siteId): Promise<any> { ... }
```

**Step 4: Write `slack.ts` tool file**

3 tools: `slack_send_alert` (POST to webhook URL), `slack_send_message` (Web API chat.postMessage), `slack_list_channels` (Web API conversations.list).

**Step 5: Register in index.ts**

Add imports and spread into allTools/toolHandlers.

**Step 6: Build and commit**

```bash
cd servers/wp-rest-bridge && npx tsc
git add servers/wp-rest-bridge/
git commit -m "feat(wp-rest-bridge): add Slack tool file (3 tools)

- slack_send_alert: send via incoming webhook (zero-config)
- slack_send_message: send to channel via Bot Token (Block Kit)
- slack_list_channels: list workspace channels via Bot Token
- SiteConfig: slack_webhook_url, slack_bot_token
- Total MCP tools: 128

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 12: Create alerting detection script

**Files:**
- Create: `skills/wp-alerting/scripts/alerting_inspect.mjs`

**Step 1: Write detection script**

Detects: Slack webhook/bot config, SendGrid config, monitoring setup, wp-cron availability.

**Step 2: Commit**

```bash
git add skills/wp-alerting/scripts/alerting_inspect.mjs
git commit -m "feat(wp-alerting): add alerting detection script

Detects Slack webhook/bot, SendGrid, monitoring config in WP_SITES_CONFIG.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 13: Create wp-alerting skill (SKILL.md + 4 references)

**Files:**
- Create: `skills/wp-alerting/SKILL.md`
- Create: `skills/wp-alerting/references/slack-integration.md`
- Create: `skills/wp-alerting/references/alert-thresholds.md`
- Create: `skills/wp-alerting/references/escalation-paths.md`
- Create: `skills/wp-alerting/references/report-scheduling.md`

**Step 1: Write SKILL.md + 4 reference files**

Alerting is procedure-based (agent-driven, not rule engine). References define thresholds, escalation paths, Slack setup, report schedules.

**Step 2: Commit**

```bash
git add skills/wp-alerting/
git commit -m "feat(wp-alerting): add skill with 4 reference files

Cross-cutting alerting: Slack + email (SendGrid), severity-based
escalation, configurable thresholds, scheduled reporting.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 14: Update wp-monitoring-agent (Alert Dispatch)

**Files:**
- Modify: `agents/wp-monitoring-agent.md`

**Step 1: Add Alert Dispatch procedure**

Add Procedure 10 (Alert Dispatch) with severity classification (info/warning/critical/emergency) and routing rules (Slack-only for warning, Slack+email for critical, repeat for emergency).

**Step 2: Add Slack tools to Available Tools**

**Step 3: Commit**

```bash
git add agents/wp-monitoring-agent.md
git commit -m "feat(wp-monitoring-agent): add Alert Dispatch procedure

- Procedure 10: severity classification + Slack/email routing
- Added slack_send_alert, slack_send_message, slack_list_channels tools
- Updated Related Skills with wp-alerting

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 15: Update router to v15 + cross-references + version bump

**Files:**
- Modify: `skills/wordpress-router/references/decision-tree.md` (v15)
- Modify: `skills/wp-monitoring/SKILL.md` (cross-ref)
- Modify: `skills/wp-analytics/SKILL.md` (cross-ref)
- Modify: `skills/wp-search-console/SKILL.md` (cross-ref)
- Modify: `package.json` (2.8.0)
- Modify: `CHANGELOG.md` (v2.8.0 entry)

**Step 1: Update decision-tree to v15**

Add alerting keywords and route in Step 2b.

**Step 2: Add cross-references**

**Step 3: Bump version and CHANGELOG**

**Step 4: Build and commit**

```bash
cd servers/wp-rest-bridge && npx tsc
git add skills/ agents/ package.json CHANGELOG.md
git commit -m "chore: bump version to v2.8.0 — Smart Alerting (Slack + Email)

WCOP Tier 4b: 3 new Slack MCP tools, wp-alerting skill, router v15.
Skills: 38 | MCP tools: 128 | Agents: 12 | Detection scripts: 26

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Release 3: v2.9.0 — Automated Workflows (Templates + Event Triggers)

### Task 16: Create workflows tool file (4 tools)

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/workflows.ts`

**Step 1: Write workflows tool file**

4 tools: `wf_list_triggers`, `wf_create_trigger`, `wf_update_trigger`, `wf_delete_trigger`.
These use the WP REST API to read/write a mu-plugin configuration (custom REST endpoint registered by the mu-plugin).

**Step 2: Register in index.ts**

**Step 3: Build and commit**

```bash
cd servers/wp-rest-bridge && npx tsc
git add servers/wp-rest-bridge/
git commit -m "feat(wp-rest-bridge): add workflows tool file (4 tools)

- wf_list_triggers: list configured event triggers
- wf_create_trigger: register new trigger (hook → webhook)
- wf_update_trigger: modify existing trigger
- wf_delete_trigger: remove trigger (safety gate)
- Uses WP REST API custom endpoint from mu-plugin
- Total MCP tools: 132

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 17: Add safety hook for wf_delete_trigger

**Files:**
- Modify: `hooks/hooks.json`

**Step 1: Add PreToolUse hook**

Add new entry in the `PreToolUse` array:

```json
{
  "matcher": "mcp__wp-rest-bridge__wf_delete_trigger",
  "hooks": [
    {
      "type": "prompt",
      "prompt": "The agent is about to DELETE a workflow event trigger. This will stop the automated action associated with this WordPress hook. Verify the user explicitly requested this deletion and understands which automation will stop."
    }
  ]
}
```

**Step 2: Commit**

```bash
git add hooks/hooks.json
git commit -m "feat(hooks): add safety hook for wf_delete_trigger

PreToolUse prompt confirmation before deleting workflow event triggers.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 18: Create workflow detection script

**Files:**
- Create: `skills/wp-content-workflows/scripts/workflow_inspect.mjs`

**Step 1: Write detection script**

Detects: mu-plugin `wcop-event-triggers.php`, configured triggers, wp-cron status, existing workflow-related plugins.

**Step 2: Commit**

```bash
git add skills/wp-content-workflows/scripts/workflow_inspect.mjs
git commit -m "feat(wp-content-workflows): add workflow detection script

Detects mu-plugin triggers, wp-cron, workflow plugins.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 19: Create wp-content-workflows skill (SKILL.md + 5 references)

**Files:**
- Create: `skills/wp-content-workflows/SKILL.md`
- Create: `skills/wp-content-workflows/references/launch-sequence.md`
- Create: `skills/wp-content-workflows/references/refresh-cycle.md`
- Create: `skills/wp-content-workflows/references/seasonal-campaign.md`
- Create: `skills/wp-content-workflows/references/seo-sprint.md`
- Create: `skills/wp-content-workflows/references/mu-plugin-triggers.md`

**Step 1: Write SKILL.md + 5 reference files**

4 workflow templates (Launch Sequence, Refresh Cycle, Seasonal Campaign, SEO Sprint) + mu-plugin architecture reference.

**Step 2: Commit**

```bash
git add skills/wp-content-workflows/
git commit -m "feat(wp-content-workflows): add skill with 5 reference files

4 workflow templates: Launch Sequence, Refresh Cycle, Seasonal Campaign,
SEO Sprint. mu-plugin trigger architecture reference.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 20: Update wp-site-manager agent (Workflow Automation)

**Files:**
- Modify: `agents/wp-site-manager.md`

**Step 1: Add Workflow Orchestration section**

Add delegation procedure: identify workflow → verify prerequisites → execute steps → report.

**Step 2: Update delegation table**

Add workflow-related delegation entries.

**Step 3: Commit**

```bash
git add agents/wp-site-manager.md
git commit -m "feat(wp-site-manager): add Workflow Automation section

- Workflow Orchestration procedure: identify → verify → execute → report
- Updated delegation table with workflow-related entries
- Added Related Skills: wp-content-workflows

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 21: Update router to v16 + cross-references + version bump + GUIDE.md

**Files:**
- Modify: `skills/wordpress-router/references/decision-tree.md` (v16)
- Modify: `skills/wp-content/SKILL.md` (cross-ref)
- Modify: `skills/wp-social-email/SKILL.md` (cross-ref)
- Modify: `skills/wp-webhooks/SKILL.md` (cross-ref)
- Modify: `skills/wp-content-optimization/SKILL.md` (cross-ref)
- Modify: `package.json` (2.9.0)
- Modify: `CHANGELOG.md` (v2.9.0 entry)
- Modify: `docs/GUIDE.md` (update from v2.6.0 to v2.9.0)

**Step 1: Update decision-tree to v16**

Add workflow keywords and route in Step 2b.

**Step 2: Add cross-references in 4 skills**

**Step 3: Bump version and CHANGELOG**

**Step 4: Update GUIDE.md**

Update all counts, add v2.7.0-v2.9.0 features, add new scenarios for analytics, alerting, workflows.

**Step 5: Build final**

```bash
cd servers/wp-rest-bridge && npx tsc
```

**Step 6: Commit**

```bash
git add skills/ agents/ hooks/ package.json CHANGELOG.md docs/GUIDE.md
git commit -m "chore: bump version to v2.9.0 — Automated Workflows

WCOP Tier 5: 4 workflow MCP tools, wp-content-workflows skill,
safety hook, router v16, GUIDE.md v2.9.0.
Skills: 39 | MCP tools: 132 | Agents: 12 | Detection scripts: 27
WCOP score: 8.8/10 (Observability 9, Automation 9)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 22: Update memory file

**Files:**
- Modify: `/home/user/.claude/projects/-home-vinmor/memory/wordpress-manager.md`

**Step 1: Update all sections**

- Version: 2.9.0
- Skills: 39, MCP tools: 132, refs: 192, detection scripts: 27, hooks: 10
- Add 3 new skill descriptions (wp-analytics, wp-alerting, wp-content-workflows)
- Update router to v16
- Add version history entries for v2.7.0, v2.8.0, v2.9.0

**Step 2: Commit memory (no git — memory file is outside repo)**

---

## Summary

| Release | Tasks | New Tools | New Skills | Key Files |
|---------|-------|-----------|------------|-----------|
| v2.7.0 | 1-10 | 14 (GA4+PL+CWV) | wp-analytics | ga4.ts, plausible.ts, cwv.ts |
| v2.8.0 | 11-15 | 3 (Slack) | wp-alerting | slack.ts |
| v2.9.0 | 16-22 | 4 (wf_*) | wp-content-workflows | workflows.ts |
| **Total** | **22** | **21** | **3** | **4 tool files** |

---

*Implementation Plan Tier 4+5 WCOP v1.0 — wordpress-manager v2.6.0 → v2.9.0 — 2026-03-01*
