import { hasGSC, getGSCAuth, getGSCSiteUrl } from '../wordpress.js';
import { google } from 'googleapis';
import { z } from 'zod';
// ── Zod Schemas ─────────────────────────────────────────────────
const gscListSitesSchema = z.object({}).strict();
const gscSearchAnalyticsSchema = z.object({
    start_date: z.string().describe('Start date in YYYY-MM-DD format'),
    end_date: z.string().describe('End date in YYYY-MM-DD format'),
    dimensions: z.array(z.enum(['query', 'page', 'country', 'device', 'date'])).optional()
        .describe('Dimensions to group results by'),
    row_limit: z.number().optional().default(100)
        .describe('Maximum number of rows to return (default 100)'),
    dimension_filter_groups: z.array(z.object({
        groupType: z.enum(['and']).optional(),
        filters: z.array(z.object({
            dimension: z.enum(['query', 'page', 'country', 'device']),
            operator: z.enum(['contains', 'equals', 'notContains', 'notEquals', 'includingRegex', 'excludingRegex']),
            expression: z.string(),
        })),
    })).optional()
        .describe('Filter groups for narrowing results'),
}).strict();
const gscInspectUrlSchema = z.object({
    inspection_url: z.string().describe('The fully-qualified URL to inspect'),
    site_url: z.string().optional()
        .describe('Site URL (defaults to configured gsc_site_url)'),
}).strict();
const gscListSitemapsSchema = z.object({}).strict();
const gscSubmitSitemapSchema = z.object({
    feedpath: z.string().describe('Full URL to the sitemap (e.g. https://example.com/sitemap.xml)'),
}).strict();
const gscDeleteSitemapSchema = z.object({
    feedpath: z.string().describe('Full URL of the sitemap to delete'),
}).strict();
const gscTopQueriesSchema = z.object({
    start_date: z.string().describe('Start date in YYYY-MM-DD format'),
    end_date: z.string().describe('End date in YYYY-MM-DD format'),
    limit: z.number().optional().default(25)
        .describe('Number of top queries to return (default 25)'),
}).strict();
const gscPagePerformanceSchema = z.object({
    start_date: z.string().describe('Start date in YYYY-MM-DD format'),
    end_date: z.string().describe('End date in YYYY-MM-DD format'),
    page_filter: z.string().optional()
        .describe('Filter pages by URL containing this string'),
    limit: z.number().optional().default(50)
        .describe('Number of pages to return (default 50)'),
}).strict();
// ── Tool Definitions ────────────────────────────────────────────
export const gscTools = [
    {
        name: "gsc_list_sites",
        description: "Lists all sites verified in Google Search Console",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "gsc_search_analytics",
        description: "Queries search analytics data (impressions, clicks, CTR, position) for a site",
        inputSchema: {
            type: "object",
            properties: {
                start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
                end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
                dimensions: {
                    type: "array",
                    items: {
                        type: "string",
                        enum: ["query", "page", "country", "device", "date"],
                    },
                    description: "Dimensions to group results by",
                },
                row_limit: { type: "number", description: "Maximum number of rows to return (default 100)" },
                dimension_filter_groups: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            groupType: { type: "string", enum: ["and"] },
                            filters: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        dimension: { type: "string", enum: ["query", "page", "country", "device"] },
                                        operator: {
                                            type: "string",
                                            enum: ["contains", "equals", "notContains", "notEquals", "includingRegex", "excludingRegex"],
                                        },
                                        expression: { type: "string" },
                                    },
                                    required: ["dimension", "operator", "expression"],
                                },
                            },
                        },
                    },
                    description: "Filter groups for narrowing results",
                },
            },
            required: ["start_date", "end_date"],
        },
    },
    {
        name: "gsc_inspect_url",
        description: "Inspects a URL's indexing status in Google Search Console",
        inputSchema: {
            type: "object",
            properties: {
                inspection_url: { type: "string", description: "The fully-qualified URL to inspect" },
                site_url: { type: "string", description: "Site URL (defaults to configured gsc_site_url)" },
            },
            required: ["inspection_url"],
        },
    },
    {
        name: "gsc_list_sitemaps",
        description: "Lists all sitemaps submitted to Google Search Console",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "gsc_submit_sitemap",
        description: "Submits a sitemap to Google Search Console",
        inputSchema: {
            type: "object",
            properties: {
                feedpath: { type: "string", description: "Full URL to the sitemap (e.g. https://example.com/sitemap.xml)" },
            },
            required: ["feedpath"],
        },
    },
    {
        name: "gsc_delete_sitemap",
        description: "Deletes a sitemap from Google Search Console",
        inputSchema: {
            type: "object",
            properties: {
                feedpath: { type: "string", description: "Full URL of the sitemap to delete" },
            },
            required: ["feedpath"],
        },
    },
    {
        name: "gsc_top_queries",
        description: "Gets top search queries for a site ordered by clicks (convenience wrapper around gsc_search_analytics)",
        inputSchema: {
            type: "object",
            properties: {
                start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
                end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
                limit: { type: "number", description: "Number of top queries to return (default 25)" },
            },
            required: ["start_date", "end_date"],
        },
    },
    {
        name: "gsc_page_performance",
        description: "Gets performance metrics for specific pages with optional URL filter (convenience wrapper)",
        inputSchema: {
            type: "object",
            properties: {
                start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
                end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
                page_filter: { type: "string", description: "Filter pages by URL containing this string" },
                limit: { type: "number", description: "Number of pages to return (default 50)" },
            },
            required: ["start_date", "end_date"],
        },
    },
];
// ── Handlers ────────────────────────────────────────────────────
export const gscHandlers = {
    gsc_list_sites: async (_params) => {
        if (!hasGSC()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "GSC not configured. Add gsc_service_account_key and gsc_site_url to WP_SITES_CONFIG." }] } };
        }
        try {
            const auth = await getGSCAuth();
            const searchconsole = google.searchconsole({ version: 'v1', auth });
            const response = await searchconsole.sites.list();
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing sites: ${errorMessage}` }] } };
        }
    },
    gsc_search_analytics: async (params) => {
        if (!hasGSC()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "GSC not configured. Add gsc_service_account_key and gsc_site_url to WP_SITES_CONFIG." }] } };
        }
        try {
            const auth = await getGSCAuth();
            const siteUrl = getGSCSiteUrl();
            const { start_date, end_date, dimensions, row_limit, dimension_filter_groups } = params;
            const searchconsole = google.searchconsole({ version: 'v1', auth });
            const requestBody = {
                startDate: start_date,
                endDate: end_date,
                rowLimit: row_limit || 100,
            };
            if (dimensions)
                requestBody.dimensions = dimensions;
            if (dimension_filter_groups)
                requestBody.dimensionFilterGroups = dimension_filter_groups;
            const response = await searchconsole.searchanalytics.query({
                siteUrl,
                requestBody,
            });
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error querying search analytics: ${errorMessage}` }] } };
        }
    },
    gsc_inspect_url: async (params) => {
        if (!hasGSC()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "GSC not configured. Add gsc_service_account_key and gsc_site_url to WP_SITES_CONFIG." }] } };
        }
        try {
            const auth = await getGSCAuth();
            const { inspection_url, site_url } = params;
            const siteUrl = site_url || getGSCSiteUrl();
            const searchconsole = google.searchconsole({ version: 'v1', auth });
            const response = await searchconsole.urlInspection.index.inspect({
                requestBody: {
                    inspectionUrl: inspection_url,
                    siteUrl,
                },
            });
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error inspecting URL: ${errorMessage}` }] } };
        }
    },
    gsc_list_sitemaps: async (_params) => {
        if (!hasGSC()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "GSC not configured. Add gsc_service_account_key and gsc_site_url to WP_SITES_CONFIG." }] } };
        }
        try {
            const auth = await getGSCAuth();
            const siteUrl = getGSCSiteUrl();
            const webmasters = google.webmasters({ version: 'v3', auth });
            const response = await webmasters.sitemaps.list({ siteUrl });
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing sitemaps: ${errorMessage}` }] } };
        }
    },
    gsc_submit_sitemap: async (params) => {
        if (!hasGSC()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "GSC not configured. Add gsc_service_account_key and gsc_site_url to WP_SITES_CONFIG." }] } };
        }
        try {
            const auth = await getGSCAuth();
            const siteUrl = getGSCSiteUrl();
            const { feedpath } = params;
            const webmasters = google.webmasters({ version: 'v3', auth });
            await webmasters.sitemaps.submit({ siteUrl, feedpath });
            return { toolResult: { content: [{ type: "text", text: JSON.stringify({ success: true, message: `Sitemap submitted: ${feedpath}` }, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error submitting sitemap: ${errorMessage}` }] } };
        }
    },
    gsc_delete_sitemap: async (params) => {
        if (!hasGSC()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "GSC not configured. Add gsc_service_account_key and gsc_site_url to WP_SITES_CONFIG." }] } };
        }
        try {
            const auth = await getGSCAuth();
            const siteUrl = getGSCSiteUrl();
            const { feedpath } = params;
            const webmasters = google.webmasters({ version: 'v3', auth });
            await webmasters.sitemaps.delete({ siteUrl, feedpath });
            return { toolResult: { content: [{ type: "text", text: JSON.stringify({ success: true, message: `Sitemap deleted: ${feedpath}` }, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error deleting sitemap: ${errorMessage}` }] } };
        }
    },
    gsc_top_queries: async (params) => {
        if (!hasGSC()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "GSC not configured. Add gsc_service_account_key and gsc_site_url to WP_SITES_CONFIG." }] } };
        }
        try {
            const auth = await getGSCAuth();
            const siteUrl = getGSCSiteUrl();
            const { start_date, end_date, limit } = params;
            const searchconsole = google.searchconsole({ version: 'v1', auth });
            const response = await searchconsole.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate: start_date,
                    endDate: end_date,
                    dimensions: ['query'],
                    rowLimit: limit || 25,
                },
            });
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting top queries: ${errorMessage}` }] } };
        }
    },
    gsc_page_performance: async (params) => {
        if (!hasGSC()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "GSC not configured. Add gsc_service_account_key and gsc_site_url to WP_SITES_CONFIG." }] } };
        }
        try {
            const auth = await getGSCAuth();
            const siteUrl = getGSCSiteUrl();
            const { start_date, end_date, page_filter, limit } = params;
            const searchconsole = google.searchconsole({ version: 'v1', auth });
            const requestBody = {
                startDate: start_date,
                endDate: end_date,
                dimensions: ['page'],
                rowLimit: limit || 50,
            };
            if (page_filter) {
                requestBody.dimensionFilterGroups = [{
                        groupType: 'and',
                        filters: [{
                                dimension: 'page',
                                operator: 'contains',
                                expression: page_filter,
                            }],
                    }];
            }
            const response = await searchconsole.searchanalytics.query({
                siteUrl,
                requestBody,
            });
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting page performance: ${errorMessage}` }] } };
        }
    },
};
