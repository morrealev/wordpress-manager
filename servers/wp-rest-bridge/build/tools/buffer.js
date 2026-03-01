import { makeBufferRequest, hasBuffer } from '../wordpress.js';
import { z } from 'zod';
// ── Zod Schemas ─────────────────────────────────────────────────
const bufListProfilesSchema = z.object({}).strict();
const bufCreateUpdateSchema = z.object({
    profile_ids: z.array(z.string())
        .describe('Array of Buffer profile IDs to post to'),
    text: z.string()
        .describe('Text content of the social media post'),
    media: z.object({
        link: z.string().optional().describe('URL to attach'),
        description: z.string().optional().describe('Description for the media'),
        picture: z.string().optional().describe('URL of an image to attach'),
    }).optional()
        .describe('Optional media attachment (link, description, picture)'),
    scheduled_at: z.string().optional()
        .describe('Scheduled publish time in ISO 8601 format'),
    shorten: z.boolean().optional()
        .describe('Whether to shorten links in the post'),
}).strict();
const bufListPendingSchema = z.object({
    profile_id: z.string().describe('Buffer profile ID'),
    count: z.number().optional()
        .describe('Number of updates to return'),
    page: z.number().optional()
        .describe('Page number for pagination'),
}).strict();
const bufListSentSchema = z.object({
    profile_id: z.string().describe('Buffer profile ID'),
    count: z.number().optional()
        .describe('Number of updates to return'),
    page: z.number().optional()
        .describe('Page number for pagination'),
}).strict();
const bufGetAnalyticsSchema = z.object({
    update_id: z.string().describe('Buffer update ID'),
}).strict();
// ── Tool Definitions ────────────────────────────────────────────
export const bufferTools = [
    {
        name: "buf_list_profiles",
        description: "Lists all Buffer social media profiles connected to the account",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "buf_create_update",
        description: "Creates a new social media post (update) via Buffer",
        inputSchema: {
            type: "object",
            properties: {
                profile_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of Buffer profile IDs to post to",
                },
                text: { type: "string", description: "Text content of the social media post" },
                media: {
                    type: "object",
                    properties: {
                        link: { type: "string", description: "URL to attach" },
                        description: { type: "string", description: "Description for the media" },
                        picture: { type: "string", description: "URL of an image to attach" },
                    },
                    description: "Optional media attachment (link, description, picture)",
                },
                scheduled_at: { type: "string", description: "Scheduled publish time in ISO 8601 format" },
                shorten: { type: "boolean", description: "Whether to shorten links in the post" },
            },
            required: ["profile_ids", "text"],
        },
    },
    {
        name: "buf_list_pending",
        description: "Lists pending (scheduled) updates for a Buffer profile",
        inputSchema: {
            type: "object",
            properties: {
                profile_id: { type: "string", description: "Buffer profile ID" },
                count: { type: "number", description: "Number of updates to return" },
                page: { type: "number", description: "Page number for pagination" },
            },
            required: ["profile_id"],
        },
    },
    {
        name: "buf_list_sent",
        description: "Lists sent updates for a Buffer profile with engagement stats",
        inputSchema: {
            type: "object",
            properties: {
                profile_id: { type: "string", description: "Buffer profile ID" },
                count: { type: "number", description: "Number of updates to return" },
                page: { type: "number", description: "Page number for pagination" },
            },
            required: ["profile_id"],
        },
    },
    {
        name: "buf_get_analytics",
        description: "Gets interaction analytics for a specific Buffer update",
        inputSchema: {
            type: "object",
            properties: {
                update_id: { type: "string", description: "Buffer update ID" },
            },
            required: ["update_id"],
        },
    },
];
// ── Handlers ────────────────────────────────────────────────────
export const bufferHandlers = {
    buf_list_profiles: async (_params) => {
        if (!hasBuffer()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Buffer not configured. Add buffer_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const response = await makeBufferRequest("GET", "profiles.json");
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing Buffer profiles: ${errorMessage}` }] } };
        }
    },
    buf_create_update: async (params) => {
        if (!hasBuffer()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Buffer not configured. Add buffer_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const { profile_ids, text, media, scheduled_at, shorten } = params;
            const body = { profile_ids, text };
            if (media)
                body.media = media;
            if (scheduled_at)
                body.scheduled_at = scheduled_at;
            if (shorten !== undefined)
                body.shorten = shorten;
            const response = await makeBufferRequest("POST", "updates/create.json", body);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating Buffer update: ${errorMessage}` }] } };
        }
    },
    buf_list_pending: async (params) => {
        if (!hasBuffer()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Buffer not configured. Add buffer_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const { profile_id, count, page } = params;
            const query = {};
            if (count !== undefined)
                query.count = count;
            if (page !== undefined)
                query.page = page;
            const qs = Object.entries(query).map(([k, v]) => `${k}=${v}`).join('&');
            const endpoint = `profiles/${profile_id}/updates/pending.json${qs ? '?' + qs : ''}`;
            const response = await makeBufferRequest("GET", endpoint);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing pending updates: ${errorMessage}` }] } };
        }
    },
    buf_list_sent: async (params) => {
        if (!hasBuffer()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Buffer not configured. Add buffer_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const { profile_id, count, page } = params;
            const query = {};
            if (count !== undefined)
                query.count = count;
            if (page !== undefined)
                query.page = page;
            const qs = Object.entries(query).map(([k, v]) => `${k}=${v}`).join('&');
            const endpoint = `profiles/${profile_id}/updates/sent.json${qs ? '?' + qs : ''}`;
            const response = await makeBufferRequest("GET", endpoint);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing sent updates: ${errorMessage}` }] } };
        }
    },
    buf_get_analytics: async (params) => {
        if (!hasBuffer()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Buffer not configured. Add buffer_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const { update_id } = params;
            const response = await makeBufferRequest("GET", `updates/${update_id}/interactions.json`);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting update analytics: ${errorMessage}` }] } };
        }
    },
};
