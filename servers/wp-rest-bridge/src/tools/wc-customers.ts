// src/tools/wc-customers.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { makeWooCommerceRequest } from '../wordpress.js';
import { z } from 'zod';

const wcListCustomersSchema = z.object({
  per_page: z.number().optional().default(10).describe("Results per page (1-100)"),
  page: z.number().optional().default(1).describe("Page number"),
  search: z.string().optional().describe("Search customers by keyword"),
  email: z.string().optional().describe("Filter by exact email"),
  role: z.enum(['all', 'administrator', 'editor', 'author', 'contributor', 'subscriber', 'customer']).optional().default('all').describe("Filter by role"),
  orderby: z.enum(['id', 'name', 'registered_date']).optional().describe("Sort by field"),
  order: z.enum(['asc', 'desc']).optional().default('desc').describe("Sort order"),
}).strict();

const wcGetCustomerSchema = z.object({
  id: z.number().describe("Customer ID"),
}).strict();

const wcCreateCustomerSchema = z.object({
  email: z.string().describe("Customer email address"),
  first_name: z.string().optional().describe("First name"),
  last_name: z.string().optional().describe("Last name"),
  username: z.string().optional().describe("Username (auto-generated if omitted)"),
  password: z.string().optional().describe("Password (auto-generated if omitted)"),
}).strict();

const wcUpdateCustomerSchema = z.object({
  id: z.number().describe("Customer ID"),
  email: z.string().optional().describe("Email address"),
  first_name: z.string().optional().describe("First name"),
  last_name: z.string().optional().describe("Last name"),
}).strict();

export const wcCustomerTools: Tool[] = [
  {
    name: "wc_list_customers",
    description: "Lists WooCommerce customers with filtering and search",
    inputSchema: { type: "object", properties: wcListCustomersSchema.shape },
  },
  {
    name: "wc_get_customer",
    description: "Retrieves a WooCommerce customer with order count and total spent",
    inputSchema: { type: "object", properties: wcGetCustomerSchema.shape },
  },
  {
    name: "wc_create_customer",
    description: "Creates a new WooCommerce customer account",
    inputSchema: { type: "object", properties: wcCreateCustomerSchema.shape },
  },
  {
    name: "wc_update_customer",
    description: "Updates a WooCommerce customer's details",
    inputSchema: { type: "object", properties: wcUpdateCustomerSchema.shape },
  },
];

export const wcCustomerHandlers = {
  wc_list_customers: async (params: z.infer<typeof wcListCustomersSchema>) => {
    try {
      const response = await makeWooCommerceRequest("GET", "customers", params);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing customers: ${errorMessage}` }] } };
    }
  },

  wc_get_customer: async (params: z.infer<typeof wcGetCustomerSchema>) => {
    try {
      const response = await makeWooCommerceRequest("GET", `customers/${params.id}`);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error retrieving customer: ${errorMessage}` }] } };
    }
  },

  wc_create_customer: async (params: z.infer<typeof wcCreateCustomerSchema>) => {
    try {
      const response = await makeWooCommerceRequest("POST", "customers", params);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating customer: ${errorMessage}` }] } };
    }
  },

  wc_update_customer: async (params: z.infer<typeof wcUpdateCustomerSchema>) => {
    try {
      const { id, ...data } = params;
      const response = await makeWooCommerceRequest("PUT", `customers/${id}`, data);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error updating customer: ${errorMessage}` }] } };
    }
  },
};
