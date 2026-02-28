// src/tools/wc-orders.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { makeWooCommerceRequest } from '../wordpress.js';
import { z } from 'zod';

const wcListOrdersSchema = z.object({
  per_page: z.number().optional().default(10).describe("Results per page (1-100)"),
  page: z.number().optional().default(1).describe("Page number"),
  status: z.enum(['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed', 'trash', 'any']).optional().describe("Order status filter"),
  customer: z.number().optional().describe("Filter by customer ID"),
  after: z.string().optional().describe("Orders after date (ISO 8601)"),
  before: z.string().optional().describe("Orders before date (ISO 8601)"),
  orderby: z.enum(['date', 'id', 'title', 'slug']).optional().describe("Sort by field"),
  order: z.enum(['asc', 'desc']).optional().default('desc').describe("Sort order"),
}).strict();

const wcGetOrderSchema = z.object({
  id: z.number().describe("Order ID"),
}).strict();

const wcUpdateOrderStatusSchema = z.object({
  id: z.number().describe("Order ID"),
  status: z.enum(['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed']).describe("New order status"),
}).strict();

const wcListOrderNotesSchema = z.object({
  order_id: z.number().describe("Order ID"),
}).strict();

const wcCreateOrderNoteSchema = z.object({
  order_id: z.number().describe("Order ID"),
  note: z.string().describe("Note content"),
  customer_note: z.boolean().optional().default(false).describe("If true, note is visible to customer"),
}).strict();

const wcCreateRefundSchema = z.object({
  order_id: z.number().describe("Order ID"),
  amount: z.string().describe("Refund amount (e.g. '9.99')"),
  reason: z.string().optional().describe("Reason for refund"),
}).strict();

export const wcOrderTools: Tool[] = [
  {
    name: "wc_list_orders",
    description: "Lists WooCommerce orders with filtering by status, customer, and date range",
    inputSchema: { type: "object", properties: wcListOrdersSchema.shape },
  },
  {
    name: "wc_get_order",
    description: "Retrieves a single WooCommerce order with full details including line items",
    inputSchema: { type: "object", properties: wcGetOrderSchema.shape },
  },
  {
    name: "wc_update_order_status",
    description: "Updates the status of a WooCommerce order (e.g. processing to completed)",
    inputSchema: { type: "object", properties: wcUpdateOrderStatusSchema.shape },
  },
  {
    name: "wc_list_order_notes",
    description: "Lists all notes for a WooCommerce order",
    inputSchema: { type: "object", properties: wcListOrderNotesSchema.shape },
  },
  {
    name: "wc_create_order_note",
    description: "Adds a note to a WooCommerce order (internal or customer-visible)",
    inputSchema: { type: "object", properties: wcCreateOrderNoteSchema.shape },
  },
  {
    name: "wc_create_refund",
    description: "Creates a refund for a WooCommerce order",
    inputSchema: { type: "object", properties: wcCreateRefundSchema.shape },
  },
];

export const wcOrderHandlers = {
  wc_list_orders: async (params: z.infer<typeof wcListOrdersSchema>) => {
    try {
      const response = await makeWooCommerceRequest("GET", "orders", params);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing orders: ${errorMessage}` }] } };
    }
  },

  wc_get_order: async (params: z.infer<typeof wcGetOrderSchema>) => {
    try {
      const response = await makeWooCommerceRequest("GET", `orders/${params.id}`);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error retrieving order: ${errorMessage}` }] } };
    }
  },

  wc_update_order_status: async (params: z.infer<typeof wcUpdateOrderStatusSchema>) => {
    try {
      const response = await makeWooCommerceRequest("PUT", `orders/${params.id}`, { status: params.status });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error updating order status: ${errorMessage}` }] } };
    }
  },

  wc_list_order_notes: async (params: z.infer<typeof wcListOrderNotesSchema>) => {
    try {
      const response = await makeWooCommerceRequest("GET", `orders/${params.order_id}/notes`);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing order notes: ${errorMessage}` }] } };
    }
  },

  wc_create_order_note: async (params: z.infer<typeof wcCreateOrderNoteSchema>) => {
    try {
      const { order_id, ...data } = params;
      const response = await makeWooCommerceRequest("POST", `orders/${order_id}/notes`, data);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating order note: ${errorMessage}` }] } };
    }
  },

  wc_create_refund: async (params: z.infer<typeof wcCreateRefundSchema>) => {
    try {
      const { order_id, ...data } = params;
      const response = await makeWooCommerceRequest("POST", `orders/${order_id}/refunds`, data);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating refund: ${errorMessage}` }] } };
    }
  },
};
