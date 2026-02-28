// src/tools/wc-webhooks.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { makeWooCommerceRequest } from '../wordpress.js';
import { z } from 'zod';

const wcListWebhooksSchema = z.object({
  status: z.enum(['active', 'paused', 'disabled']).optional()
    .describe('Filter webhooks by status'),
}).strict();

const wcCreateWebhookSchema = z.object({
  name: z.string().describe('Webhook name (for identification)'),
  topic: z.string().describe('Event topic, e.g. "order.created", "product.updated"'),
  delivery_url: z.string().describe('URL to receive the webhook payload'),
  secret: z.string().optional().describe('Secret for HMAC-SHA256 signature verification'),
  status: z.enum(['active', 'paused', 'disabled']).optional()
    .describe('Webhook status (default: active)'),
}).strict();

const wcUpdateWebhookSchema = z.object({
  id: z.number().describe('Webhook ID to update'),
  name: z.string().optional().describe('Updated webhook name'),
  topic: z.string().optional().describe('Updated event topic'),
  delivery_url: z.string().optional().describe('Updated delivery URL'),
  secret: z.string().optional().describe('Updated secret'),
  status: z.enum(['active', 'paused', 'disabled']).optional()
    .describe('Updated webhook status'),
}).strict();

const wcDeleteWebhookSchema = z.object({
  id: z.number().describe('Webhook ID to delete'),
}).strict();

export const wcWebhookTools: Tool[] = [
  {
    name: "wc_list_webhooks",
    description: "Lists all WooCommerce webhooks with their status, topic, and delivery URL",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["active", "paused", "disabled"],
          description: "Filter webhooks by status",
        },
      },
    },
  },
  {
    name: "wc_create_webhook",
    description: "Creates a new WooCommerce webhook for event notifications (e.g. order.created, product.updated)",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Webhook name (for identification)" },
        topic: { type: "string", description: "Event topic, e.g. 'order.created', 'product.updated'" },
        delivery_url: { type: "string", description: "URL to receive the webhook payload" },
        secret: { type: "string", description: "Secret for HMAC-SHA256 signature verification" },
        status: {
          type: "string",
          enum: ["active", "paused", "disabled"],
          description: "Webhook status (default: active)",
        },
      },
      required: ["name", "topic", "delivery_url"],
    },
  },
  {
    name: "wc_update_webhook",
    description: "Updates an existing WooCommerce webhook (status, delivery URL, topic, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number", description: "Webhook ID to update" },
        name: { type: "string", description: "Updated webhook name" },
        topic: { type: "string", description: "Updated event topic" },
        delivery_url: { type: "string", description: "Updated delivery URL" },
        secret: { type: "string", description: "Updated secret" },
        status: {
          type: "string",
          enum: ["active", "paused", "disabled"],
          description: "Updated webhook status",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "wc_delete_webhook",
    description: "Deletes a WooCommerce webhook (stops notifications to the delivery URL)",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number", description: "Webhook ID to delete" },
      },
      required: ["id"],
    },
  },
];

export const wcWebhookHandlers = {
  wc_list_webhooks: async (params: z.infer<typeof wcListWebhooksSchema>) => {
    try {
      const query = params.status ? `?status=${params.status}` : '';
      const response = await makeWooCommerceRequest("GET", `webhooks${query}`);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing webhooks: ${errorMessage}` }] } };
    }
  },

  wc_create_webhook: async (params: z.infer<typeof wcCreateWebhookSchema>) => {
    try {
      const { name, topic, delivery_url, secret, status } = params;
      const body: Record<string, string> = { name, topic, delivery_url };
      if (secret) body.secret = secret;
      if (status) body.status = status;
      const response = await makeWooCommerceRequest("POST", "webhooks", body);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating webhook: ${errorMessage}` }] } };
    }
  },

  wc_update_webhook: async (params: z.infer<typeof wcUpdateWebhookSchema>) => {
    try {
      const { id, ...updates } = params;
      const response = await makeWooCommerceRequest("PUT", `webhooks/${id}`, updates);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error updating webhook: ${errorMessage}` }] } };
    }
  },

  wc_delete_webhook: async (params: z.infer<typeof wcDeleteWebhookSchema>) => {
    try {
      const response = await makeWooCommerceRequest("DELETE", `webhooks/${params.id}?force=true`);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error deleting webhook: ${errorMessage}` }] } };
    }
  },
};
