import { makeMailchimpRequest, hasMailchimp } from '../wordpress.js';
import { z } from 'zod';
// ── Zod Schemas ─────────────────────────────────────────────────
const mcListAudiencesSchema = z.object({}).strict();
const mcGetAudienceMembersSchema = z.object({
    list_id: z.string().describe('Audience (list) ID'),
    status: z.enum(['subscribed', 'unsubscribed', 'cleaned', 'pending']).optional()
        .describe('Filter members by subscription status'),
    count: z.number().optional().default(100)
        .describe('Number of members to return (default 100)'),
    offset: z.number().optional()
        .describe('Number of members to skip (for pagination)'),
}).strict();
const mcCreateCampaignSchema = z.object({
    type: z.enum(['regular', 'plaintext', 'absplit'])
        .describe('Campaign type'),
    list_id: z.string().describe('Audience (list) ID to send to'),
    subject_line: z.string().describe('Email subject line'),
    from_name: z.string().describe('Sender name shown to recipients'),
    reply_to: z.string().describe('Reply-to email address'),
}).strict();
const mcUpdateCampaignContentSchema = z.object({
    campaign_id: z.string().describe('Campaign ID'),
    html: z.string().describe('HTML content for the campaign email'),
}).strict();
const mcSendCampaignSchema = z.object({
    campaign_id: z.string().describe('Campaign ID to send'),
}).strict();
const mcGetCampaignReportSchema = z.object({
    campaign_id: z.string().describe('Campaign ID to get report for'),
}).strict();
const mcAddSubscriberSchema = z.object({
    list_id: z.string().describe('Audience (list) ID'),
    email_address: z.string().describe('Subscriber email address'),
    status: z.enum(['subscribed', 'unsubscribed', 'cleaned', 'pending'])
        .describe('Subscription status'),
    merge_fields: z.record(z.any()).optional()
        .describe('Merge fields (e.g. FNAME, LNAME)'),
    tags: z.array(z.string()).optional()
        .describe('Tags to assign to the subscriber'),
}).strict();
// ── Tool Definitions ────────────────────────────────────────────
export const mailchimpTools = [
    {
        name: "mc_list_audiences",
        description: "Lists all Mailchimp audiences (lists) with member counts and stats",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "mc_get_audience_members",
        description: "Gets members of a Mailchimp audience with optional status filter",
        inputSchema: {
            type: "object",
            properties: {
                list_id: { type: "string", description: "Audience (list) ID" },
                status: {
                    type: "string",
                    enum: ["subscribed", "unsubscribed", "cleaned", "pending"],
                    description: "Filter members by subscription status",
                },
                count: { type: "number", description: "Number of members to return (default 100)" },
                offset: { type: "number", description: "Number of members to skip (for pagination)" },
            },
            required: ["list_id"],
        },
    },
    {
        name: "mc_create_campaign",
        description: "Creates a new Mailchimp email campaign",
        inputSchema: {
            type: "object",
            properties: {
                type: {
                    type: "string",
                    enum: ["regular", "plaintext", "absplit"],
                    description: "Campaign type",
                },
                list_id: { type: "string", description: "Audience (list) ID to send to" },
                subject_line: { type: "string", description: "Email subject line" },
                from_name: { type: "string", description: "Sender name shown to recipients" },
                reply_to: { type: "string", description: "Reply-to email address" },
            },
            required: ["type", "list_id", "subject_line", "from_name", "reply_to"],
        },
    },
    {
        name: "mc_update_campaign_content",
        description: "Sets the HTML content of a Mailchimp campaign",
        inputSchema: {
            type: "object",
            properties: {
                campaign_id: { type: "string", description: "Campaign ID" },
                html: { type: "string", description: "HTML content for the campaign email" },
            },
            required: ["campaign_id", "html"],
        },
    },
    {
        name: "mc_send_campaign",
        description: "Sends a Mailchimp campaign to its audience (DESTRUCTIVE — triggers real emails)",
        inputSchema: {
            type: "object",
            properties: {
                campaign_id: { type: "string", description: "Campaign ID to send" },
            },
            required: ["campaign_id"],
        },
    },
    {
        name: "mc_get_campaign_report",
        description: "Gets performance report for a sent Mailchimp campaign (opens, clicks, bounces)",
        inputSchema: {
            type: "object",
            properties: {
                campaign_id: { type: "string", description: "Campaign ID to get report for" },
            },
            required: ["campaign_id"],
        },
    },
    {
        name: "mc_add_subscriber",
        description: "Adds or updates a subscriber in a Mailchimp audience",
        inputSchema: {
            type: "object",
            properties: {
                list_id: { type: "string", description: "Audience (list) ID" },
                email_address: { type: "string", description: "Subscriber email address" },
                status: {
                    type: "string",
                    enum: ["subscribed", "unsubscribed", "cleaned", "pending"],
                    description: "Subscription status",
                },
                merge_fields: { type: "object", description: "Merge fields (e.g. FNAME, LNAME)" },
                tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Tags to assign to the subscriber",
                },
            },
            required: ["list_id", "email_address", "status"],
        },
    },
];
// ── Handlers ────────────────────────────────────────────────────
export const mailchimpHandlers = {
    mc_list_audiences: async (_params) => {
        if (!hasMailchimp()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Mailchimp not configured. Add mailchimp_api_key to WP_SITES_CONFIG." }] } };
        }
        try {
            const response = await makeMailchimpRequest("GET", "/lists");
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing audiences: ${errorMessage}` }] } };
        }
    },
    mc_get_audience_members: async (params) => {
        if (!hasMailchimp()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Mailchimp not configured. Add mailchimp_api_key to WP_SITES_CONFIG." }] } };
        }
        try {
            const { list_id, status, count, offset } = params;
            const query = {};
            if (status)
                query.status = status;
            if (count !== undefined)
                query.count = count;
            if (offset !== undefined)
                query.offset = offset;
            const qs = Object.entries(query).map(([k, v]) => `${k}=${v}`).join('&');
            const endpoint = `/lists/${list_id}/members${qs ? '?' + qs : ''}`;
            const response = await makeMailchimpRequest("GET", endpoint);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting audience members: ${errorMessage}` }] } };
        }
    },
    mc_create_campaign: async (params) => {
        if (!hasMailchimp()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Mailchimp not configured. Add mailchimp_api_key to WP_SITES_CONFIG." }] } };
        }
        try {
            const { type, list_id, subject_line, from_name, reply_to } = params;
            const body = {
                type,
                recipients: { list_id },
                settings: { subject_line, from_name, reply_to },
            };
            const response = await makeMailchimpRequest("POST", "/campaigns", body);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating campaign: ${errorMessage}` }] } };
        }
    },
    mc_update_campaign_content: async (params) => {
        if (!hasMailchimp()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Mailchimp not configured. Add mailchimp_api_key to WP_SITES_CONFIG." }] } };
        }
        try {
            const { campaign_id, html } = params;
            const response = await makeMailchimpRequest("PUT", `/campaigns/${campaign_id}/content`, { html });
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error updating campaign content: ${errorMessage}` }] } };
        }
    },
    mc_send_campaign: async (params) => {
        if (!hasMailchimp()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Mailchimp not configured. Add mailchimp_api_key to WP_SITES_CONFIG." }] } };
        }
        try {
            const { campaign_id } = params;
            const response = await makeMailchimpRequest("POST", `/campaigns/${campaign_id}/actions/send`);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response ?? { success: true, message: "Campaign sent successfully" }, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error sending campaign: ${errorMessage}` }] } };
        }
    },
    mc_get_campaign_report: async (params) => {
        if (!hasMailchimp()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Mailchimp not configured. Add mailchimp_api_key to WP_SITES_CONFIG." }] } };
        }
        try {
            const { campaign_id } = params;
            const response = await makeMailchimpRequest("GET", `/reports/${campaign_id}`);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting campaign report: ${errorMessage}` }] } };
        }
    },
    mc_add_subscriber: async (params) => {
        if (!hasMailchimp()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Mailchimp not configured. Add mailchimp_api_key to WP_SITES_CONFIG." }] } };
        }
        try {
            const { list_id, email_address, status, merge_fields, tags } = params;
            const body = { email_address, status };
            if (merge_fields)
                body.merge_fields = merge_fields;
            if (tags)
                body.tags = tags;
            const response = await makeMailchimpRequest("POST", `/lists/${list_id}/members`, body);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error adding subscriber: ${errorMessage}` }] } };
        }
    },
};
