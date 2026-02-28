# Payment Gateways

WooCommerce supports multiple payment gateways, each configurable for test and live modes. The REST API provides visibility into active gateways, their status, and settings — essential for store health checks and go-live verification.

## MCP Tools

| Tool | Usage |
|------|-------|
| `wc_list_payment_gateways` | List all installed gateways with enabled status and settings |

Note: Enabling/disabling gateways and updating API keys requires WooCommerce admin UI. Use `wc_list_payment_gateways` to audit current configuration.

## Built-in Payment Gateways

| Gateway | ID | Notes |
|---------|----|-------|
| Direct Bank Transfer | `bacs` | Manual payment; admin must confirm receipt |
| Check Payments | `cheque` | Manual; slow reconciliation |
| Cash on Delivery | `cod` | Offline payment at delivery |
| PayPal Standard | `paypal` | Redirect to PayPal; no SCA/3DS |
| PayPal Payments | `ppcp-gateway` | Modern PayPal with card fields |

## Popular Extension Gateways

| Gateway | Notes |
|---------|-------|
| Stripe | Cards, Apple/Google Pay, SEPA, iDEAL |
| Square | In-person + online; syncs inventory |
| Mollie | European-focused; iDEAL, Bancontact, Klarna |
| Authorize.Net | US-focused; recurring billing |
| Braintree | PayPal-owned; strong subscription support |

## Gateway Configuration Fields

`wc_list_payment_gateways` returns per gateway:

| Field | Meaning |
|-------|---------|
| `enabled` | Whether the gateway is active for checkout |
| `title` | Customer-facing name at checkout |
| `description` | Customer-facing description |
| `settings.testmode` | `yes` = sandbox mode active |
| `settings.api_key` | Public API key (never log secret keys) |

## Test Mode Workflow

1. `wc_list_payment_gateways` — identify the target gateway, note current `testmode` value
2. In WooCommerce admin: enable test mode, enter sandbox credentials
3. Place test orders using gateway's sandbox card numbers
4. Verify order status transitions correctly (pending → processing → completed)
5. In WooCommerce admin: disable test mode, enter live credentials
6. `wc_list_payment_gateways` — confirm `testmode.value` is `"no"` and `enabled` is `true`

## Go-Live Checklist

- `wc_list_payment_gateways` — verify only intended gateways are enabled
- Confirm `testmode` is `"no"` on all live gateways
- Confirm SSL is active (`wc_get_system_status` — check `environment.https`)
- Place a real low-value test transaction and refund it
- Confirm webhook URLs are registered in gateway dashboard (Stripe, PayPal)

## Tips and Gotchas

- **Never log secret keys**: `wc_list_payment_gateways` may return API settings — filter or redact secret/private keys from any output shared with users.
- **Test mode and live orders**: If test mode is accidentally left enabled, real customers receive payment errors or test confirmations. Always verify before go-live.
- **Gateway conflicts**: Some gateways conflict with others (e.g., two Stripe plugins). `wc_get_system_status` active plugin list helps diagnose this.
- **SCA/3DS compliance**: PayPal Standard does not support Strong Customer Authentication. For EU stores, use PayPal Payments (ppcp-gateway) or Stripe.
- **COD and digital products**: Cash on Delivery should typically be disabled for downloadable/virtual products. Configure gateway availability in WooCommerce admin.
- **Currency**: Each gateway supports specific currencies. `wc_list_payment_gateways` settings may include `supported_currencies` — verify store currency compatibility.
