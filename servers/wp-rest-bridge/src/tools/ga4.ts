// src/tools/ga4.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { hasGA4, getGA4Auth, getGA4PropertyId } from '../wordpress.js';
import { google } from 'googleapis';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────

const ga4RunReportSchema = z.object({
  dimensions: z.array(z.string()).describe('GA4 dimensions (e.g. pagePath, sessionSource, country)'),
  metrics: z.array(z.string()).describe('GA4 metrics (e.g. screenPageViews, activeUsers, sessions)'),
  start_date: z.string().describe('Start date in YYYY-MM-DD format'),
  end_date: z.string().describe('End date in YYYY-MM-DD format'),
  limit: z.number().optional().default(100)
    .describe('Maximum number of rows to return (default 100)'),
}).strict();

const ga4GetRealtimeSchema = z.object({
  metrics: z.array(z.string()).optional().default(['activeUsers'])
    .describe('Real-time metrics (default: activeUsers)'),
  dimensions: z.array(z.string()).optional()
    .describe('Real-time dimensions (optional, e.g. unifiedScreenName)'),
}).strict();

const ga4TopPagesSchema = z.object({
  start_date: z.string().describe('Start date in YYYY-MM-DD format'),
  end_date: z.string().describe('End date in YYYY-MM-DD format'),
  limit: z.number().optional().default(25)
    .describe('Number of top pages to return (default 25)'),
}).strict();

const ga4TrafficSourcesSchema = z.object({
  start_date: z.string().describe('Start date in YYYY-MM-DD format'),
  end_date: z.string().describe('End date in YYYY-MM-DD format'),
  limit: z.number().optional().default(25)
    .describe('Number of traffic sources to return (default 25)'),
}).strict();

const ga4UserDemographicsSchema = z.object({
  start_date: z.string().describe('Start date in YYYY-MM-DD format'),
  end_date: z.string().describe('End date in YYYY-MM-DD format'),
  breakdown: z.enum(['country', 'deviceCategory', 'browser']).optional().default('country')
    .describe('Breakdown dimension (default: country)'),
  limit: z.number().optional().default(25)
    .describe('Number of rows to return (default 25)'),
}).strict();

const ga4ConversionEventsSchema = z.object({
  start_date: z.string().describe('Start date in YYYY-MM-DD format'),
  end_date: z.string().describe('End date in YYYY-MM-DD format'),
  limit: z.number().optional().default(25)
    .describe('Number of conversion events to return (default 25)'),
}).strict();

// ── Tool Definitions ────────────────────────────────────────────

export const ga4Tools: Tool[] = [
  {
    name: "ga4_run_report",
    description: "Runs a custom GA4 report with specified dimensions, metrics, and date range",
    inputSchema: {
      type: "object",
      properties: {
        dimensions: {
          type: "array",
          items: { type: "string" },
          description: "GA4 dimensions (e.g. pagePath, sessionSource, country)",
        },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "GA4 metrics (e.g. screenPageViews, activeUsers, sessions)",
        },
        start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
        end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
        limit: { type: "number", description: "Maximum number of rows to return (default 100)" },
      },
      required: ["dimensions", "metrics", "start_date", "end_date"],
    },
  },
  {
    name: "ga4_get_realtime",
    description: "Gets real-time active users and metrics from GA4",
    inputSchema: {
      type: "object",
      properties: {
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Real-time metrics (default: activeUsers)",
        },
        dimensions: {
          type: "array",
          items: { type: "string" },
          description: "Real-time dimensions (optional, e.g. unifiedScreenName)",
        },
      },
    },
  },
  {
    name: "ga4_top_pages",
    description: "Gets top pages by pageviews from GA4 (convenience shortcut for ga4_run_report)",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
        end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
        limit: { type: "number", description: "Number of top pages to return (default 25)" },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "ga4_traffic_sources",
    description: "Gets traffic breakdown by source/medium from GA4 (convenience shortcut for ga4_run_report)",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
        end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
        limit: { type: "number", description: "Number of traffic sources to return (default 25)" },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "ga4_user_demographics",
    description: "Gets user demographics breakdown (country, device, or browser) from GA4 (convenience shortcut)",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
        end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
        breakdown: {
          type: "string",
          enum: ["country", "deviceCategory", "browser"],
          description: "Breakdown dimension (default: country)",
        },
        limit: { type: "number", description: "Number of rows to return (default 25)" },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "ga4_conversion_events",
    description: "Gets conversion events and rates from GA4 (convenience shortcut for ga4_run_report)",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
        end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
        limit: { type: "number", description: "Number of conversion events to return (default 25)" },
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
          dateRanges: [{ startDate: start_date, endDate: end_date }],
          dimensions: dimensions.map(d => ({ name: d })),
          metrics: metrics.map(m => ({ name: m })),
          limit: String(limit || 100),
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
        metrics: (metrics || ['activeUsers']).map(m => ({ name: m })),
      };
      if (dimensions && dimensions.length > 0) {
        requestBody.dimensions = dimensions.map(d => ({ name: d }));
      }
      const response = await analyticsdata.properties.runRealtimeReport({
        property: propertyId,
        requestBody,
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting GA4 realtime data: ${errorMessage}` }] } };
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
          dateRanges: [{ startDate: start_date, endDate: end_date }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'activeUsers' },
            { name: 'averageSessionDuration' },
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: String(limit || 25),
        },
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting GA4 top pages: ${errorMessage}` }] } };
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
          dateRanges: [{ startDate: start_date, endDate: end_date }],
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'conversions' },
          ],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: String(limit || 25),
        },
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting GA4 traffic sources: ${errorMessage}` }] } };
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
          dateRanges: [{ startDate: start_date, endDate: end_date }],
          dimensions: [{ name: breakdown || 'country' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
          ],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: String(limit || 25),
        },
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting GA4 user demographics: ${errorMessage}` }] } };
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
          dateRanges: [{ startDate: start_date, endDate: end_date }],
          dimensions: [{ name: 'eventName' }],
          metrics: [
            { name: 'eventCount' },
            { name: 'conversions' },
            { name: 'totalRevenue' },
          ],
          orderBys: [{ metric: { metricName: 'conversions' }, desc: true }],
          limit: String(limit || 25),
        },
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting GA4 conversion events: ${errorMessage}` }] } };
    }
  },
};
