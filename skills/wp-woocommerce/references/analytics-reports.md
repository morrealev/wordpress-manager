# Analytics and Reports

WooCommerce provides built-in reporting endpoints for sales performance, product popularity, and store-wide totals. Reports support predefined periods and custom date ranges, enabling both quick snapshots and historical trend analysis.

## MCP Tools

| Tool | Usage |
|------|-------|
| `wc_get_sales_report` | Sales totals: revenue, orders, items, tax, shipping, discounts |
| `wc_get_top_sellers` | Top-selling products ranked by quantity sold |
| `wc_get_orders_totals` | Order counts grouped by status |
| `wc_get_products_totals` | Product counts grouped by type |
| `wc_get_customers_totals` | Customer counts (total, paying, returning) |

## Sales Report Fields

`wc_get_sales_report` returns:

| Field | Description |
|-------|-------------|
| `total_sales` | Gross revenue including tax and shipping |
| `net_sales` | Revenue after discounts, before tax |
| `average_sales` | Average daily sales for the period |
| `total_orders` | Number of orders placed |
| `total_items` | Total items sold |
| `total_tax` | Total tax collected |
| `total_shipping` | Total shipping charged |
| `total_discount` | Total discounts applied |
| `total_customers` | Unique customers in period |

## Period Options

```json
// Predefined periods
{ "period": "week" }      // Last 7 days
{ "period": "month" }     // Current calendar month
{ "period": "last_month" } // Previous calendar month
{ "period": "year" }      // Current calendar year

// Custom date range
{ "date_min": "2026-01-01", "date_max": "2026-01-31" }
```

## Common Report Procedures

### Monthly Sales Summary

1. `wc_get_sales_report` with `period: "month"`
2. `wc_get_top_sellers` with `period: "month"` — limit 10
3. `wc_get_orders_totals` — check processing vs completed ratio
4. Calculate KPIs from returned data

### Year-over-Year Comparison

1. `wc_get_sales_report` with `date_min: "2026-01-01"`, `date_max: "2026-12-31"`
2. `wc_get_sales_report` with `date_min: "2025-01-01"`, `date_max: "2025-12-31"`
3. Compare `total_sales`, `total_orders`, `total_customers`

## KPI Formulas

| KPI | Formula |
|-----|---------|
| Average Order Value (AOV) | `net_sales / total_orders` |
| Revenue per Customer | `net_sales / total_customers` |
| Items per Order | `total_items / total_orders` |
| Discount Rate | `total_discount / total_sales * 100` |
| Tax Rate | `total_tax / net_sales * 100` |

## Tips and Gotchas

- **Report data lag**: WooCommerce reports reflect order data at time of query; very recent orders may not appear immediately in aggregated totals.
- **Status filter**: By default, reports include `completed` and `processing` orders. Cancelled/refunded orders are excluded from sales totals.
- **Top sellers by quantity**: `wc_get_top_sellers` ranks by units sold, not revenue. Cross-reference with product prices for revenue ranking.
- **Custom ranges**: When using `date_min`/`date_max`, the format must be `YYYY-MM-DD` — no time component.
- **Export**: WooCommerce REST API does not provide CSV export; format results as markdown tables or pipe to a file for client-facing reports.
