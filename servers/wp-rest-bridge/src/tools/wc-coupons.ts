// src/tools/wc-coupons.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { makeWooCommerceRequest } from '../wordpress.js';
import { z } from 'zod';

const wcListCouponsSchema = z.object({
  per_page: z.number().optional().default(10).describe("Results per page (1-100)"),
  page: z.number().optional().default(1).describe("Page number"),
  search: z.string().optional().describe("Search coupons by code"),
}).strict();

const wcGetCouponSchema = z.object({
  id: z.number().describe("Coupon ID"),
}).strict();

const wcCreateCouponSchema = z.object({
  code: z.string().describe("Coupon code (unique)"),
  discount_type: z.enum(['percent', 'fixed_cart', 'fixed_product']).optional().default('fixed_cart').describe("Discount type"),
  amount: z.string().describe("Discount amount (e.g. '10' for 10% or $10)"),
  description: z.string().optional().describe("Coupon description"),
  date_expires: z.string().optional().describe("Expiration date (ISO 8601)"),
  individual_use: z.boolean().optional().default(false).describe("Cannot combine with other coupons"),
  product_ids: z.array(z.number()).optional().describe("Products this coupon applies to"),
  usage_limit: z.number().optional().describe("Total usage limit"),
  usage_limit_per_user: z.number().optional().describe("Per-user usage limit"),
  minimum_amount: z.string().optional().describe("Minimum order amount required"),
  maximum_amount: z.string().optional().describe("Maximum order amount allowed"),
  free_shipping: z.boolean().optional().default(false).describe("Grants free shipping"),
}).strict();

const wcDeleteCouponSchema = z.object({
  id: z.number().describe("Coupon ID to delete"),
  force: z.boolean().optional().default(false).describe("True to permanently delete"),
}).strict();

export const wcCouponTools: Tool[] = [
  {
    name: "wc_list_coupons",
    description: "Lists WooCommerce coupons with search and pagination",
    inputSchema: { type: "object", properties: wcListCouponsSchema.shape },
  },
  {
    name: "wc_get_coupon",
    description: "Retrieves a WooCommerce coupon by ID with usage stats",
    inputSchema: { type: "object", properties: wcGetCouponSchema.shape },
  },
  {
    name: "wc_create_coupon",
    description: "Creates a new WooCommerce coupon with discount rules",
    inputSchema: { type: "object", properties: wcCreateCouponSchema.shape },
  },
  {
    name: "wc_delete_coupon",
    description: "Deletes a WooCommerce coupon",
    inputSchema: { type: "object", properties: wcDeleteCouponSchema.shape },
  },
];

export const wcCouponHandlers = {
  wc_list_coupons: async (params: z.infer<typeof wcListCouponsSchema>) => {
    try {
      const response = await makeWooCommerceRequest("GET", "coupons", params);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing coupons: ${errorMessage}` }] } };
    }
  },

  wc_get_coupon: async (params: z.infer<typeof wcGetCouponSchema>) => {
    try {
      const response = await makeWooCommerceRequest("GET", `coupons/${params.id}`);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error retrieving coupon: ${errorMessage}` }] } };
    }
  },

  wc_create_coupon: async (params: z.infer<typeof wcCreateCouponSchema>) => {
    try {
      const response = await makeWooCommerceRequest("POST", "coupons", params);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating coupon: ${errorMessage}` }] } };
    }
  },

  wc_delete_coupon: async (params: z.infer<typeof wcDeleteCouponSchema>) => {
    try {
      const response = await makeWooCommerceRequest("DELETE", `coupons/${params.id}`, { force: params.force });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error deleting coupon: ${errorMessage}` }] } };
    }
  },
};
