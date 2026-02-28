# Tax Configuration

WooCommerce tax configuration defines how tax is calculated, displayed, and applied across different products and customer locations. Correct tax setup is critical for legal compliance, particularly for stores selling across multiple jurisdictions.

## MCP Tools

| Tool | Usage |
|------|-------|
| `wc_get_tax_classes` | List all defined tax classes |

Note: Creating tax rates and modifying tax settings requires WooCommerce admin UI or direct REST API calls beyond the current tool set. Use `wc_get_tax_classes` to inspect existing classes.

## Tax Classes

WooCommerce has three built-in tax classes plus custom classes:

| Class | Slug | Typical Use |
|-------|------|-------------|
| Standard | (default) | Most physical goods |
| Reduced Rate | `reduced-rate` | Food, books (EU reduced VAT) |
| Zero Rate | `zero-rate` | Children's clothing, exports |
| Custom | user-defined | Country-specific requirements |

Products are assigned to a tax class. If no class is set, the Standard rate applies.

## Tax Rates Structure

Each tax rate is defined by:

| Field | Description |
|-------|-------------|
| Country | ISO 3166-1 alpha-2 country code (e.g., `IT`, `DE`, `US`) |
| State | State/province code or `*` for all |
| Postcode | Specific postcode range or `*` for all |
| City | Specific city or `*` for all |
| Rate | Percentage (e.g., `22.0000` for 22% Italian VAT) |
| Name | Label shown to customer (e.g., "VAT") |
| Priority | When multiple rates match, higher priority wins |
| Compound | Whether this rate is applied on top of other taxes |
| Shipping | Whether this rate applies to shipping charges |

## Tax Display Options

WooCommerce admin > Settings > Tax:

| Setting | Options |
|---------|---------|
| Prices entered with tax | Yes (inclusive) or No (exclusive) |
| Display prices in shop | Including tax / Excluding tax / Both |
| Display prices in cart | Including tax / Excluding tax / Both |
| Price display suffix | e.g., "incl. VAT", "excl. tax" |

## Common Tax Procedures

### Inspect Current Tax Classes

1. `wc_get_tax_classes` — list all classes
2. Review which classes exist and their slugs
3. Cross-reference with products to identify class assignments

### EU VAT Setup (example: Italy)

1. In WooCommerce admin, Tax > Standard Rates: add `IT`, `*`, `*`, `*`, `22`, "IVA", priority 1
2. Reduced Rate tab: add `IT`, rate `10`, for eligible goods
3. Zero Rate tab: add `IT`, rate `0`, for exempt goods
4. Enable "Prices entered with tax: Yes" for B2C stores

### US Sales Tax

1. Add state-level rates for each nexus state (e.g., `US`, `CA`, `*`, `*`, `10.25`, "CA Tax")
2. Consider automated services (see below) for multi-state compliance

## Automated Tax Services

For stores with complex multi-jurisdiction requirements:

| Service | WooCommerce Integration |
|---------|------------------------|
| WooCommerce Tax (TaxJar-powered) | Free with WC account; US-focused |
| TaxJar | Extension; US + Canada + EU |
| Avalara AvaTax | Enterprise; global coverage |
| Quaderno | EU VAT + global digital taxes |

## Tips and Gotchas

- **Tax-inclusive pricing**: If prices are entered tax-inclusive, WooCommerce back-calculates the tax component. Switching this setting after products are created can cause price discrepancies.
- **Customer location**: WooCommerce calculates tax based on the customer's shipping address (or billing address if shipping is disabled). Ensure address collection is enabled.
- **Digital goods (EU VAT MOSS)**: Digital products sold to EU consumers must use the customer's country VAT rate. Use the WooCommerce EU VAT extension for compliance.
- **B2B exemptions**: Businesses with valid VAT IDs may be exempt. The EU VAT extension handles VAT number validation.
- **Tax rounding**: WooCommerce rounds tax per line item by default. For high-volume stores, "Round tax at subtotal level" (in advanced tax settings) may reduce rounding errors.
- **Test before go-live**: Place test orders from different locations and verify tax amounts before launching to customers.
