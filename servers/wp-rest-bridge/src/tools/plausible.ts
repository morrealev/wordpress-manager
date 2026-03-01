// src/tools/plausible.ts — Plausible Analytics tools (4 tools)
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { hasPlausible, makePlausibleRequest } from '../wordpress.js';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────

const periodEnum = z.enum(['day', '7d', '30d', 'month', '6mo', '12mo', 'custom']);

const plGetStatsSchema = z.object({
  site_id: z.string().describe('Plausible site domain (e.g. "mysite.com")'),
  period: periodEnum.optional().default('30d')
    .describe('Time period (default: 30d)'),
  date: z.string().optional()
    .describe('Date in YYYY-MM-DD format (or date range for custom period: "2024-01-01,2024-01-31")'),
  metrics: z.string().optional().default('visitors,pageviews,bounce_rate,visit_duration')
    .describe('Comma-separated metrics (default: visitors,pageviews,bounce_rate,visit_duration)'),
}).strict();

const plGetTimeseriesSchema = z.object({
  site_id: z.string().describe('Plausible site domain (e.g. "mysite.com")'),
  period: periodEnum.optional().default('30d')
    .describe('Time period (default: 30d)'),
  date: z.string().optional()
    .describe('Date in YYYY-MM-DD format (or date range for custom period)'),
  metrics: z.string().optional().default('visitors,pageviews')
    .describe('Comma-separated metrics (default: visitors,pageviews)'),
  interval: z.enum(['date', 'month']).optional().default('date')
    .describe('Data point interval (default: date)'),
}).strict();

const plGetBreakdownSchema = z.object({
  site_id: z.string().describe('Plausible site domain (e.g. "mysite.com")'),
  property: z.enum([
    'event:page',
    'visit:source',
    'visit:country',
    'visit:device',
    'visit:browser',
    'visit:os',
    'visit:utm_medium',
    'visit:utm_source',
    'visit:utm_campaign',
  ]).describe('Property to break down by'),
  period: periodEnum.optional().default('30d')
    .describe('Time period (default: 30d)'),
  date: z.string().optional()
    .describe('Date in YYYY-MM-DD format (or date range for custom period)'),
  metrics: z.string().optional().default('visitors,pageviews')
    .describe('Comma-separated metrics (default: visitors,pageviews)'),
  limit: z.number().optional().default(100)
    .describe('Maximum number of results (default: 100)'),
}).strict();

const plGetRealtimeSchema = z.object({
  site_id: z.string().describe('Plausible site domain (e.g. "mysite.com")'),
}).strict();

// ── Tool Definitions ────────────────────────────────────────────

