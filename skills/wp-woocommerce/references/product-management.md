# Product Management

WooCommerce product management covers the full lifecycle of items in your store catalog: creation, pricing, inventory, categorization, and publishing. Products can be simple, variable, grouped, or external/affiliate types, each with distinct configuration requirements.

## MCP Tools

| Tool | Usage |
|------|-------|
| `wc_list_products` | List/search products with filters (status, category, stock, SKU) |
| `wc_get_product` | Get full details for a single product by ID |
| `wc_create_product` | Create a new product (simple or variable parent) |
| `wc_update_product` | Update pricing, stock, status, description, categories |
| `wc_delete_product` | Permanently delete a product (irreversible) |
| `wc_list_product_categories` | List all product categories with hierarchy |
| `wc_list_product_variations` | List variations of a variable product |

## Product Types

- **Simple** — Single SKU, one price, no variations
- **Variable** — Multiple variations (size, color) each with own SKU and price
- **Grouped** — Collection of related simple products displayed together
- **External/Affiliate** — Product listed on site but purchased externally

## CRUD Workflow: Simple Product

1. Check existing categories: `wc_list_product_categories`
2. Create product: `wc_create_product` with `name`, `type: "simple"`, `regular_price`, `description`, `categories`, `status: "publish"`
3. Set stock: include `manage_stock: true`, `stock_quantity`, `stock_status` in create payload
4. Verify: `wc_get_product` with the returned ID

## CRUD Workflow: Variable Product

1. Create parent product: `wc_create_product` with `type: "variable"`, add `attributes` array (e.g., `[{name: "Size", options: ["S","M","L"], variation: true}]`)
2. List variations: `wc_list_product_variations` with parent product ID
3. Update each variation: `wc_update_product` on variation ID to set `regular_price`, `sku`, `stock_quantity`
4. Publish parent: `wc_update_product` with `status: "publish"`

## Bulk Operations

- **List with filters**: `wc_list_products` supports `per_page` (max 100), `page`, `status`, `category`, `stock_status`, `sku`, `search`
- **Batch stock update**: iterate over product IDs calling `wc_update_product` per product
- **Draft then publish**: create products with `status: "draft"`, review, then `wc_update_product` to set `status: "publish"`

## Image Management

Images are set via the `images` array on `wc_create_product` or `wc_update_product`:

```json
"images": [{"src": "https://example.com/image.jpg", "name": "Product Image", "alt": "Alt text"}]
```

Use `upload_media` (WP REST Bridge) first to upload to the WordPress media library, then reference the returned URL in the product images array.

## Tips and Gotchas

- **Sale price**: Set both `regular_price` and `sale_price` to activate a sale; omit `sale_price` or set to `""` to end it.
- **SKU uniqueness**: SKUs must be unique across all products. WooCommerce rejects duplicate SKUs.
- **Variable products**: The parent product itself has no price — price is set on each variation.
- **Categories must exist**: `wc_create_product` references category IDs; create categories via WP admin first.
- **Stock status**: Even with `manage_stock: false`, set `stock_status: "instock"` to make the product purchasable.
- **Delete is permanent**: `wc_delete_product` bypasses trash. Always confirm with user before deleting.
