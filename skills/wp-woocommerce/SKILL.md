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
- `wp-webhooks` — WooCommerce webhook management (order/product/customer event notifications)
- `wp-content-attribution` — Content-commerce attribution, UTM tracking, revenue per content piece
