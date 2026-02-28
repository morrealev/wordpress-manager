# WooCommerce v1.8.0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add WooCommerce management to wordpress-manager plugin — 30 new MCP tools, skill, agent, and detection script.

**Architecture:** Extend WP REST Bridge with WC-specific authentication (Consumer Key/Secret via separate AxiosInstance), create 6 TypeScript tool files using `wc/v3` namespace, add `wp-woocommerce` skill with 8 reference files, `wp-ecommerce-manager` agent, and `woocommerce_inspect.mjs` detection script.

**Tech Stack:** TypeScript, zod, axios, MCP SDK, Node.js ESM (.mjs)

---

### Task 1: Extend types.ts with WooCommerce types

**Files:**
- Modify: `servers/wp-rest-bridge/src/types.ts` (append after line 174)

**Step 1: Add WC types**

Append at end of file:

```typescript
// ── WooCommerce Types ──────────────────────────────────────────────

export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number | null;
  stock_status: string;
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  images: { id: number; src: string; name: string; alt: string }[];
  attributes: { id: number; name: string; options: string[] }[];
  variations: number[];
  date_created: string;
  date_modified: string;
}

export interface WCOrder {
  id: number;
  status: string;
  currency: string;
  total: string;
  customer_id: number;
  billing: Record<string, string>;
  shipping: Record<string, string>;
  line_items: { id: number; name: string; product_id: number; quantity: number; total: string }[];
  date_created: string;
  date_modified: string;
  payment_method: string;
  payment_method_title: string;
}

export interface WCCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  billing: Record<string, string>;
  shipping: Record<string, string>;
  orders_count: number;
  total_spent: string;
  date_created: string;
}

export interface WCCoupon {
  id: number;
  code: string;
  discount_type: string;
  amount: string;
  date_created: string;
  date_expires: string | null;
  usage_count: number;
  usage_limit: number | null;
  individual_use: boolean;
  product_ids: number[];
  minimum_amount: string;
  maximum_amount: string;
}
```

**Step 2: Compile check**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/types.ts
git commit -m "feat(wc): add WooCommerce types (WCProduct, WCOrder, WCCustomer, WCCoupon)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Extend wordpress.ts with WC auth infrastructure

**Files:**
- Modify: `servers/wp-rest-bridge/src/wordpress.ts`

**Step 1: Extend SiteConfig** (line 4-9)

Replace:
```typescript
interface SiteConfig {
  id: string;
  url: string;
  username: string;
  password: string;
}
```

With:
```typescript
interface SiteConfig {
  id: string;
  url: string;
  username: string;
  password: string;
  wc_consumer_key?: string;
  wc_consumer_secret?: string;
}
```

**Step 2: Add wcSiteClients map** (after line 41, after `siteLimiters`)

```typescript
const wcSiteClients = new Map<string, AxiosInstance>();
```

**Step 3: Add initWcClient function** (after `initSiteClient` function, after line 139)

```typescript
/**
 * Initialize a WooCommerce client for a site (Consumer Key/Secret auth).
 */
async function initWcClient(id: string, url: string, consumerKey: string, consumerSecret: string) {
  let baseURL = url.endsWith('/') ? url : `${url}/`;
  const wpJsonIdx = baseURL.indexOf('/wp-json');
  if (wpJsonIdx !== -1) {
    baseURL = baseURL.substring(0, wpJsonIdx + 1);
  }
  baseURL = baseURL + 'wp-json/';

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    timeout: DEFAULT_TIMEOUT_MS,
  });

  // Verify WooCommerce connection
  try {
    await client.get('wc/v3');
  } catch (error: any) {
    logToStderr(`Warning: Could not verify WooCommerce connection for ${id}: ${error.message}`);
  }

  wcSiteClients.set(id, client);
}
```

**Step 4: Initialize WC clients in initWordPress()** (after the `for` loop at line 93, before `activeSiteId =`)

```typescript
  // Initialize WooCommerce clients for sites with WC credentials
  for (const site of sites) {
    if (site.wc_consumer_key && site.wc_consumer_secret) {
      await initWcClient(site.id, site.url, site.wc_consumer_key, site.wc_consumer_secret);
      logToStderr(`Initialized WooCommerce for site: ${site.id}`);
    }
  }
```

**Step 5: Add WC request functions** (before `// ── Plugin Repository` section)

```typescript
// ── WooCommerce Request Interface ────────────────────────────────

/**
 * Check if a site has WooCommerce credentials configured.
 */
export function hasWooCommerce(siteId?: string): boolean {
  const id = siteId || activeSiteId;
  return wcSiteClients.has(id);
}

/**
 * Get the WooCommerce client for a site.
 */
function getWcClient(siteId?: string): AxiosInstance {
  const id = siteId || activeSiteId;
  const client = wcSiteClients.get(id);
  if (!client) {
    throw new Error(
      `WooCommerce not configured for site "${id}". ` +
      `Add wc_consumer_key and wc_consumer_secret to WP_SITES_CONFIG.`
    );
  }
  return client;
}

/**
 * Make a request to the WooCommerce REST API.
 * Uses Consumer Key/Secret auth and wc/v3 namespace by default.
 */
export async function makeWooCommerceRequest(
  method: string,
  endpoint: string,
  data?: any,
  options?: WordPressRequestOptions
): Promise<any> {
  const siteId = options?.siteId || activeSiteId;
  const client = getWcClient(siteId);
  const limiter = getLimiter(siteId);
  const namespace = options?.namespace || 'wc/v3';

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  const path = `${namespace}/${cleanEndpoint}`;

  await limiter.acquire();
  try {
    return await executeWithRetry(client, method, path, data, siteId, options);
  } finally {
    limiter.release();
  }
}
```