export const plausibleTools: Tool[] = [
  {
    name: "pl_get_stats",
    description: "Gets aggregate statistics from Plausible Analytics (visitors, pageviews, bounce rate, visit duration)",
    inputSchema: {
      type: "object",
      properties: {
        site_id: { type: "string", description: 'Plausible site domain (e.g. "mysite.com")' },
        period: {
          type: "string",
          enum: ["day", "7d", "30d", "month", "6mo", "12mo", "custom"],
          description: "Time period (default: 30d)",
        },
        date: { type: "string", description: 'Date in YYYY-MM-DD format (or date range for custom period: "2024-01-01,2024-01-31")' },
        metrics: { type: "string", description: "Comma-separated metrics (default: visitors,pageviews,bounce_rate,visit_duration)" },
      },
      required: ["site_id"],
    },
  },
  {
    name: "pl_get_timeseries",
    description: "Gets time-series data points from Plausible Analytics for charting trends over time",
    inputSchema: {
      type: "object",
      properties: {
        site_id: { type: "string", description: 'Plausible site domain (e.g. "mysite.com")' },
        period: {
          type: "string",
          enum: ["day", "7d", "30d", "month", "6mo", "12mo", "custom"],
          description: "Time period (default: 30d)",
        },
        date: { type: "string", description: "Date in YYYY-MM-DD format (or date range for custom period)" },
        metrics: { type: "string", description: "Comma-separated metrics (default: visitors,pageviews)" },
        interval: {
          type: "string",
          enum: ["date", "month"],
          description: "Data point interval (default: date)",
        },
      },
      required: ["site_id"],
    },
  },
  {
    name: "pl_get_breakdown",
    description: "Gets a breakdown of stats by property (page, source, country, device, browser, OS, UTM params) from Plausible Analytics",
    inputSchema: {
      type: "object",
      properties: {
        site_id: { type: "string", description: 'Plausible site domain (e.g. "mysite.com")' },
        property: {
          type: "string",
          enum: [
            "event:page",
            "visit:source",
            "visit:country",
            "visit:device",
            "visit:browser",
            "visit:os",
            "visit:utm_medium",
            "visit:utm_source",
            "visit:utm_campaign",
          ],
          description: "Property to break down by",
        },
        period: {
          type: "string",
          enum: ["day", "7d", "30d", "month", "6mo", "12mo", "custom"],
          description: "Time period (default: 30d)",
        },
        date: { type: "string", description: "Date in YYYY-MM-DD format (or date range for custom period)" },
        metrics: { type: "string", description: "Comma-separated metrics (default: visitors,pageviews)" },
        limit: { type: "number", description: "Maximum number of results (default: 100)" },
      },
      required: ["site_id", "property"],
    },
  },
  {
    name: "pl_get_realtime",
    description: "Gets the number of current visitors on the site from Plausible Analytics",
    inputSchema: {
      type: "object",
      properties: {
        site_id: { type: "string", description: 'Plausible site domain (e.g. "mysite.com")' },
      },
      required: ["site_id"],
    },
  },
];

// ── Handlers ────────────────────────────────────────────────────

export const plausibleHandlers: Record<string, Function> = {
  pl_get_stats: async (params: z.infer<typeof plGetStatsSchema>) => {
    if (!hasPlausible()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Plausible Analytics not configured. Add plausible_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { site_id, period, date, metrics } = plGetStatsSchema.parse(params);
      const queryParams: Record<string, any> = { site_id, period, metrics };
      if (date) queryParams.date = date;
      const response = await makePlausibleRequest('GET', 'stats/aggregate', queryParams);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting Plausible stats: ${errorMessage}` }] } };
    }
  },

  pl_get_timeseries: async (params: z.infer<typeof plGetTimeseriesSchema>) => {
    if (!hasPlausible()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Plausible Analytics not configured. Add plausible_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { site_id, period, date, metrics, interval } = plGetTimeseriesSchema.parse(params);
      const queryParams: Record<string, any> = { site_id, period, metrics, interval };
      if (date) queryParams.date = date;
      const response = await makePlausibleRequest('GET', 'stats/timeseries', queryParams);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting Plausible timeseries: ${errorMessage}` }] } };
    }
  },

  pl_get_breakdown: async (params: z.infer<typeof plGetBreakdownSchema>) => {
    if (!hasPlausible()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Plausible Analytics not configured. Add plausible_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { site_id, property, period, date, metrics, limit } = plGetBreakdownSchema.parse(params);
      const queryParams: Record<string, any> = { site_id, property, period, metrics, limit };
      if (date) queryParams.date = date;
      const response = await makePlausibleRequest('GET', 'stats/breakdown', queryParams);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting Plausible breakdown: ${errorMessage}` }] } };
    }
  },

  pl_get_realtime: async (params: z.infer<typeof plGetRealtimeSchema>) => {
    if (!hasPlausible()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Plausible Analytics not configured. Add plausible_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { site_id } = plGetRealtimeSchema.parse(params);
      const queryParams: Record<string, any> = { site_id };
      const response = await makePlausibleRequest('GET', 'stats/realtime/visitors', queryParams);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify({ visitors: response }, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting Plausible realtime visitors: ${errorMessage}` }] } };
    }
  },
};
