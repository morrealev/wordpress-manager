# Slack Integration for WordPress Alerting

## Incoming Webhook Setup

1. Go to [Slack API: Apps](https://api.slack.com/apps) and create a new app (or select existing).
2. Navigate to **Incoming Webhooks** and activate them.
3. Click **Add New Webhook to Workspace** and select the target channel.
4. Copy the webhook URL (format: `https://hooks.slack.com/services/T.../B.../xxx`).
5. Add to `WP_SITES_CONFIG`:
   ```json
   { "slack_webhook_url": "https://hooks.slack.com/services/T.../B.../xxx" }
   ```

### Webhook Payload Format

```json
{
  "text": "Fallback text for notifications",
  "blocks": [ ... ]
}
```

Webhooks support a subset of Block Kit — use `text` for simple alerts, `blocks` for rich formatting.

## Bot Token Setup (Advanced)

1. In your Slack App, go to **OAuth & Permissions**.
2. Add the following **Bot Token Scopes**:
   - `chat:write` — send messages to channels
   - `channels:read` — list public channels for routing
   - `channels:join` — (optional) auto-join channels
3. Install the app to workspace and copy the **Bot User OAuth Token** (`xoxb-...`).
4. Add to `WP_SITES_CONFIG`:
   ```json
   {
     "slack_bot_token": "xoxb-...",
     "slack_channel": "#wp-alerts"
   }
   ```

### Bot Token vs Webhook

| Feature | Webhook | Bot Token |
|---------|---------|-----------|
| Setup complexity | Low | Medium |
| Block Kit support | Partial | Full |
| Threaded replies | No | Yes |
| Channel switching | No (fixed) | Yes (dynamic) |
| Reactions/emoji | No | Yes |
| Rate limit | 1 req/sec | Tier 2+ |

## Block Kit Formatting for Alerts

### Critical Alert Template

```json
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": ":rotating_light: CRITICAL: Site Down", "emoji": true }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Site:*\nexample.com" },
        { "type": "mrkdwn", "text": "*Status:*\n503 Service Unavailable" },
        { "type": "mrkdwn", "text": "*Detected:*\n2026-03-01 14:30 UTC" },
        { "type": "mrkdwn", "text": "*Duration:*\n5 minutes" }
      ]
    },
    {
      "type": "actions",
      "elements": [
        { "type": "button", "text": { "type": "plain_text", "text": "Acknowledge" }, "action_id": "ack_alert", "style": "danger" }
      ]
    }
  ]
}
```

### Warning Alert Template

```json
{
  "blocks": [
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": ":warning: *LCP exceeded threshold*\nSite: example.com | LCP: 3.2s (threshold: 2.5s)" }
    }
  ]
}
```

### Info Alert Template

```json
{
  "text": ":information_source: Plugin updates available: 3 plugins on example.com"
}
```

## Best Practices

- **Channel naming**: Use dedicated channels (`#wp-alerts`, `#wp-critical`) to separate alert noise.
- **Mention patterns**: Use `<!channel>` for critical, `<@user_id>` for assigned responders.
- **Rate limiting**: Slack enforces 1 msg/sec for webhooks. Batch low-priority alerts.
- **Testing**: Always send a test message after setup to verify formatting.
- **Fallback text**: Always include `text` field — it appears in notifications and search.
