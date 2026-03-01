---
name: wp-webhooks
description: This skill should be used when the user asks to "set up webhooks",
  "notify external service on publish", "connect WordPress to Zapier",
  "webhook integration", "event notifications", "content sync webhook",
  "WooCommerce webhook", "outbound notifications", or mentions automating
  WordPress event propagation to external services.
version: 1.0.0
---

# WordPress Webhooks Skill

## Overview

WordPress webhooks are outbound HTTP notifications triggered by site events. When content is published, an order is placed, or a user registers, WordPress sends a JSON payload to a configured URL. This enables real-time integration with external services without polling.

## When to Use

- User wants WordPress to notify external services on content/order/user events
- User needs to connect WordPress to Zapier, Make (Integromat), or n8n
- User wants WooCommerce order/product event notifications
- User needs headless CMS revalidation webhooks
- User asks about webhook security (secrets, signatures)

## Webhooks vs REST API Polling

| Approach | Webhooks | Polling |
|----------|----------|---------|
| Trigger | Event-driven (push) | Schedule-driven (pull) |
| Latency | Near real-time | Depends on interval |
| Resource usage | Low (only on events) | High (constant requests) |
| Reliability | Needs retry logic | Simple but wasteful |
| Best for | Integrations, sync | Batch processing |

## Decision Tree

1. **What kind of webhook?**
   - "WooCommerce webhook" / "order notification" / "product webhook" → WooCommerce webhooks (Section 1)
   - "content published" / "post webhook" / "page updated" → WordPress core webhooks (Section 2)
   - "headless revalidation" / "ISR trigger" / "cache invalidation" → Headless webhooks (Section 3)
   - "Zapier" / "Make" / "n8n" / "Slack notification" → Integration recipes (Section 4)
   - "webhook security" / "secret" / "signature" → Webhook security (Section 5)

2. **Run detection first:**
   ```bash
   node skills/wp-webhooks/scripts/webhook_inspect.mjs [--cwd=/path/to/project]
   ```
   This identifies existing webhook configurations and plugins.

## Webhook Areas

### Section 1: WooCommerce Webhooks
See `references/woocommerce-webhooks.md`
- WooCommerce webhook API (wc/v3/webhooks)
- Available topics: order.created, product.updated, customer.created, etc.
- MCP tools: `wc_list_webhooks`, `wc_create_webhook`, `wc_update_webhook`, `wc_delete_webhook`
- Webhook status management and delivery logs

### Section 2: WordPress Core Webhooks
See `references/wordpress-core-webhooks.md`
- Action hooks for outbound notifications (mu-plugin approach)
- Key hooks: `transition_post_status`, `edited_term`, `user_register`
- `wp_remote_post()` usage patterns
- wp-config.php constants for webhook URLs

### Section 3: Headless Webhooks
Cross-reference: `wp-headless` skill → `references/webhooks.md`
- ISR revalidation triggers
- Tag-based cache invalidation
- WPGraphQL Smart Cache integration

### Section 4: Integration Recipes
See `references/integration-recipes.md`
- Zapier, Make (Integromat), n8n workflows
- Slack channel notifications
- Email service triggers (Mailchimp, SendGrid)
- CDN purge (Cloudflare, Fastly)
- Search index updates (Algolia, Meilisearch)

### Section 5: Webhook Security
See `references/webhook-security.md`
- HMAC-SHA256 shared secret authentication
- WooCommerce webhook signature verification
- HTTPS enforcement and IP allowlisting
- Rate limiting and timeout configuration

## Payload Formats
See `references/payload-formats.md`
- Standard JSON payload structure
- WooCommerce payload examples
- Custom payload formatting

## Reference Files

| File | Content |
|------|---------|
| `references/woocommerce-webhooks.md` | WC webhook API, topics, MCP tools, delivery logs |
| `references/wordpress-core-webhooks.md` | Action hooks, mu-plugin, wp_remote_post patterns |
| `references/integration-recipes.md` | Zapier, Make, n8n, Slack, CDN purge recipes |
| `references/payload-formats.md` | JSON payloads, WC examples, custom formatting |
| `references/webhook-security.md` | HMAC-SHA256, signatures, HTTPS, rate limiting |

## Related Skills

- **`wp-headless`** — headless revalidation webhooks and ISR triggers
- **`wp-woocommerce`** — WooCommerce store operations (webhook source events)
- **`wp-cicd`** — CI/CD webhooks for deployment triggers
- **wp-social-email** — direct publishing to social/email (alternative to webhook-based distribution)
