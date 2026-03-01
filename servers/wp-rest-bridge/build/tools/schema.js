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
                // Fetch URL and extract ALL JSON-LD blocks
                const response = await axios.get(url, { timeout: 15000 });
                const html = response.data;
                const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
                const allJsonLd = [];
                let match;
                while ((match = jsonLdRegex.exec(html)) !== null) {
                    try {
                        const parsed = JSON.parse(match[1]);
                        if (Array.isArray(parsed)) allJsonLd.push(...parsed);
                        else allJsonLd.push(parsed);
                    } catch { /* skip invalid JSON-LD blocks */ }
                }
                if (allJsonLd.length === 0) {
                    return { toolResult: { content: [{ type: "text", text: JSON.stringify({ valid: false, error: "No valid JSON-LD found on page", url }, null, 2) }] } };
                }
                jsonLd = allJsonLd;
            }

            // Basic Schema.org validation
            const issues = [];
            const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
            for (const schema of schemas) {
                const schemaLabel = schema['@type'] || '(unnamed)';
                if (!schema['@context'] || !String(schema['@context']).includes('schema.org')) {
                    issues.push(`${schemaLabel}: Missing or invalid @context (should include schema.org)`);
                }
                if (!schema['@type']) {
                    issues.push(`${schemaLabel}: Missing @type`);
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
            }, null, 2);
            const scriptBlock = `\n<!-- wp:html -->\n<script type="application/ld+json">\n${jsonLd}\n</script>\n<!-- /wp:html -->`;
            // Fetch current post content
            const post = await makeWordPressRequest('GET', `posts/${post_id}`, { _fields: 'content', context: 'edit' });
            let content = post.content?.raw || post.content?.rendered || '';
            // Remove existing JSON-LD block for this schema type if present
            const existingPattern = new RegExp(
                `\\n?<!-- wp:html -->\\n<script type="application/ld\\+json">\\n[\\s\\S]*?"@type":\\s*"${schema_type}"[\\s\\S]*?</script>\\n<!-- /wp:html -->`,
                'g'
            );
            content = content.replace(existingPattern, '');
            // Append new JSON-LD block
            content = content.trimEnd() + scriptBlock;
            // Update post
            await makeWordPressRequest('POST', `posts/${post_id}`, { content });
            return { toolResult: { content: [{ type: "text", text: JSON.stringify({ success: true, post_id, schema_type, method: 'content_block', note: 'JSON-LD injected as wp:html block in post content' }, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error injecting schema: ${errorMessage}` }] } };
        }
    },

    sd_list_schemas: async (params) => {
        try {
            const { schema_type } = params;
            // Fetch posts and scan content for JSON-LD script blocks
            const posts = await makeWordPressRequest('GET', 'posts', { per_page: 100, _fields: 'id,title,content' });
            const schemas = {};
            const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
            for (const post of posts) {
                const content = post.content?.rendered || '';
                let match;
                while ((match = jsonLdRegex.exec(content)) !== null) {
                    try {
                        const parsed = JSON.parse(match[1]);
                        const items = Array.isArray(parsed) ? parsed : [parsed];
                        for (const item of items) {
                            const type = item['@type'] || 'Unknown';
                            if (schema_type && type !== schema_type) continue;
                            if (!schemas[type]) schemas[type] = { count: 0, posts: [] };
                            schemas[type].count++;
                            schemas[type].posts.push({ id: post.id, title: post.title?.rendered });
                        }
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