**Step 6: Compile check**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add servers/wp-rest-bridge/src/wordpress.ts
git commit -m "feat(wc): add WooCommerce auth infrastructure to WP REST Bridge

- Extend SiteConfig with optional wc_consumer_key/wc_consumer_secret
- Add wcSiteClients map + initWcClient() for Consumer Key/Secret auth
- Add makeWooCommerceRequest() reusing executeWithRetry() logic
- Add hasWooCommerce() utility for credential detection

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Create wc-products.ts (7 tools)

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/wc-products.ts`

**Step 1: Write the complete file**

```typescript
// src/tools/wc-products.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
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

export const wcProductTools: Tool[] = [
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
  wc_list_products: async (params: z.infer<typeof wcListProductsSchema>) => {
    try {
      const response = await makeWooCommerceRequest("GET", "products", params);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing products: ${errorMessage}` }] } };
    }
  },

  wc_get_product: async (params: z.infer<typeof wcGetProductSchema>) => {
    try {
      const response = await makeWooCommerceRequest("GET", `products/${params.id}`);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error retrieving product: ${errorMessage}` }] } };
    }
  },

  wc_create_product: async (params: z.infer<typeof wcCreateProductSchema>) => {
    try {
      const response = await makeWooCommerceRequest("POST", "products", params);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating product: ${errorMessage}` }] } };
    }
  },

  wc_update_product: async (params: z.infer<typeof wcUpdateProductSchema>) => {
    try {
      const { id, ...data } = params;
      const response = await makeWooCommerceRequest("PUT", `products/${id}`, data);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error updating product: ${errorMessage}` }] } };
    }
  },

  wc_delete_product: async (params: z.infer<typeof wcDeleteProductSchema>) => {
    try {
      const response = await makeWooCommerceRequest("DELETE", `products/${params.id}`, { force: params.force });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error deleting product: ${errorMessage}` }] } };
    }
  },

  wc_list_product_categories: async (params: z.infer<typeof wcListProductCategoriesSchema>) => {
    try {
      const response = await makeWooCommerceRequest("GET", "products/categories", params);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing product categories: ${errorMessage}` }] } };
    }
  },

  wc_list_product_variations: async (params: z.infer<typeof wcListProductVariationsSchema>) => {
    try {
      const { product_id, ...queryParams } = params;
      const response = await makeWooCommerceRequest("GET", `products/${product_id}/variations`, queryParams);
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing product variations: ${errorMessage}` }] } };
    }
  },
};
```

**Step 2: Compile check**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/wc-products.ts
git commit -m "feat(wc): add wc-products.ts — 7 WooCommerce product tools

CRUD products, list categories, list variations.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Create wc-orders.ts (6 tools)

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/wc-orders.ts`

**Step 1: Write the complete file**

```typescript
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
```

**Step 2: Compile check**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/wc-orders.ts
git commit -m "feat(wc): add wc-orders.ts — 6 WooCommerce order tools

List, get, update status, notes, refunds.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Create wc-customers.ts (4 tools)

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/wc-customers.ts`

**Step 1: Write the complete file**

```typescript
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
```

**Step 2: Compile check**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/wc-customers.ts
git commit -m "feat(wc): add wc-customers.ts — 4 WooCommerce customer tools

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Create wc-coupons.ts (4 tools)

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/wc-coupons.ts`

**Step 1: Write the complete file**

```typescript
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
```

**Step 2: Compile check**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/wc-coupons.ts
git commit -m "feat(wc): add wc-coupons.ts — 4 WooCommerce coupon tools

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Create wc-reports.ts (5 tools)

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/wc-reports.ts`

**Step 1: Write the complete file**

```typescript
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
```

**Step 2: Compile check**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/wc-reports.ts
git commit -m "feat(wc): add wc-reports.ts — 5 WooCommerce report tools

Sales, top sellers, orders/products/customers totals.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Create wc-settings.ts (4 tools)

**Files:**
- Create: `servers/wp-rest-bridge/src/tools/wc-settings.ts`

**Step 1: Write the complete file**

```typescript
// src/tools/wc-settings.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { makeWooCommerceRequest } from '../wordpress.js';
import { z } from 'zod';

const wcListPaymentGatewaysSchema = z.object({}).strict();
const wcListShippingZonesSchema = z.object({}).strict();
const wcGetTaxClassesSchema = z.object({}).strict();
const wcGetSystemStatusSchema = z.object({}).strict();

export const wcSettingTools: Tool[] = [
  {
    name: "wc_list_payment_gateways",
    description: "Lists all configured WooCommerce payment gateways with status and settings",
    inputSchema: { type: "object", properties: wcListPaymentGatewaysSchema.shape },
  },
  {
    name: "wc_list_shipping_zones",
    description: "Lists WooCommerce shipping zones with methods and regions",
    inputSchema: { type: "object", properties: wcListShippingZonesSchema.shape },
  },
  {
    name: "wc_get_tax_classes",
    description: "Gets WooCommerce tax classes configuration",
    inputSchema: { type: "object", properties: wcGetTaxClassesSchema.shape },
  },
  {
    name: "wc_get_system_status",
    description: "Gets WooCommerce system status (version, environment, database, theme, plugins)",
    inputSchema: { type: "object", properties: wcGetSystemStatusSchema.shape },
  },
];

export const wcSettingHandlers = {
  wc_list_payment_gateways: async () => {
    try {
      const response = await makeWooCommerceRequest("GET", "payment_gateways");
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing payment gateways: ${errorMessage}` }] } };
    }
  },

  wc_list_shipping_zones: async () => {
    try {
      const response = await makeWooCommerceRequest("GET", "shipping/zones");
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing shipping zones: ${errorMessage}` }] } };
    }
  },

  wc_get_tax_classes: async () => {
    try {
      const response = await makeWooCommerceRequest("GET", "taxes/classes");
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting tax classes: ${errorMessage}` }] } };
    }
  },

  wc_get_system_status: async () => {
    try {
      const response = await makeWooCommerceRequest("GET", "system_status");
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting system status: ${errorMessage}` }] } };
    }
  },
};
```

**Step 2: Compile check**

Run: `cd servers/wp-rest-bridge && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/wc-settings.ts
git commit -m "feat(wc): add wc-settings.ts — 4 WooCommerce settings tools

Payment gateways, shipping zones, tax classes, system status.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Register WC tools in index.ts and build

**Files:**
- Modify: `servers/wp-rest-bridge/src/tools/index.ts`

**Step 1: Add imports and registrations**

Replace entire file with:

```typescript
// src/tools/index.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { unifiedContentTools, unifiedContentHandlers } from './unified-content.js';
import { unifiedTaxonomyTools, unifiedTaxonomyHandlers } from './unified-taxonomies.js';
import { pluginTools, pluginHandlers } from './plugins.js';
import { mediaTools, mediaHandlers } from './media.js';
import { userTools, userHandlers } from './users.js';
import { pluginRepositoryTools, pluginRepositoryHandlers } from './plugin-repository.js';
import { commentTools, commentHandlers } from './comments.js';
import { searchTools, searchHandlers } from './search.js';
import { wcProductTools, wcProductHandlers } from './wc-products.js';
import { wcOrderTools, wcOrderHandlers } from './wc-orders.js';
import { wcCustomerTools, wcCustomerHandlers } from './wc-customers.js';
import { wcCouponTools, wcCouponHandlers } from './wc-coupons.js';
import { wcReportTools, wcReportHandlers } from './wc-reports.js';
import { wcSettingTools, wcSettingHandlers } from './wc-settings.js';

// Combine all tools
export const allTools: Tool[] = [
  ...unifiedContentTools,        // 8 tools
  ...unifiedTaxonomyTools,       // 8 tools
  ...pluginTools,                // 6 tools
  ...mediaTools,                 // 5 tools
  ...userTools,                  // 6 tools
  ...pluginRepositoryTools,      // 2 tools
  ...commentTools,               // 5 tools
  ...searchTools,                // 1 tool
  ...wcProductTools,             // 7 tools
  ...wcOrderTools,               // 6 tools
  ...wcCustomerTools,            // 4 tools
  ...wcCouponTools,              // 4 tools
  ...wcReportTools,              // 5 tools
  ...wcSettingTools,             // 4 tools
];

// Combine all handlers
export const toolHandlers = {
  ...unifiedContentHandlers,
  ...unifiedTaxonomyHandlers,
  ...pluginHandlers,
  ...mediaHandlers,
  ...userHandlers,
  ...pluginRepositoryHandlers,
  ...commentHandlers,
  ...searchHandlers,
  ...wcProductHandlers,
  ...wcOrderHandlers,
  ...wcCustomerHandlers,
  ...wcCouponHandlers,
  ...wcReportHandlers,
  ...wcSettingHandlers,
};
```

**Step 2: Full build**

Run: `cd servers/wp-rest-bridge && npx tsc`
Expected: Clean build, `.js` files in `build/` directory

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/src/tools/index.ts servers/wp-rest-bridge/build/
git commit -m "feat(wc): register 30 WooCommerce tools in index.ts + build

WP REST Bridge now has 71 total tools (41 WP + 30 WC).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Create detection script woocommerce_inspect.mjs

**Files:**
- Create: `skills/wp-woocommerce/scripts/woocommerce_inspect.mjs`

**Step 1: Create directory**

Run: `mkdir -p skills/wp-woocommerce/scripts`

**Step 2: Write the detection script**

Follow the pattern from `detect_local_env.mjs`: Node.js ESM, no third-party deps, JSON output to stdout, exit code 0/1.

The script should detect:
- WooCommerce plugin in the project (for development context)
- WC hooks usage in PHP files (`woocommerce_`, `wc_`)
- composer.json WooCommerce dependencies
- WC config in `WP_SITES_CONFIG` env var
- WooCommerce template overrides (`woocommerce/` dir in theme)

```javascript
/**
 * woocommerce_inspect.mjs — Detect WooCommerce presence and configuration.
 *
 * Scans project files for WooCommerce indicators (plugin files, hooks, composer deps)
 * and checks WP_SITES_CONFIG for WC credentials.
 *
 * Usage:
 *   node woocommerce_inspect.mjs [--cwd=/path/to/check]
 *
 * Exit codes:
 *   0 — WooCommerce indicators found
 *   1 — no WooCommerce indicators found
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { argv, env, stdout, exit } from 'node:process';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFileSafe(filePath) {
  try { return readFileSync(filePath, 'utf-8'); } catch { return null; }
}

function readJsonSafe(filePath) {
  const raw = readFileSafe(filePath);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function existsSafe(filePath) {
  try { return existsSync(filePath); } catch { return false; }
}

function findFiles(dir, pattern, maxDepth = 3, depth = 0) {
  const results = [];
  if (depth > maxDepth) return results;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'vendor') {
        results.push(...findFiles(full, pattern, maxDepth, depth + 1));
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(full);
      }
    }
  } catch { /* permission denied, etc. */ }
  return results;
}

