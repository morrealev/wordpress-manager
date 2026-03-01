import { hasLinkedIn, makeLinkedInRequest, getLinkedInPersonUrn } from '../wordpress.js';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────
const liGetProfileSchema = z.object({}).strict();

const liCreatePostSchema = z.object({
    text: z.string().describe('Post text content'),
    link_url: z.string().optional().describe('URL to attach as link share'),
    image_url: z.string().optional().describe('URL of image to attach'),
    visibility: z.enum(['PUBLIC', 'CONNECTIONS']).optional().default('PUBLIC')
        .describe('Post visibility (default: PUBLIC)'),
}).strict();

const liCreateArticleSchema = z.object({
    title: z.string().describe('Article title'),
    body_html: z.string().describe('Article body in HTML format'),
    thumbnail_url: z.string().optional().describe('Thumbnail image URL'),
}).strict();

const liGetAnalyticsSchema = z.object({
    post_id: z.string().optional().describe('Specific post URN for analytics (all posts if omitted)'),
    period: z.enum(['day', 'month']).optional().default('month')
        .describe('Time granularity (default: month)'),
}).strict();

const liListPostsSchema = z.object({
    count: z.number().optional().default(10).describe('Number of posts to return (default 10)'),
    start: z.number().optional().default(0).describe('Pagination start index'),
}).strict();

// ── Tool Definitions ────────────────────────────────────────────
export const linkedinTools = [
    {
        name: "li_get_profile",
        description: "Gets the authenticated LinkedIn user profile (name, headline, vanity URL)",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "li_create_post",
        description: "Creates a LinkedIn feed post (text, optional link or image)",
        inputSchema: {
            type: "object",
            properties: {
                text: { type: "string", description: "Post text content" },
                link_url: { type: "string", description: "URL to attach as link share" },
                image_url: { type: "string", description: "URL of image to attach" },
                visibility: { type: "string", enum: ["PUBLIC", "CONNECTIONS"], description: "Post visibility (default: PUBLIC)" },
            },
            required: ["text"],
        },
    },
    {
        name: "li_create_article",
        description: "Publishes a long-form LinkedIn article (blog-to-article)",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Article title" },
                body_html: { type: "string", description: "Article body in HTML" },
                thumbnail_url: { type: "string", description: "Thumbnail image URL" },
            },
            required: ["title", "body_html"],
        },
    },
    {
        name: "li_get_analytics",
        description: "Gets LinkedIn post analytics (impressions, clicks, engagement rate)",
        inputSchema: {
            type: "object",
            properties: {
                post_id: { type: "string", description: "Specific post URN (all posts if omitted)" },
                period: { type: "string", enum: ["day", "month"], description: "Time granularity" },
            },
        },
    },
    {
        name: "li_list_posts",
        description: "Lists recent LinkedIn posts by the authenticated user",
        inputSchema: {
            type: "object",
            properties: {
                count: { type: "number", description: "Number of posts (default 10)" },
                start: { type: "number", description: "Pagination start index" },
            },
        },
    },
];

// ── Handlers ────────────────────────────────────────────────────
export const linkedinHandlers = {
    li_get_profile: async (_params) => {
        if (!hasLinkedIn()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "LinkedIn not configured. Add linkedin_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const response = await makeLinkedInRequest('GET', 'userinfo');
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting LinkedIn profile: ${errorMessage}` }] } };
        }
    },

    li_create_post: async (params) => {
        if (!hasLinkedIn()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "LinkedIn not configured. Add linkedin_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const { text, link_url, image_url, visibility } = params;
            const personUrn = getLinkedInPersonUrn();
            const payload = {
                author: personUrn,
                lifecycleState: 'PUBLISHED',
                visibility: visibility || 'PUBLIC',
                commentary: text,
                distribution: { feedDistribution: 'MAIN_FEED' },
            };
            if (link_url) {
                payload.content = {
                    article: { source: link_url, title: text.substring(0, 200) },
                };
            }
            const response = await makeLinkedInRequest('POST', 'posts', payload);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify({ success: true, post_id: response.id || response['x-restli-id'] || 'created' }, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating LinkedIn post: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}` }] } };
        }
    },

    li_create_article: async (params) => {
        if (!hasLinkedIn()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "LinkedIn not configured. Add linkedin_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const { title, body_html, thumbnail_url } = params;
            const personUrn = getLinkedInPersonUrn();
            const payload = {
                author: personUrn,
                lifecycleState: 'PUBLISHED',
                visibility: 'PUBLIC',
                commentary: title,
                content: {
                    article: {
                        title,
                        description: body_html.replace(/<[^>]*>/g, '').substring(0, 256),
                        source: thumbnail_url || undefined,
                    },
                },
                distribution: { feedDistribution: 'MAIN_FEED' },
            };
            const response = await makeLinkedInRequest('POST', 'posts', payload);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify({ success: true, article_id: response.id || 'created' }, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating LinkedIn article: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}` }] } };
        }
    },

    li_get_analytics: async (params) => {
        if (!hasLinkedIn()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "LinkedIn not configured. Add linkedin_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const personUrn = getLinkedInPersonUrn();
            const queryParams = {
                q: 'organizationalEntity',
                organizationalEntity: personUrn,
            };
            if (params.period) queryParams.timeIntervals = `(timeRange:(start:0),timeGranularityType:${params.period.toUpperCase()})`;
            const response = await makeLinkedInRequest('GET', 'organizationalEntityShareStatistics', queryParams);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting LinkedIn analytics: ${errorMessage}` }] } };
        }
    },

    li_list_posts: async (params) => {
        if (!hasLinkedIn()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "LinkedIn not configured. Add linkedin_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const personUrn = getLinkedInPersonUrn();
            const count = params.count || 10;
            const start = params.start || 0;
            const response = await makeLinkedInRequest('GET', `posts?author=${encodeURIComponent(personUrn)}&q=author&count=${count}&start=${start}`);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing LinkedIn posts: ${errorMessage}` }] } };
        }
    },
};
