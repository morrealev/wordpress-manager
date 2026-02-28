import { makeWooCommerceRequest } from '../wordpress.js';
import { z } from 'zod';
// ── Schemas ──────────────────────────────────────────────────────────
const wcListProductsSchema = z.object({
    per_page: z.number().optional().default(10).describe("Results per page (1-100)"),
    page: z.number().optional().default(1).describe("Page number"),
    search: z.string().optional().describe("Search products by keyword"),
    status: z.enum(['draft', 'pending', 'private', 'publish', 'any']).optional().describe("Product status filter"),
    category: z.number().optional().describe("Filter by category ID"),
    tag: z.number().optional().describe("Filter by tag ID"),
    sku: z.string().optional().describe("Filter by exact SKU"),
    stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional().describe("Filter by stock status"),
    orderby: z.enum(['date', 'id', 'title', 'slug', 'price', 'popularity', 'rating']).optional().describe("Sort by field"),
    order: z.enum(['asc', 'desc']).optional().default('desc').describe("Sort order"),
}).strict();
const wcGetProductSchema = z.object({
    id: z.number().describe("Product ID"),
}).strict();
const wcCreateProductSchema = z.object({
    name: z.string().describe("Product name"),
    type: z.enum(['simple', 'grouped', 'external', 'variable']).optional().default('simple').describe("Product type"),
    status: z.enum(['draft', 'pending', 'private', 'publish']).optional().default('publish').describe("Product status"),
    regular_price: z.string().optional().describe("Regular price (e.g. '19.99')"),
    sale_price: z.string().optional().describe("Sale price"),
    description: z.string().optional().describe("Full product description (HTML)"),
    short_description: z.string().optional().describe("Short product description (HTML)"),
    sku: z.string().optional().describe("Stock Keeping Unit"),
    manage_stock: z.boolean().optional().describe("Enable stock management"),
    stock_quantity: z.number().optional().describe("Stock quantity (requires manage_stock: true)"),
    categories: z.array(z.object({ id: z.number() })).optional().describe("Category IDs, e.g. [{id: 15}]"),
    tags: z.array(z.object({ id: z.number() })).optional().describe("Tag IDs, e.g. [{id: 3}]"),
    images: z.array(z.object({ src: z.string() })).optional().describe("Image URLs, e.g. [{src: 'https://...'}]"),
}).strict();
const wcUpdateProductSchema = z.object({
    id: z.number().describe("Product ID to update"),
    name: z.string().optional().describe("Product name"),
    status: z.enum(['draft', 'pending', 'private', 'publish']).optional().describe("Product status"),
    regular_price: z.string().optional().describe("Regular price"),
    sale_price: z.string().optional().describe("Sale price"),
    description: z.string().optional().describe("Full description"),
    short_description: z.string().optional().describe("Short description"),
    sku: z.string().optional().describe("SKU"),
    manage_stock: z.boolean().optional().describe("Enable stock management"),
    stock_quantity: z.number().optional().describe("Stock quantity"),
    stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional().describe("Stock status"),
}).strict();
const wcDeleteProductSchema = z.object({
    id: z.number().describe("Product ID to delete"),
    force: z.boolean().optional().default(false).describe("True to permanently delete, false to move to trash"),
}).strict();
const wcListProductCategoriesSchema = z.object({
    per_page: z.number().optional().default(10).describe("Results per page (1-100)"),
    page: z.number().optional().default(1).describe("Page number"),
    search: z.string().optional().describe("Search categories by keyword"),
    parent: z.number().optional().describe("Filter by parent category ID"),
    orderby: z.enum(['id', 'name', 'slug', 'count']).optional().describe("Sort by field"),
    order: z.enum(['asc', 'desc']).optional().default('asc').describe("Sort order"),
}).strict();
const wcListProductVariationsSchema = z.object({
    product_id: z.number().describe("Parent product ID"),
    per_page: z.number().optional().default(10).describe("Results per page (1-100)"),
    page: z.number().optional().default(1).describe("Page number"),
    status: z.enum(['draft', 'pending', 'private', 'publish', 'any']).optional().describe("Variation status"),
}).strict();
// ── Tool Definitions ─────────────────────────────────────────────────
export const wcProductTools = [
    {
        name: "wc_list_products",
        description: "Lists WooCommerce products with filtering, sorting, and pagination",
        inputSchema: { type: "object", properties: wcListProductsSchema.shape },
    },
    {
        name: "wc_get_product",
        description: "Retrieves a single WooCommerce product by ID with full details",
        inputSchema: { type: "object", properties: wcGetProductSchema.shape },
    },
    {
        name: "wc_create_product",
        description: "Creates a new WooCommerce product (simple, grouped, external, or variable)",
        inputSchema: { type: "object", properties: wcCreateProductSchema.shape },
    },
    {
        name: "wc_update_product",
        description: "Updates an existing WooCommerce product's fields",
        inputSchema: { type: "object", properties: wcUpdateProductSchema.shape },
    },
    {
        name: "wc_delete_product",
        description: "Deletes a WooCommerce product (trash or permanent)",
        inputSchema: { type: "object", properties: wcDeleteProductSchema.shape },
    },
    {
        name: "wc_list_product_categories",
        description: "Lists WooCommerce product categories with hierarchy support",
        inputSchema: { type: "object", properties: wcListProductCategoriesSchema.shape },
    },
    {
        name: "wc_list_product_variations",
        description: "Lists variations of a variable WooCommerce product",
        inputSchema: { type: "object", properties: wcListProductVariationsSchema.shape },
    },
];
// ── Handlers ─────────────────────────────────────────────────────────
export const wcProductHandlers = {
    wc_list_products: async (params) => {
        try {
            const response = await makeWooCommerceRequest("GET", "products", params);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing products: ${errorMessage}` }] } };
        }
    },
    wc_get_product: async (params) => {
        try {
            const response = await makeWooCommerceRequest("GET", `products/${params.id}`);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error retrieving product: ${errorMessage}` }] } };
        }
    },
    wc_create_product: async (params) => {
        try {
            const response = await makeWooCommerceRequest("POST", "products", params);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating product: ${errorMessage}` }] } };
        }
    },
    wc_update_product: async (params) => {
        try {
            const { id, ...data } = params;
            const response = await makeWooCommerceRequest("PUT", `products/${id}`, data);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error updating product: ${errorMessage}` }] } };
        }
    },
    wc_delete_product: async (params) => {
        try {
            const response = await makeWooCommerceRequest("DELETE", `products/${params.id}`, { force: params.force });
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error deleting product: ${errorMessage}` }] } };
        }
    },
    wc_list_product_categories: async (params) => {
        try {
            const response = await makeWooCommerceRequest("GET", "products/categories", params);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing product categories: ${errorMessage}` }] } };
        }
    },
    wc_list_product_variations: async (params) => {
        try {
            const { product_id, ...queryParams } = params;
            const response = await makeWooCommerceRequest("GET", `products/${product_id}/variations`, queryParams);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing product variations: ${errorMessage}` }] } };
        }
    },
};
