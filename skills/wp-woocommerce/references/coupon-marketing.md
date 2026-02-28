# Coupon and Marketing

WooCommerce coupons enable flexible discount strategies: percentage off, fixed cart discounts, and fixed product discounts. Coupons support usage limits, product/category restrictions, and customer-specific targeting for targeted marketing campaigns.

## MCP Tools

| Tool | Usage |
|------|-------|
| `wc_list_coupons` | List all coupons with current usage counts |
| `wc_get_coupon` | Get full coupon details including restrictions |
| `wc_create_coupon` | Create a new coupon with discount rules |
| `wc_delete_coupon` | Delete a coupon permanently |

## Discount Types

| Type | Effect |
|------|--------|
| `percent` | Percentage off cart total (e.g., 20% off) |
| `fixed_cart` | Fixed amount off the cart (e.g., $10 off) |
| `fixed_product` | Fixed amount off each qualifying product |

## Coupon Configuration Fields

```json
{
  "code": "WELCOME20",
  "discount_type": "percent",
  "amount": "20",
  "individual_use": true,
  "usage_limit": 1,
  "usage_limit_per_user": 1,
  "minimum_amount": "50.00",
  "maximum_amount": "500.00",
  "product_ids": [],
  "excluded_product_ids": [],
  "product_categories": [],
  "excluded_product_categories": [],
  "email_restrictions": ["customer@example.com"],
  "date_expires": "2026-12-31T23:59:59"
}
```

## Marketing Strategies

### Welcome Discount

New subscriber or first-purchase incentive:
- `discount_type: "percent"`, `amount: "15"`, `usage_limit_per_user: 1`
- Set `individual_use: true` to prevent stacking

### Cart Abandonment Recovery

Sent via email automation to customers with abandoned carts:
- `discount_type: "fixed_cart"`, short expiry (`date_expires`: 48–72 hours out)
- Single-use per customer: `usage_limit_per_user: 1`

### Seasonal/Flash Sale

Time-limited broad discount:
- Set `date_expires` to end of sale period
- Use `minimum_amount` to encourage larger baskets
- No product restrictions for storewide sales

### Loyalty/VIP Reward

Exclusive codes for returning customers:
- `email_restrictions`: list specific customer emails
- `discount_type: "percent"`, higher value (e.g., 25%)
- `individual_use: true`

## Common Procedures

### Create and Verify Coupon

1. `wc_create_coupon` with full configuration
2. `wc_get_coupon` with returned ID to confirm all fields saved correctly
3. Note the `usage_count` field — starts at 0

### Audit Active Coupons

1. `wc_list_coupons` with `per_page: 100`
2. Check `usage_count` vs `usage_limit` for each
3. Check `date_expires` to identify expired coupons
4. `wc_delete_coupon` for expired or exhausted coupons

## Tips and Gotchas

- **Code case**: WooCommerce stores coupon codes in lowercase. `WELCOME20` and `welcome20` are the same code.
- **Individual use**: `individual_use: true` prevents the coupon from being combined with other coupons in the same cart.
- **Free shipping**: Set `free_shipping: true` on a coupon to grant free shipping regardless of zone settings — no need to configure a separate free shipping method.
- **Usage limit vs per-user**: `usage_limit` is the total times the coupon can be used across all customers; `usage_limit_per_user` limits per individual customer account.
- **Deletion is permanent**: `wc_delete_coupon` does not move to trash. Prefer expiring coupons by setting `date_expires` rather than deleting for audit trail purposes.
