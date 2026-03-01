import { makeWordPressRequest, getActiveSite } from '../wordpress.js';
import axios from 'axios';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────
const sdValidateSchema = z.object({
    url: z.string().optional().describe('URL to validate (fetches and checks JSON-LD)'),
    markup: z.string().optional().describe('JSON-LD string to validate directly'),
}).strict().refine(data => data.url || data.markup, { message: 'Either url or markup is required' });

const sdInjectSchema = z.object({
    post_id: z.number().describe('WordPress post/page ID'),
    schema_type: z.string().describe('Schema.org type (Article, Product, FAQ, HowTo, LocalBusiness, Event, Organization, BreadcrumbList)'),
    schema_data: z.record(z.any()).describe('Schema.org properties as key-value pairs'),
}).strict();

const sdListSchemasSchema = z.object({
    schema_type: z.string().optional().describe('Filter by specific Schema.org type'),
}).strict();

// ── Tool Definitions ────────────────────────────────────────────
export const schemaTools = [
    {
        name: "sd_validate",
        description: "Validates JSON-LD / Schema.org structured data against Google specs",
        inputSchema: {
            type: "object",
            properties: {
                url: { type: "string", description: "URL to fetch and validate JSON-LD from" },
                markup: { type: "string", description: "JSON-LD string to validate directly" },
            },
        },
    },
    {
        name: "sd_inject",
        description: "Injects or updates JSON-LD structured data in a WordPress post/page",
        inputSchema: {
            type: "object",
            properties: {
                post_id: { type: "number", description: "WordPress post/page ID" },
                schema_type: { type: "string", description: "Schema.org type (Article, Product, FAQ, etc.)" },
                schema_data: { type: "object", description: "Schema.org properties as key-value pairs" },
            },
            required: ["post_id", "schema_type", "schema_data"],
        },
    },
    {
        name: "sd_list_schemas",
        description: "Lists Schema.org types found across the site with counts",
        inputSchema: {
            type: "object",
            properties: {
                schema_type: { type: "string", description: "Filter by Schema.org type" },
            },
        },
    },
];

// ── Handlers ────────────────────────────────────────────────────
export const schemaHandlers = {
    sd_validate: async (params) => {
        try {
            const { url, markup } = params;
            if (!url && !markup) {
                return { toolResult: { isError: true, content: [{ type: "text", text: "Either url or markup parameter is required." }] } };
            }
            let jsonLd;
            if (markup) {
                try {
                    jsonLd = JSON.parse(markup);
                } catch {
                    return { toolResult: { isError: true, content: [{ type: "text", text: "Invalid JSON in markup parameter." }] } };
                }
            } else {
                // Fetch URL and extract JSON-LD
                const response = await axios.get(url, { timeout: 15000 });
                const html = response.data;
                const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
                if (!jsonLdMatch) {
                    return { toolResult: { content: [{ type: "text", text: JSON.stringify({ valid: false, error: "No JSON-LD found on page", url }, null, 2) }] } };
                }
                try {
                    jsonLd = JSON.parse(jsonLdMatch[1]);
                } catch {
                    return { toolResult: { content: [{ type: "text", text: JSON.stringify({ valid: false, error: "Invalid JSON-LD on page", url }, null, 2) }] } };
                }
            }

            // Basic Schema.org validation
            const issues = [];
            const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
            for (const schema of schemas) {
                if (!schema['@context'] || !schema['@context'].includes('schema.org')) {
                    issues.push('Missing or invalid @context (should include schema.org)');
                }
                if (!schema['@type']) {
                    issues.push('Missing @type');
                }
            }

            const result = {
                valid: issues.length === 0,
                schemas_found: schemas.length,
                types: schemas.map(s => s['@type']).filter(Boolean),
                issues: issues.length > 0 ? issues : undefined,
                source: url || 'inline markup',
            };
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.status ? `HTTP ${error.response.status}` : error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error validating schema: ${errorMessage}` }] } };
        }
    },

    sd_inject: async (params) => {
        try {
            const { post_id, schema_type, schema_data } = params;
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': schema_type,
                ...schema_data,
            });
            // Store JSON-LD in post meta via WordPress REST API
            const response = await makeWordPressRequest('POST', `posts/${post_id}`, {
                meta: { _schema_json_ld: jsonLd },
            });
            return { toolResult: { content: [{ type: "text", text: JSON.stringify({ success: true, post_id, schema_type, stored: true }, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error injecting schema: ${errorMessage}` }] } };
        }
    },

    sd_list_schemas: async (params) => {
        try {
            const { schema_type } = params;
            // Fetch recent posts and check for JSON-LD in meta
            const posts = await makeWordPressRequest('GET', 'posts', { per_page: 100, _fields: 'id,title,meta' });
            const schemas = {};
            for (const post of posts) {
                const meta = post.meta?._schema_json_ld;
                if (meta) {
                    try {
                        const parsed = JSON.parse(meta);
                        const type = parsed['@type'] || 'Unknown';
                        if (schema_type && type !== schema_type) continue;
                        if (!schemas[type]) schemas[type] = { count: 0, posts: [] };
                        schemas[type].count++;
                        schemas[type].posts.push({ id: post.id, title: post.title?.rendered });
                    } catch { /* skip invalid JSON */ }
                }
            }
            return { toolResult: { content: [{ type: "text", text: JSON.stringify({ total_types: Object.keys(schemas).length, schemas }, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing schemas: ${errorMessage}` }] } };
        }
    },
};