// ---------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------

function detectWcPlugin(cwd) {
  // Check for WooCommerce plugin directory
  const wcPaths = [
    join(cwd, 'wp-content/plugins/woocommerce/woocommerce.php'),
    join(cwd, 'plugins/woocommerce/woocommerce.php'),
    join(cwd, 'woocommerce.php'),
  ];
  for (const p of wcPaths) {
    if (existsSafe(p)) {
      const content = readFileSafe(p);
      const versionMatch = content?.match(/\*\s*Version:\s*(.+)/i);
      return { found: true, path: p, version: versionMatch?.[1]?.trim() || 'unknown' };
    }
  }
  return null;
}

function detectComposerDeps(cwd) {
  const composer = readJsonSafe(join(cwd, 'composer.json'));
  if (!composer) return null;
  const allDeps = { ...composer.require, ...composer['require-dev'] };
  const wcDeps = Object.keys(allDeps).filter(k => k.includes('woocommerce'));
  return wcDeps.length > 0 ? { deps: wcDeps } : null;
}

function detectWcHooks(cwd) {
  const phpFiles = findFiles(cwd, /\.php$/, 3);
  const hooks = { actions: new Set(), filters: new Set() };
  for (const f of phpFiles.slice(0, 100)) {
    const content = readFileSafe(f);
    if (!content) continue;
    const actionMatches = content.matchAll(/add_action\(\s*['"]([^'"]*woocommerce[^'"]*)['"]/gi);
    for (const m of actionMatches) hooks.actions.add(m[1]);
    const filterMatches = content.matchAll(/add_filter\(\s*['"]([^'"]*woocommerce[^'"]*)['"]/gi);
    for (const m of filterMatches) hooks.filters.add(m[1]);
    const wcFuncMatches = content.matchAll(/\b(wc_get_[a-z_]+|WC\(\))/g);
    for (const m of wcFuncMatches) hooks.actions.add(m[1]);
  }
  return (hooks.actions.size + hooks.filters.size) > 0
    ? { actions: [...hooks.actions].slice(0, 20), filters: [...hooks.filters].slice(0, 20) }
    : null;
}

function detectTemplateOverrides(cwd) {
  const themePaths = [
    join(cwd, 'woocommerce'),
    join(cwd, 'templates/woocommerce'),
    join(cwd, 'theme/woocommerce'),
  ];
  for (const p of themePaths) {
    if (existsSafe(p)) {
      try {
        const files = findFiles(p, /\.php$/, 2);
        return { path: p, templateCount: files.length };
      } catch { /* skip */ }
    }
  }
  return null;
}

function detectWcConfig() {
  const sitesJson = env.WP_SITES_CONFIG;
  if (!sitesJson) return null;
  try {
    const sites = JSON.parse(sitesJson);
    const wcSites = sites.filter(s => s.wc_consumer_key && s.wc_consumer_secret);
    return wcSites.length > 0
      ? { configured_sites: wcSites.map(s => s.id), count: wcSites.length }
      : null;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cwdArg = argv.find(a => a.startsWith('--cwd='));
  const cwd = cwdArg ? resolve(cwdArg.split('=')[1]) : process.cwd();

  const plugin = detectWcPlugin(cwd);
  const composer = detectComposerDeps(cwd);
  const hooks = detectWcHooks(cwd);
  const templates = detectTemplateOverrides(cwd);
  const config = detectWcConfig();

  const signals = [];
  if (plugin) signals.push('woocommerce_plugin');
  if (composer) signals.push('composer_dependency');
  if (hooks) signals.push('wc_hooks_usage');
  if (templates) signals.push('template_overrides');
  if (config) signals.push('wc_api_configured');

  const report = {
    tool: 'woocommerce_inspect',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cwd,
    found: signals.length > 0,
    signals,
    details: {
      plugin: plugin || undefined,
      composer: composer || undefined,
      hooks: hooks || undefined,
      templates: templates || undefined,
      api_config: config || undefined,
    },
    recommendations: [],
  };

  if (!config && signals.length > 0) {
    report.recommendations.push('Add wc_consumer_key and wc_consumer_secret to WP_SITES_CONFIG for API access');
  }
  if (plugin) {
    report.recommendations.push(`WooCommerce ${plugin.version} detected — all 30 WC tools available`);
  }
  if (hooks && !plugin) {
    report.recommendations.push('WooCommerce hooks detected but plugin not found locally — this may be a WC extension');
  }

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(signals.length > 0 ? 0 : 1);
}

main();
```

**Step 3: Test the script**

Run: `node skills/wp-woocommerce/scripts/woocommerce_inspect.mjs`
Expected: JSON output with `"found": false` (no WC in plugin project itself), exit code 1

**Step 4: Commit**

```bash
git add skills/wp-woocommerce/scripts/woocommerce_inspect.mjs
git commit -m "feat(wc): add woocommerce_inspect.mjs detection script

Detects WC plugin, composer deps, hooks, template overrides, API config.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 11: Create skill wp-woocommerce SKILL.md

**Files:**
- Create: `skills/wp-woocommerce/SKILL.md`

**Step 1: Write SKILL.md**

```markdown
---
name: wp-woocommerce
description: |
  This skill should be used when the user asks to "manage products", "check orders",
  "create a coupon", "view sales report", "WooCommerce setup", "configure shipping",
  "manage WooCommerce store", "product catalog", "inventory management",
  "order fulfillment", or any WooCommerce e-commerce operations.
version: 1.0.0
---

## Overview

Comprehensive WooCommerce store management via the WP REST Bridge WC tools (30 MCP tools using the `wc/v3` namespace). Covers product catalog CRUD, order lifecycle, customer management, coupon marketing, sales analytics, and store configuration (payments, shipping, taxes).

## When to Use

- User mentions WooCommerce, products, orders, coupons, or store management
- User needs sales reports, revenue analytics, or top-selling products
- User wants to configure payment gateways, shipping zones, or tax classes
- User needs to manage WooCommerce customers or process refunds
- User asks about WooCommerce extensions or system status

## Prerequisites

WooCommerce credentials must be configured in `WP_SITES_CONFIG`:

```json
{
  "id": "myshop",
  "url": "https://myshop.com",
  "username": "admin",
  "password": "xxxx xxxx xxxx xxxx",
  "wc_consumer_key": "ck_xxxx",
  "wc_consumer_secret": "cs_xxxx"
}
```

Generate Consumer Key/Secret in WooCommerce > Settings > Advanced > REST API.

## Detection

Run the detection script to check WooCommerce presence:

```bash
node skills/wp-woocommerce/scripts/woocommerce_inspect.mjs
```

## WooCommerce Operations Decision Tree

1. **Product management?**
   - List/search products → `wc_list_products`
   - Create product → `wc_create_product`
   - Update product → `wc_update_product`
   - Delete product → `wc_delete_product`
   - Categories → `wc_list_product_categories`
   - Variations → `wc_list_product_variations`

2. **Order management?**
   - List/filter orders → `wc_list_orders`
   - Order details → `wc_get_order`
   - Update status → `wc_update_order_status`
   - Add note → `wc_create_order_note`
   - Process refund → `wc_create_refund`

3. **Customer management?**
   - List/search customers → `wc_list_customers`
   - Customer details → `wc_get_customer`
   - Create customer → `wc_create_customer`
   - Update customer → `wc_update_customer`

4. **Marketing/Coupons?**
   - List coupons → `wc_list_coupons`
   - Create coupon → `wc_create_coupon`
   - Delete coupon → `wc_delete_coupon`

5. **Analytics/Reports?**
   - Sales summary → `wc_get_sales_report`
   - Top products → `wc_get_top_sellers`
   - Order totals → `wc_get_orders_totals`
   - Product totals → `wc_get_products_totals`
   - Customer totals → `wc_get_customers_totals`

6. **Store configuration?**
   - Payment gateways → `wc_list_payment_gateways`
   - Shipping zones → `wc_list_shipping_zones`
   - Tax classes → `wc_get_tax_classes`
   - System status → `wc_get_system_status`

## Recommended Agent

For complex multi-step WooCommerce operations, use the `wp-ecommerce-manager` agent.

## Additional Resources

### Reference Files

- **`references/product-management.md`** — CRUD products, variations, bulk operations, image management
- **`references/order-workflow.md`** — Order lifecycle, status transitions, notes, refunds
- **`references/analytics-reports.md`** — Sales reports, KPIs, date ranges, export strategies
- **`references/coupon-marketing.md`** — Coupon strategies, discount types, usage limits
- **`references/shipping-setup.md`** — Shipping zones, methods, classes, flat rate/free shipping
- **`references/payment-gateways.md`** — Gateway configuration, test mode, supported providers
- **`references/tax-configuration.md`** — Tax classes, rates by country, automated tax services
- **`references/wc-extensions.md`** — Popular extensions, compatibility, WC Marketplace

### Related Skills

- `wp-deploy` — Deploy WooCommerce store changes to production
- `wp-audit` — Audit WooCommerce store security and performance
- `wp-backup` — Backup WooCommerce database and uploads
```

**Step 2: Commit**

```bash
git add skills/wp-woocommerce/SKILL.md
git commit -m "feat(wc): add wp-woocommerce skill SKILL.md

Decision tree for 30 WC tools, prerequisites, detection, references.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 12: Create 8 reference files

**Files:**
- Create: `skills/wp-woocommerce/references/product-management.md`
- Create: `skills/wp-woocommerce/references/order-workflow.md`
- Create: `skills/wp-woocommerce/references/analytics-reports.md`
- Create: `skills/wp-woocommerce/references/coupon-marketing.md`
- Create: `skills/wp-woocommerce/references/shipping-setup.md`
- Create: `skills/wp-woocommerce/references/payment-gateways.md`
- Create: `skills/wp-woocommerce/references/tax-configuration.md`
- Create: `skills/wp-woocommerce/references/wc-extensions.md`

**Step 1: Create directory**

Run: `mkdir -p skills/wp-woocommerce/references`

**Step 2: Write each reference file**

Each file should follow this structure:
- H1 title
- Overview paragraph
- Relevant MCP tools listed with brief usage
- Step-by-step procedures for common operations
- Tips and gotchas section

Content outline per file:

**product-management.md** (~60 lines):
- Product types: simple, variable, grouped, external
- CRUD workflow: create → set pricing → add images → categorize → publish
- Variable products: create parent → add attributes → create variations
- Bulk operations: list with filters, update stock in batches
- Tools: `wc_create_product`, `wc_update_product`, `wc_list_product_variations`, `wc_list_product_categories`

**order-workflow.md** (~60 lines):
- Order statuses: pending → processing → completed (or cancelled/refunded/failed)
- Status transition rules (which transitions are valid)
- Order notes: internal vs customer-visible
- Refund process: partial vs full, restocking
- Tools: `wc_list_orders`, `wc_update_order_status`, `wc_create_order_note`, `wc_create_refund`

**analytics-reports.md** (~50 lines):
- Sales report: total_sales, net_sales, orders, items, tax, shipping, discount
- Period options: week, month, last_month, year, custom date range
- Top sellers: product ranking by quantity sold
- KPI formulas: AOV, conversion rate, revenue per customer
- Tools: `wc_get_sales_report`, `wc_get_top_sellers`, `wc_get_orders_totals`

**coupon-marketing.md** (~50 lines):
- Discount types: percent, fixed_cart, fixed_product
- Usage limits: total, per-user, minimum/maximum amount
- Strategies: welcome discount, cart abandonment, seasonal, loyalty
- Validation: individual_use, product_ids, excluded categories
- Tools: `wc_create_coupon`, `wc_list_coupons`, `wc_delete_coupon`

**shipping-setup.md** (~50 lines):
- Shipping zones: geographical regions → methods
- Methods: flat rate, free shipping, local pickup
- Shipping classes: different rates for product categories
- Free shipping thresholds and coupon requirements
- Tools: `wc_list_shipping_zones`

**payment-gateways.md** (~50 lines):
- Built-in: PayPal, Stripe, Direct bank transfer, COD, Check
- Configuration: enable/disable, test mode, API keys
- Test mode workflow: enable → test with sandbox credentials → verify → go live
- Tools: `wc_list_payment_gateways`

**tax-configuration.md** (~50 lines):
- Tax classes: Standard, Reduced rate, Zero rate
- Tax rates: by country, state, postcode, city
- Tax display: inclusive vs exclusive pricing
- Automated tax services: WooCommerce Tax, TaxJar, Avalara
- Tools: `wc_get_tax_classes`

**wc-extensions.md** (~50 lines):
- Extension categories: payments, shipping, marketing, analytics, subscriptions
- Popular extensions: WC Subscriptions, WC Memberships, WC Bookings
- Compatibility: version compatibility matrix
- WC Marketplace: official vs third-party
- Tools: `wc_get_system_status` (lists active extensions)

**Step 3: Commit**

```bash
git add skills/wp-woocommerce/references/
git commit -m "feat(wc): add 8 WooCommerce reference files

product-management, order-workflow, analytics-reports, coupon-marketing,
shipping-setup, payment-gateways, tax-configuration, wc-extensions.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 13: Create agent wp-ecommerce-manager.md

**Files:**
- Create: `agents/wp-ecommerce-manager.md`

**Step 1: Write the agent file**

```markdown
---
name: wp-ecommerce-manager
color: orange
description: |
  Use this agent when the user needs to manage a WooCommerce store: products, orders,
  customers, coupons, analytics, or store configuration.

  <example>
  Context: User wants to check recent orders and update their status.
  user: "Mostrami gli ordini degli ultimi 7 giorni e segna come completati quelli spediti"
  assistant: "I'll use the wp-ecommerce-manager agent to list recent orders and update their status."
  <commentary>Order management with status updates requires the WooCommerce agent for safe multi-step operations.</commentary>
  </example>

  <example>
  Context: User needs to set up a product catalog.
  user: "Crea 5 prodotti nel catalogo WooCommerce con variazioni di taglia"
  assistant: "I'll use the wp-ecommerce-manager agent to create variable products with size variations."
  <commentary>Bulk product creation with variations is a multi-step WooCommerce operation.</commentary>
  </example>

  <example>
  Context: User wants a sales performance overview.
  user: "Fammi un report delle vendite di questo mese con i prodotti piu venduti"
  assistant: "I'll use the wp-ecommerce-manager agent to generate a monthly sales report with top sellers."
  <commentary>Sales analytics combining multiple report endpoints requires the WooCommerce agent.</commentary>
  </example>

model: inherit
tools: Read, Grep, Glob, Bash, WebFetch, WebSearch
---

# WooCommerce E-Commerce Manager

Specialized agent for WooCommerce store management. Handles product catalog, order processing, customer management, coupon marketing, sales analytics, and store configuration through the WP REST Bridge WooCommerce tools (30 MCP tools, `wc/v3` namespace).

## Available MCP Tool Sets

### 1. WP REST Bridge — WooCommerce (wc_ prefix)

All tools require WooCommerce credentials in `WP_SITES_CONFIG` (`wc_consumer_key` + `wc_consumer_secret`).

- **Products (7)**: `wc_list_products`, `wc_get_product`, `wc_create_product`, `wc_update_product`, `wc_delete_product`, `wc_list_product_categories`, `wc_list_product_variations`
- **Orders (6)**: `wc_list_orders`, `wc_get_order`, `wc_update_order_status`, `wc_list_order_notes`, `wc_create_order_note`, `wc_create_refund`
- **Customers (4)**: `wc_list_customers`, `wc_get_customer`, `wc_create_customer`, `wc_update_customer`
- **Coupons (4)**: `wc_list_coupons`, `wc_get_coupon`, `wc_create_coupon`, `wc_delete_coupon`
- **Reports (5)**: `wc_get_sales_report`, `wc_get_top_sellers`, `wc_get_orders_totals`, `wc_get_products_totals`, `wc_get_customers_totals`
- **Settings (4)**: `wc_list_payment_gateways`, `wc_list_shipping_zones`, `wc_get_tax_classes`, `wc_get_system_status`

### 2. WP REST Bridge — WordPress (wp/v2)

For cross-referencing with WordPress content:
- **Content**: `list_content`, `get_content`, `create_content` (pages for shop, cart, checkout)
- **Plugins**: `list_plugins` (verify WooCommerce active)
- **Media**: `upload_media` (product images)

## Operating Procedures

### Product Catalog Setup

1. Verify WooCommerce active: `list_plugins` → check woocommerce status
2. Create categories: use WooCommerce admin or REST API
3. Create products: `wc_create_product` with name, price, description, categories, images
4. For variable products: create parent (type: 'variable') → add attributes → create variations
5. Verify: `wc_list_products` with status filter

### Order Processing

1. List pending orders: `wc_list_orders` with status='processing'
2. Review order details: `wc_get_order` for each order
3. Update status: `wc_update_order_status` (processing → completed)
4. Add notes: `wc_create_order_note` for tracking info
5. Handle refunds: `wc_create_refund` with amount and reason

### Sales Analytics

1. Get sales overview: `wc_get_sales_report` with period or date range
2. Get top products: `wc_get_top_sellers`
3. Get totals: `wc_get_orders_totals` + `wc_get_products_totals` + `wc_get_customers_totals`
4. Present as structured report with KPIs (AOV, revenue trend, top sellers)

### Coupon Campaign

1. Define strategy: discount type (percent/fixed), target, limits
2. Create coupon: `wc_create_coupon` with rules
3. Verify: `wc_get_coupon` to confirm settings
4. Monitor: `wc_list_coupons` to check usage_count

### Store Health Check

1. System status: `wc_get_system_status` (WC version, environment, DB)
2. Payment gateways: `wc_list_payment_gateways` (verify active gateways)
3. Shipping: `wc_list_shipping_zones` (verify zone coverage)
4. Tax: `wc_get_tax_classes` (verify tax configuration)

## Report Format

```
## WooCommerce Store Report — [Site Name]

### Sales Summary (period)
- Total Sales: $X,XXX
- Net Sales: $X,XXX
- Orders: XX
- Average Order Value: $XX.XX
- Items Sold: XX

### Top Sellers
1. Product Name — XX units ($X,XXX revenue)
2. ...

### Order Status
- Processing: XX
- Completed: XX
- On Hold: XX
- Refunded: XX

### Recommendations
- [Actionable items based on data]
```

## Safety Rules

- NEVER delete products without explicit user confirmation
- NEVER process refunds without verifying order details and getting user approval
- ALWAYS confirm before changing order status (especially to cancelled/refunded)
- ALWAYS verify WooCommerce credentials are configured before attempting operations
- NEVER expose Consumer Key/Secret in output or logs
- When creating bulk products, confirm the list with user before executing

## Related Skills

- `wp-woocommerce` — Decision tree and reference files for all WC operations
- `wp-deploy` — Deploy store changes to production
- `wp-backup` — Backup store database before bulk operations
- `wp-audit` — Security and performance audit for WC stores
```

**Step 2: Commit**

```bash
git add agents/wp-ecommerce-manager.md
git commit -m "feat(wc): add wp-ecommerce-manager agent

30 WC tool references, 5 procedures, report template, safety rules.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 14: Router update and cross-references

**Files:**
- Modify: `skills/wordpress-router/references/decision-tree.md`
- Modify: `skills/wordpress-router/SKILL.md` (if keyword list exists there)

**Step 1: Add WooCommerce routing to decision-tree.md**

In Step 0 (keywords that indicate **operations**), append WooCommerce keywords:
```
, WooCommerce, prodotto, ordine, coupon, negozio, catalogo, inventario, vendite, carrello
```

In Step 2b (after the last entry, before Step 2c), add:
```markdown
- **WooCommerce / woo / shop / products / orders / coupons / cart / store management / sales report / inventory**
  → `wp-woocommerce` skill + `wp-ecommerce-manager` agent
```

**Step 2: Add cross-references to existing skills**

In `skills/wp-audit/SKILL.md`, add to Additional Resources:
```markdown
- For WooCommerce store audit, see `wp-woocommerce` skill
```

In `skills/wp-deploy/SKILL.md`, add to Additional Resources:
```markdown
- For deploying WooCommerce stores, see `wp-woocommerce` skill
```

In `skills/wp-backup/SKILL.md`, add to Additional Resources:
```markdown
- For WooCommerce database backup, see `wp-woocommerce` skill
```

**Step 3: Add WC delegation to wp-site-manager agent**

In `agents/wp-site-manager.md`, add to the Specialized Agents table:
```markdown
| WooCommerce store management | `wp-ecommerce-manager` | Products, orders, customers, coupons, analytics |
```

**Step 4: Commit**

```bash
git add skills/wordpress-router/references/decision-tree.md \
  skills/wp-audit/SKILL.md skills/wp-deploy/SKILL.md skills/wp-backup/SKILL.md \
  agents/wp-site-manager.md
git commit -m "feat(wc): add WooCommerce routing and cross-references

Router v5: WC keywords in Step 0 + Step 2b entry.
Cross-refs: wp-audit, wp-deploy, wp-backup → wp-woocommerce.
wp-site-manager: add wp-ecommerce-manager to delegation table.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 15: Version bump + CHANGELOG + docs update

**Files:**
- Modify: `.claude-plugin/plugin.json` — version 1.7.2 → 1.8.0, update description
- Modify: `package.json` — version 1.7.2 → 1.8.0, update description, add keywords
- Modify: `CHANGELOG.md` — add v1.8.0 entry

**Step 1: Update plugin.json**

Change version to `"1.8.0"`, update description to mention WooCommerce, 9 agents, 25 skills, ~71 MCP tools.

**Step 2: Update package.json**

Change version to `"1.8.0"`, update description, add keywords: `"woocommerce"`, `"ecommerce"`, `"shop"`.

**Step 3: Add CHANGELOG entry**

Add before the `[1.7.2]` entry:

```markdown
## [1.8.0] - 2026-XX-XX

### Added
- **WooCommerce support** — 30 new MCP tools via WP REST Bridge (`wc/v3` namespace)
  - `wc-products.ts` (7 tools): CRUD products, categories, variations
  - `wc-orders.ts` (6 tools): List, get, update status, notes, refunds
  - `wc-customers.ts` (4 tools): List, get, create, update customers
  - `wc-coupons.ts` (4 tools): CRUD coupons with discount rules
  - `wc-reports.ts` (5 tools): Sales, top sellers, order/product/customer totals
  - `wc-settings.ts` (4 tools): Payment gateways, shipping zones, tax classes, system status
- **`wp-woocommerce` skill** — WooCommerce operations with decision tree and 8 reference files
  - Reference files: product-management, order-workflow, analytics-reports, coupon-marketing,
    shipping-setup, payment-gateways, tax-configuration, wc-extensions
- **`wp-ecommerce-manager` agent** — WooCommerce store management (color: orange)
  - 5 procedures: product catalog, order processing, sales analytics, coupon campaigns, store health
  - Report template with KPIs and recommendations
- **`woocommerce_inspect.mjs`** detection script — scans for WC plugin, hooks, composer deps, API config
- WooCommerce authentication: Consumer Key/Secret via separate AxiosInstance in WP REST Bridge
  - `SiteConfig` extended with optional `wc_consumer_key`/`wc_consumer_secret`
  - `makeWooCommerceRequest()` reusing existing retry and concurrency logic

### Changed
- Router upgraded to v5 — WooCommerce keywords in Step 0 + Step 2b routing
- `wp-site-manager` agent — added `wp-ecommerce-manager` to delegation table
- Cross-references added to `wp-audit`, `wp-deploy`, `wp-backup` skills
- WP REST Bridge: 41 → 71 total tools
- Version bumps: plugin.json + package.json → 1.8.0
```

**Step 4: Update GUIDE.md**

Add WooCommerce section to relevant parts of GUIDE.md (architecture, skill list, agent list, scenarios).

**Step 5: Commit**

```bash
git add .claude-plugin/plugin.json package.json CHANGELOG.md docs/GUIDE.md
git commit -m "feat(wc): version bump to v1.8.0 + CHANGELOG + docs

25 skills, 9 agents, 71 MCP tools, 13 detection scripts, 114 reference files.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 16: Build, final test, publish

**Step 1: Full TypeScript build**

Run: `cd servers/wp-rest-bridge && npm install && npx tsc`
Expected: Clean build with no errors

**Step 2: Verify tool count**

Run: `cd servers/wp-rest-bridge && node -e "const {allTools} = require('./build/tools/index.js'); console.log('Total tools:', allTools.length)"`
Expected: `Total tools: 71`

**Step 3: Verify plugin structure**

Run: `npm pack --dry-run` from plugin root
Expected: All new files included, no missing references

**Step 4: Push to git**

```bash
git push origin main
```

**Step 5: Publish to npm**

```bash
npm config set //registry.npmjs.org/:_authToken=TOKEN
npm publish --access public
npm config delete //registry.npmjs.org/:_authToken
```

**Step 6: Create GitHub release**

```bash
gh release create v1.8.0 --title "v1.8.0 — WooCommerce" --notes "..."
```

---

## File Summary

| File | Action | Tools |
|------|--------|-------|
| `servers/wp-rest-bridge/src/types.ts` | Modify | — |
| `servers/wp-rest-bridge/src/wordpress.ts` | Modify | — |
| `servers/wp-rest-bridge/src/tools/wc-products.ts` | **Create** | 7 |
| `servers/wp-rest-bridge/src/tools/wc-orders.ts` | **Create** | 6 |
| `servers/wp-rest-bridge/src/tools/wc-customers.ts` | **Create** | 4 |
| `servers/wp-rest-bridge/src/tools/wc-coupons.ts` | **Create** | 4 |
| `servers/wp-rest-bridge/src/tools/wc-reports.ts` | **Create** | 5 |
| `servers/wp-rest-bridge/src/tools/wc-settings.ts` | **Create** | 4 |
| `servers/wp-rest-bridge/src/tools/index.ts` | Modify | — |
| `skills/wp-woocommerce/scripts/woocommerce_inspect.mjs` | **Create** | — |
| `skills/wp-woocommerce/SKILL.md` | **Create** | — |
| `skills/wp-woocommerce/references/*.md` (8 files) | **Create** | — |
| `agents/wp-ecommerce-manager.md` | **Create** | — |
| `skills/wordpress-router/references/decision-tree.md` | Modify | — |
| `skills/wp-audit/SKILL.md` | Modify | — |
| `skills/wp-deploy/SKILL.md` | Modify | — |
| `skills/wp-backup/SKILL.md` | Modify | — |
| `agents/wp-site-manager.md` | Modify | — |
| `.claude-plugin/plugin.json` | Modify | — |
| `package.json` | Modify | — |
| `CHANGELOG.md` | Modify | — |
| `docs/GUIDE.md` | Modify | — |
| **Total new tools** | | **30** |
