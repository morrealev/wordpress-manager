# Multi-Channel Action Configuration

## Action Channel Types

| Channel | Identifier | Required Config | Tool |
|---------|-----------|-----------------|------|
| Slack (Webhook) | `slack` | `slack_webhook_url` in WP_SITES_CONFIG | `slack_send_webhook` |
| Slack (Bot) | `slack_bot` | `slack_bot_token` + `slack_channel` | `slack_send_message` |
| Email (SendGrid) | `email` | `sendgrid_api_key` in WP_SITES_CONFIG | `sg_send_email` |
| Webhook (HTTP) | `webhook` | Target URL in action config | Custom HTTP POST |
| Mailchimp | `mailchimp` | `mailchimp_api_key` in WP_SITES_CONFIG | Mailchimp API |

## Template Variables

Common variables available in all action templates:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{{site_url}}` | WordPress site URL | `https://example.com` |
| `{{site_name}}` | Site title | `My WordPress Site` |
| `{{timestamp}}` | Event timestamp (ISO 8601) | `2026-03-01T14:30:00Z` |
| `{{trigger_name}}` | Name of the firing trigger | `Blog Post Published` |
| `{{post_title}}` | Post title (content events) | `Hello World` |
| `{{post_url}}` | Post permalink | `https://example.com/hello-world` |
| `{{post_author}}` | Post author display name | `John Doe` |
| `{{post_type}}` | Post type slug | `post` |
| `{{user_name}}` | User display name | `Jane Smith` |
| `{{user_email}}` | User email address | `jane@example.com` |
| `{{order_id}}` | WooCommerce order ID | `1234` |
| `{{order_total}}` | Order total with currency | `$99.00` |
| `{{order_status}}` | Current order status | `completed` |

## Channel-Specific Formatting

### Slack (Block Kit)

```json
{
  "channel": "slack",
  "format": "block_kit",
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "{{trigger_name}}", "emoji": true }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Post:*\n{{post_title}}" },
        { "type": "mrkdwn", "text": "*Author:*\n{{post_author}}" }
      ]
    }
  ],
  "fallback_text": "{{trigger_name}}: {{post_title}} by {{post_author}}"
}
```

### Email (HTML)

```json
{
  "channel": "email",
  "to": "team@example.com",
  "subject": "[{{site_name}}] {{trigger_name}}",
  "format": "html",
  "body": "<h2>{{trigger_name}}</h2><p><strong>{{post_title}}</strong> by {{post_author}}</p><p><a href='{{post_url}}'>View Post</a></p>"
}
```

### Webhook (JSON)

```json
{
  "channel": "webhook",
  "url": "https://api.example.com/events",
  "method": "POST",
  "headers": { "Content-Type": "application/json", "X-Webhook-Secret": "{{webhook_secret}}" },
  "payload": {
    "event": "{{trigger_name}}",
    "post": { "title": "{{post_title}}", "url": "{{post_url}}", "author": "{{post_author}}" },
    "timestamp": "{{timestamp}}"
  }
}
```

## Rate Limiting Per Channel

| Channel | Default Limit | Burst | Cooldown |
|---------|---------------|-------|----------|
| Slack (Webhook) | 1 msg/sec | 5 msg burst | 1 second |
| Slack (Bot) | 1 msg/sec per channel | Tier 2 | Varies |
| Email (SendGrid) | 100 msg/sec (plan-dependent) | — | None |
| Webhook | 10 req/sec | 20 burst | 100ms |

**Rate limit strategy:**
- Queue actions when rate exceeded
- Batch low-priority events into digest messages
- Critical events bypass rate limits (sent immediately)
- Log rate limit hits for trigger tuning

## Multi-Channel Action Mapping

A single trigger can fire multiple actions across channels:

```json
{
  "actions": [
    { "channel": "slack", "priority": "high" },
    { "channel": "email", "priority": "high" },
    { "channel": "webhook", "priority": "normal" }
  ]
}
```

**Priority levels:**
- `critical` — all channels fire immediately, bypass rate limits
- `high` — all channels fire immediately, respect rate limits
- `normal` — queued, batched if necessary
- `low` — batched into digest (hourly or daily)

## Example: Critical Order — Slack + Email + Webhook

```json
{
  "name": "Critical Order Alert",
  "type": "action_hook",
  "event": "woocommerce_payment_complete",
  "condition": "order_total > 500",
  "actions": [
    {
      "channel": "slack",
      "priority": "critical",
      "message": ":moneybag: *High-value order!* #{{order_id}} — {{order_total}}"
    },
    {
      "channel": "email",
      "priority": "critical",
      "to": "sales@example.com",
      "subject": "High-value order #{{order_id}} — {{order_total}}",
      "template": "high_value_order"
    },
    {
      "channel": "webhook",
      "priority": "critical",
      "url": "https://crm.example.com/api/orders",
      "payload": { "order_id": "{{order_id}}", "total": "{{order_total}}", "event": "high_value" }
    }
  ],
  "status": "active"
}
```
