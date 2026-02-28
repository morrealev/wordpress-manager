# Shipping Setup

WooCommerce shipping is organized into zones (geographical regions) with one or more shipping methods per zone. Shipping classes allow different rates for different product types within the same zone. The REST API provides read access to zones and methods for inspection and reporting.

## MCP Tools

| Tool | Usage |
|------|-------|
| `wc_list_shipping_zones` | List all configured shipping zones with methods |

Note: Shipping configuration (creating zones, adding methods, setting rates) requires WooCommerce admin UI or direct REST API calls beyond the current tool set. Use `wc_list_shipping_zones` to inspect and document existing configuration.

## Shipping Architecture

```
Shipping Zone (e.g., "Europe")
  ├── Regions: countries/states/postcodes
  └── Methods:
        ├── Flat Rate ($5.99)
        ├── Free Shipping (orders > $75)
        └── Local Pickup
```

## Shipping Zones

Each zone defines:
- **Regions**: Countries, states, or postcode ranges covered
- **Methods**: Available shipping options for customers in those regions
- **Priority**: Zones are evaluated in order; first matching zone wins

A special **"Rest of the World"** zone (ID: 0) catches all locations not covered by other zones.

## Shipping Methods

| Method | Configuration |
|--------|---------------|
| Flat Rate | Fixed fee per order or per item; can vary by shipping class |
| Free Shipping | Triggered by minimum order amount, coupon, or always free |
| Local Pickup | In-store collection; optionally charge a handling fee |
| Table Rate (extension) | Complex rules by weight, quantity, destination |

## Shipping Classes

Shipping classes let you charge different flat rates for different product types within the same zone:

- **Example classes**: "Heavy items", "Fragile", "Oversized"
- Products are assigned to a class in the product editor
- Flat Rate methods can define per-class costs

## Free Shipping Thresholds

Free shipping can be configured to activate when:
- Order subtotal reaches a minimum (e.g., $75+)
- Customer applies a valid free-shipping coupon
- Both conditions are met (`minimum_amount` AND coupon)

## Common Inspection Procedure

### Audit Current Shipping Configuration

1. `wc_list_shipping_zones` — list all zones
2. Review each zone's regions and methods from the response
3. Identify gaps: regions with no zone coverage, zones with no methods, or disabled methods
4. Document findings and recommend corrections via WooCommerce admin

### Verify Free Shipping Availability

1. `wc_list_shipping_zones` — find zones with free shipping methods
2. Check `settings` on the free shipping method for the minimum amount condition
3. Cross-reference with any coupon that grants `free_shipping: true`

## Tips and Gotchas

- **Zone order matters**: WooCommerce evaluates zones top to bottom. Place more specific zones (e.g., a specific country) above broader ones (e.g., the continent).
- **Default zone**: If no zone matches a customer's address, no shipping methods are shown and checkout is blocked. Always configure a "Rest of the World" zone.
- **Shipping class costs**: Flat rate costs can include PHP calculations referencing `[qty]` and `[fee]` placeholders — document these carefully.
- **Free shipping with coupon**: A coupon with `free_shipping: true` overrides all method costs for the matching zone, not just "Free Shipping" methods.
- **Local pickup and tax**: Tax on local pickup orders may differ by jurisdiction — verify WooCommerce tax settings when local pickup is enabled.
- **REST API scope**: The `wc/v3` shipping endpoints are read-only in the current tool set; use WooCommerce admin for configuration changes.
