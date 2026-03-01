import { makeSendGridRequest, hasSendGrid } from '../wordpress.js';
import { z } from 'zod';
// ── Zod Schemas ─────────────────────────────────────────────────
const sgSendEmailSchema = z.object({
    to_email: z.string().describe('Recipient email address'),
    to_name: z.string().optional().describe('Recipient name'),
    from_email: z.string().describe('Sender email address'),
    from_name: z.string().optional().describe('Sender name'),
    subject: z.string().describe('Email subject line'),
    content_type: z.string().optional().default('text/html')
        .describe('Content MIME type (default: text/html)'),
    content_value: z.string().describe('Email body content'),
    template_id: z.string().optional()
        .describe('SendGrid dynamic template ID (overrides content)'),
}).strict();
const sgListTemplatesSchema = z.object({
    generations: z.enum(['legacy', 'dynamic']).optional()
        .describe('Filter by template generation type'),
    page_size: z.number().optional()
        .describe('Number of templates per page'),
}).strict();
const sgGetTemplateSchema = z.object({
    template_id: z.string().describe('SendGrid template ID'),
}).strict();
const sgListContactsSchema = z.object({
    query: z.string().optional()
        .describe('SGQL query string for filtering contacts'),
}).strict();
const sgAddContactsSchema = z.object({
    contacts: z.array(z.object({
        email: z.string().describe('Contact email address'),
        first_name: z.string().optional().describe('Contact first name'),
        last_name: z.string().optional().describe('Contact last name'),
        custom_fields: z.record(z.any()).optional().describe('Custom field key-value pairs'),
    })).describe('Array of contacts to add or update'),
}).strict();
const sgGetStatsSchema = z.object({
    start_date: z.string().describe('Start date in YYYY-MM-DD format'),
    end_date: z.string().optional().describe('End date in YYYY-MM-DD format'),
    aggregated_by: z.enum(['day', 'week', 'month']).optional()
        .describe('Aggregation period for stats'),
}).strict();
// ── Tool Definitions ────────────────────────────────────────────
export const sendgridTools = [
    {
        name: "sg_send_email",
        description: "Sends a transactional email via SendGrid (DESTRUCTIVE — sends real email)",
        inputSchema: {
            type: "object",
            properties: {
                to_email: { type: "string", description: "Recipient email address" },
                to_name: { type: "string", description: "Recipient name" },
                from_email: { type: "string", description: "Sender email address" },
                from_name: { type: "string", description: "Sender name" },
                subject: { type: "string", description: "Email subject line" },
                content_type: { type: "string", description: "Content MIME type (default: text/html)" },
                content_value: { type: "string", description: "Email body content" },
                template_id: { type: "string", description: "SendGrid dynamic template ID (overrides content)" },
            },
            required: ["to_email", "from_email", "subject", "content_value"],
        },
    },
    {
        name: "sg_list_templates",
        description: "Lists all SendGrid email templates",
        inputSchema: {
            type: "object",
            properties: {
                generations: {
                    type: "string",
                    enum: ["legacy", "dynamic"],
                    description: "Filter by template generation type",
                },
                page_size: { type: "number", description: "Number of templates per page" },
            },
        },
    },
    {
        name: "sg_get_template",
        description: "Gets a specific SendGrid template with its versions",
        inputSchema: {
            type: "object",
            properties: {
                template_id: { type: "string", description: "SendGrid template ID" },
            },
            required: ["template_id"],
        },
    },
    {
        name: "sg_list_contacts",
        description: "Lists SendGrid Marketing contacts with optional search",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "SGQL query string for filtering contacts" },
            },
        },
    },
    {
        name: "sg_add_contacts",
        description: "Adds or updates contacts in SendGrid Marketing",
        inputSchema: {
            type: "object",
            properties: {
                contacts: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            email: { type: "string", description: "Contact email address" },
                            first_name: { type: "string", description: "Contact first name" },
                            last_name: { type: "string", description: "Contact last name" },
                            custom_fields: { type: "object", description: "Custom field key-value pairs" },
                        },
                        required: ["email"],
                    },
                    description: "Array of contacts to add or update",
                },
            },
            required: ["contacts"],
        },
    },
    {
        name: "sg_get_stats",
        description: "Gets email delivery statistics for a date range",
        inputSchema: {
            type: "object",
            properties: {
                start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
                end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
                aggregated_by: {
                    type: "string",
                    enum: ["day", "week", "month"],
                    description: "Aggregation period for stats",
                },
            },
            required: ["start_date"],
        },
    },
];
// ── Handlers ────────────────────────────────────────────────────
export const sendgridHandlers = {
    sg_send_email: async (params) => {
        if (!hasSendGrid()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "SendGrid not configured. Add sendgrid_api_key to WP_SITES_CONFIG." }] } };
        }
        try {
            const { to_email, to_name, from_email, from_name, subject, content_type, content_value, template_id } = params;
            const body = {
                personalizations: [{ to: [{ email: to_email, ...(to_name ? { name: to_name } : {}) }], subject }],
                from: { email: from_email, ...(from_name ? { name: from_name } : {}) },
                subject,
                content: [{ type: content_type || 'text/html', value: content_value }],
            };
            if (template_id)
                body.template_id = template_id;
            const response = await makeSendGridRequest("POST", "mail/send", body);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response ?? { success: true, message: "Email sent successfully" }, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error sending email: ${errorMessage}` }] } };
        }
    },
    sg_list_templates: async (params) => {
        if (!hasSendGrid()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "SendGrid not configured. Add sendgrid_api_key to WP_SITES_CONFIG." }] } };
        }
        try {
            const { generations, page_size } = params;
            const query = {};
            if (generations)
                query.generations = generations;
            if (page_size !== undefined)
                query.page_size = page_size;
            const qs = Object.entries(query).map(([k, v]) => `${k}=${v}`).join('&');
            const endpoint = `templates${qs ? '?' + qs : ''}`;
            const response = await makeSendGridRequest("GET", endpoint);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing templates: ${errorMessage}` }] } };
        }
    },
    sg_get_template: async (params) => {
        if (!hasSendGrid()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "SendGrid not configured. Add sendgrid_api_key to WP_SITES_CONFIG." }] } };
        }
        try {
            const { template_id } = params;
            const response = await makeSendGridRequest("GET", `templates/${template_id}`);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting template: ${errorMessage}` }] } };
        }
    },
    sg_list_contacts: async (params) => {
        if (!hasSendGrid()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "SendGrid not configured. Add sendgrid_api_key to WP_SITES_CONFIG." }] } };
        }
        try {
            const { query } = params;
            let response;
            if (query) {
                response = await makeSendGridRequest("POST", "marketing/contacts/search", { query });
            }
            else {
                response = await makeSendGridRequest("GET", "marketing/contacts");
            }
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing contacts: ${errorMessage}` }] } };
        }
    },
    sg_add_contacts: async (params) => {
        if (!hasSendGrid()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "SendGrid not configured. Add sendgrid_api_key to WP_SITES_CONFIG." }] } };
        }
        try {
            const { contacts } = params;
            const response = await makeSendGridRequest("PUT", "marketing/contacts", { contacts });
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error adding contacts: ${errorMessage}` }] } };
        }
    },
    sg_get_stats: async (params) => {
        if (!hasSendGrid()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "SendGrid not configured. Add sendgrid_api_key to WP_SITES_CONFIG." }] } };
        }
        try {
            const { start_date, end_date, aggregated_by } = params;
            const query = { start_date };
            if (end_date)
                query.end_date = end_date;
            if (aggregated_by)
                query.aggregated_by = aggregated_by;
            const qs = Object.entries(query).map(([k, v]) => `${k}=${v}`).join('&');
            const endpoint = `stats?${qs}`;
            const response = await makeSendGridRequest("GET", endpoint);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting stats: ${errorMessage}` }] } };
        }
    },
};
