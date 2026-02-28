// src/tools/wc-reports.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { makeWooCommerceRequest } from '../wordpress.js';
import { z } from 'zod';

const wcGetSalesReportSchema = z.object({
  period: z.enum(['week', 'month', 'last_month', 'year']).optional().default('week').describe("Report period"),
  date_min: z.string().optional().describe("Start date (YYYY-MM-DD)"),
  date_max: z.string().optional().describe("End date (YYYY-MM-DD)"),
}).strict();

const wcGetTopSellersSchema = z.object({
  period: z.enum(['week', 'month', 'last_month', 'year']).optional().default('week').describe("Report period"),
  date_min: z.string().optional().describe("Start date (YYYY-MM-DD)"),
  date_max: z.string().optional().describe("End date (YYYY-MM-DD)"),
}).strict();

const wcGetOrdersTotalsSchema = z.object({}).strict();
const wcGetProductsTotalsSchema = z.object({}).strict();
const wcGetCustomersTotalsSchema = z.object({}).strict();

export const wcReportTools: Tool[] = [
  {
    name: "wc_get_sales_report",
    description: "Gets WooCommerce sales report (total sales, orders, items, revenue) for a period",
    inputSchema: { type: "object", properties: wcGetSalesReportSchema.shape },
  },
  {
    name: "wc_get_top_sellers",
    description: "Gets top-selling WooCommerce products for a period",
    inputSchema: { type: "object", properties: wcGetTopSellersSchema.shape },
  },
  {
    name: "wc_get_orders_totals",
    description: "Gets WooCommerce order totals grouped by status",
    inputSchema: { type: "object", properties: wcGetOrdersTotalsSchema.shape },
  },
  {
    name: "wc_get_products_totals",
    description: "Gets WooCommerce product totals grouped by type",
    inputSchema: { type: "object", properties: wcGetProductsTotalsSchema.shape },
  },
  {
    name: "wc_get_customers_totals",
    description: "Gets WooCommerce customer totals (paying vs non-paying)",
    inputSchema: { type: "object", properties: wcGetCustomersTotalsSchema.shape },
  },
];

export const wcReportHandlers = {
  wc_get_sales_report: async (params: z.infer<typeof wcGetSalesReportSchema>) => {
    try {
      const response = await makeWooCommerceRequest("GET", "reports/sales", params);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting sales report: ${errorMessage}` }] } };
    }
  },

  wc_get_top_sellers: async (params: z.infer<typeof wcGetTopSellersSchema>) => {
    try {
      const response = await makeWooCommerceRequest("GET", "reports/top_sellers", params);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting top sellers: ${errorMessage}` }] } };
    }
  },

  wc_get_orders_totals: async () => {
    try {
      const response = await makeWooCommerceRequest("GET", "reports/orders/totals");
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting orders totals: ${errorMessage}` }] } };
    }
  },

  wc_get_products_totals: async () => {
    try {
      const response = await makeWooCommerceRequest("GET", "reports/products/totals");
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting products totals: ${errorMessage}` }] } };
    }
  },

  wc_get_customers_totals: async () => {
    try {
      const response = await makeWooCommerceRequest("GET", "reports/customers/totals");
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting customers totals: ${errorMessage}` }] } };
    }
  },
};
