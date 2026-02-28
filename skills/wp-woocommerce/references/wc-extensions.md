# WooCommerce Extensions

WooCommerce's functionality is extended through official and third-party plugins available on the WooCommerce Marketplace and WordPress.org. Understanding the extension ecosystem helps identify the right tools for store requirements and avoid compatibility issues.

## MCP Tools

| Tool | Usage |
|------|-------|
| `wc_get_system_status` | Lists active plugins, WC version, PHP version, database info |

Use `wc_get_system_status` to inspect which extensions are currently active and verify version compatibility.

## Extension Categories

### Payments

| Extension | Use Case |
|-----------|----------|
| WooCommerce Stripe | Credit cards, Apple Pay, Google Pay |
| WooCommerce PayPal Payments | Modern PayPal integration with card fields |
| Mollie for WooCommerce | European payment methods (iDEAL, Klarna, SEPA) |
| WooCommerce Square | In-person + online, inventory sync |

### Subscriptions and Recurring

| Extension | Use Case |
|-----------|----------|
| WooCommerce Subscriptions | Recurring billing, trial periods, subscription management |
| WooCommerce Memberships | Content/product access control by membership level |
| YITH WooCommerce Subscriptions | Alternative subscriptions with more flexibility |

### Shipping

| Extension | Use Case |
|-----------|----------|
| WooCommerce Table Rate Shipping | Complex rules by weight, quantity, destination |
| WooCommerce ShipStation | Order fulfillment and label printing |
| WooCommerce FedEx / UPS | Real-time carrier rates |

### Marketing and Analytics

| Extension | Use Case |
|-----------|----------|
| WooCommerce Mailchimp | Abandoned cart emails, list segmentation |
| Google Analytics for WooCommerce | Enhanced e-commerce tracking |
| WooCommerce Klarna On-Site Messaging | BNPL promotional messaging |

### Bookings and Services

| Extension | Use Case |
|-----------|----------|
| WooCommerce Bookings | Appointment and reservation scheduling |
| WooCommerce Accommodation Bookings | Hotel/rental with nightly rates |

### Product Enhancements

| Extension | Use Case |
|-----------|----------|
| WooCommerce Product Add-Ons | Custom options per product (engraving, giftwrap) |
| YITH WooCommerce Wishlist | Customer wishlists |
| WooCommerce Composite Products | Build-your-own product bundles |

## WooCommerce Marketplace vs WordPress.org

| Source | Characteristics |
|--------|-----------------|
| WooCommerce Marketplace (woo.com) | Official vetting, WC compatibility guaranteed, paid extensions |
| WordPress.org | Free, community-reviewed, variable quality and support |
| Third-party shops (e.g., YITH, Barn2) | Specialized developers, often high quality, separate licensing |

## Compatibility Check Procedure

1. `wc_get_system_status` — note WooCommerce version and PHP version
2. Check extension's changelog/readme for supported WC version range
3. Verify PHP version meets extension minimum requirement
4. Check WooCommerce Marketplace compatibility tab for known conflicts
5. Test in staging environment before installing on production

## System Status Fields (via `wc_get_system_status`)

| Field | What to Check |
|-------|---------------|
| `woocommerce_version` | Current WC version |
| `wp_version` | Current WordPress version |
| `php_version` | PHP version (extensions require 7.4+ minimum typically) |
| `active_plugins` | List of active plugins with versions |
| `database.wc_database_version` | WC DB schema version (should match WC version) |
| `environment.https` | Whether SSL is enabled |

## Tips and Gotchas

- **Only one subscriptions plugin**: WooCommerce Subscriptions and YITH Subscriptions conflict — install only one.
- **Page builder conflicts**: Some product add-on extensions conflict with Elementor or Divi page builders — check compatibility before installing.
- **WC.com license activation**: Official WooCommerce Marketplace extensions require an active subscription and license key for updates and support.
- **Extension updates**: Always test extension updates in staging first. Major WC version upgrades (e.g., 8.x → 9.x) can break extensions that haven't been updated.
- **Deactivate vs uninstall**: Deactivating an extension preserves its data. Uninstalling (deleting) may remove database tables — check the extension's uninstall behavior first.
- **Performance impact**: Each active extension adds overhead. `wc_get_system_status` active_plugins count is a useful indicator — stores with 50+ active plugins should consider performance auditing.
