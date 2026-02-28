# WooCommerce Webhooks

## Overview

WooCommerce provides a built-in webhook system via the `wc/v3/webhooks` REST API. Webhooks send JSON payloads to a delivery URL when specific store events occur. This is the preferred approach for WooCommerce event notifications — no custom code needed.

## MCP Tools

The WP REST Bridge provides 4 tools for managing WooCommerce webhooks:

| Tool | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| `wc_list_webhooks` | GET | `webhooks` | List all webhooks, optionally filter by status |
| `wc_create_webhook` | POST | `webhooks` | Create a new webhook with topic and delivery URL |
| `wc_update_webhook` | PUT | `webhooks/{id}` | Update webhook status, URL, or topic |
| `wc_delete_webhook` | DELETE | `webhooks/{id}` | Delete a webhook (safety hook requires confirmation) |

## Available Topics

### Order Topics
| Topic | Trigger |
|-------|---------|
| `order.created` | New order placed |
| `order.updated` | Order details changed |
| `order.deleted` | Order deleted |
| `order.restored` | Order restored from trash |

### Product Topics
| Topic | Trigger |
|-------|---------|
| `product.created` | New product published |
| `product.updated` | Product details changed |
| `product.deleted` | Product deleted |
| `product.restored` | Product restored from trash |

### Customer Topics
| Topic | Trigger |
|-------|---------|
| `customer.created` | New customer registered |
| `customer.updated` | Customer profile changed |
| `customer.deleted` | Customer deleted |

### Coupon Topics
| Topic | Trigger |
|-------|---------|
| `coupon.created` | New coupon created |
| `coupon.updated` | Coupon details changed |
| `coupon.deleted` | Coupon deleted |

### Action Topic
| Topic | Trigger |
|-------|---------|
| `action.woocommerce_*` | Any WooCommerce action hook |

## Usage Examples

### Create a webhook for new orders

```
Tool: wc_create_webhook
Params:
  name: "New Order Notification"
  topic: "order.created"
  delivery_url: "https://hooks.zapier.com/hooks/catch/123/abc"
  secret: "my-webhook-secret-key"
  status: "active"
```

### List active webhooks

```
Tool: wc_list_webhooks
Params:
  status: "active"
```

### Pause a webhook

```
Tool: wc_update_webhook
Params:
  id: 42
  status: "paused"
```

## Webhook Status

| Status | Description |
|--------|-------------|
| `active` | Webhook is delivering payloads |
| `paused` | Webhook exists but is not delivering |
| `disabled` | Webhook was disabled (usually after delivery failures) |

## Delivery Behavior

- **Timeout**: 5 seconds (configurable via `woocommerce_webhook_deliver_async`)
- **Retries**: WooCommerce retries failed deliveries up to 5 times with exponential backoff
- **Failure threshold**: After 5 consecutive failures, webhook is automatically set to `disabled`
- **Logs**: Delivery logs available in WooCommerce > Status > Logs

## Webhook Headers

WooCommerce sends these headers with every delivery:

```
X-WC-Webhook-Source: https://your-site.com/
X-WC-Webhook-Topic: order.created
X-WC-Webhook-Resource: order
X-WC-Webhook-Event: created
X-WC-Webhook-Signature: <HMAC-SHA256 hash>
X-WC-Webhook-ID: 42
X-WC-Webhook-Delivery-ID: <uuid>
```

## Signature Verification

The receiving endpoint should verify the `X-WC-Webhook-Signature` header:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('base64');
  return hash === signature;
}
```
