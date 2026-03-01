---
name: wp-alerting
description: This skill should be used when the user asks about "alerting",
  "alerts", "Slack notifications", "email alerts", "monitoring alerts",
  "threshold alerts", "health reports", "escalation", "incident notifications",
  "uptime alerts", "error alerts", "performance alerts", "scheduled reports",
  or mentions setting up notification channels for WordPress monitoring events.
version: 1.0.0
tags: [alerting, slack, notifications, monitoring, email]
---

# WordPress Alerting Skill

## Overview

Cross-cutting alerting system combining Slack (webhook + Bot Token) and SendGrid email for WordPress monitoring events. Provides severity-based routing, configurable thresholds, escalation paths, and scheduled health reports. This skill connects monitoring data from other skills (analytics, performance, uptime) to notification channels, ensuring the right people are informed at the right time with the right level of urgency.

## When to Use

- User wants to set up Slack notifications for WordPress events
- User needs email alerts for critical site issues (downtime, errors)
- User asks about alert thresholds (CWV scores, error rates, disk usage)
- User wants to configure escalation rules (info vs warning vs critical)
- User needs scheduled health reports (daily digest, weekly summary)
- User asks about alert cooldown, deduplication, or routing logic
- User wants to integrate monitoring data with notification channels
- User needs to test alert delivery (Slack webhook or SendGrid)

## Decision Tree

1. **What notification channel?**
   - "Slack webhook" / "simple alerts" → Slack Webhook Setup (Procedure 1)
   - "Slack bot" / "Block Kit" / "advanced Slack" → Slack Bot Setup (Procedure 2)
   - "email alerts" / "SendGrid alerts" → Use SendGrid config from `wp-social-email`
   - "both" / "escalation" → Alert Dispatch with severity routing (Procedure 4)

2. **Run detection first:**
   ```bash
   node skills/wp-alerting/scripts/alerting_inspect.mjs [--cwd=/path/to/project]
   ```
   This identifies configured Slack credentials, SendGrid keys, and monitoring plugins.

## Procedures

### Procedure 1: Slack Webhook Setup (Simple Alerts)

See `references/slack-integration.md`
- Create Incoming Webhook in Slack App dashboard
- Add `slack_webhook_url` to WP_SITES_CONFIG
- Optionally set `slack_channel` for default channel override
- Send test message via `slack_send_webhook` tool
- Validate delivery and format

### Procedure 2: Slack Bot Setup (Advanced Messaging)

See `references/slack-integration.md`
- Create Slack App with Bot Token (OAuth scopes: `chat:write`, `channels:read`)
- Add `slack_bot_token` and `slack_channel` to WP_SITES_CONFIG
- Use Block Kit formatting for structured alert messages
- Support for threaded replies, reactions, and channel management
- Send test message via `slack_send_message` tool

### Procedure 3: Alert Threshold Configuration

See `references/alert-thresholds.md`
- Define thresholds for Core Web Vitals (LCP, CLS, INP, FCP, TTFB)
- Set uptime and error rate thresholds (5xx rate, response time)
- Configure disk usage and resource limits
- Set plugin update and content freshness alerts
- Map each threshold to a severity level (info, warning, critical)

### Procedure 4: Alert Dispatch (Severity-Based Routing)

See `references/escalation-paths.md`
- **Info** — Slack message only (general channel)
- **Warning** — Slack message + threaded details
- **Critical** — Slack message + email notification (SendGrid) + urgent flag
- Cooldown periods to prevent alert fatigue
- Deduplication rules to avoid repeated notifications
- Acknowledgment tracking for critical alerts

### Procedure 5: Scheduled Health Reports

See `references/report-scheduling.md`
- Daily digest: key metrics summary, new alerts, resolved alerts
- Weekly performance summary: CWV trends, traffic changes, uptime stats
- Monthly analytics report: comprehensive overview with comparisons
- On-demand report generation via command
- Report format templates using Slack Block Kit

## MCP Tools Reference

| Tool | Description |
|------|-------------|
| `slack_send_webhook` | Send alert via Slack Incoming Webhook URL |
| `slack_send_message` | Send alert via Slack Bot Token (supports Block Kit) |
| `slack_list_channels` | List available Slack channels for alert routing |
| `sg_send_email` | Send alert email via SendGrid |
| `sg_send_template_email` | Send templated alert email via SendGrid |
| `sg_list_templates` | List available SendGrid email templates |
| `sg_create_template` | Create a new alert email template |
| `sg_get_template` | Get alert email template details |
| `sg_validate_email` | Validate alert recipient email address |

## Reference Files

| File | Content |
|------|---------|
| `references/slack-integration.md` | Slack Incoming Webhook + Bot Token setup, Block Kit formatting, best practices |
| `references/alert-thresholds.md` | Threshold definitions for CWV, uptime, error rate, disk, plugins, content |
| `references/escalation-paths.md` | Severity levels, routing rules, cooldown, dedup, acknowledgment |
| `references/report-scheduling.md` | Scheduled reports: daily, weekly, monthly, on-demand, Block Kit templates |

## Recommended Agent

Use the **`wp-monitoring-agent`** for automated alerting workflows that combine threshold monitoring, severity-based dispatch, and scheduled health report generation.

## Related Skills

- **`wp-monitoring`** — source of monitoring data that triggers alerts
- **`wp-analytics`** — analytics metrics used in threshold evaluation and reports
- **`wp-social-email`** — shares SendGrid configuration for email delivery

## Cross-references

- Alert thresholds pair with `wp-analytics` CWV data for performance alerting
- Slack integration connects to `wp-monitoring` for uptime and health alerts
- SendGrid config is shared with `wp-social-email` for consistent email delivery
- Scheduled reports aggregate data from `wp-analytics` and `wp-monitoring`

## Troubleshooting

| Issue | Cause | Resolution |
|-------|-------|------------|
| Slack webhook returns 404 | Webhook URL invalid or deleted | Recreate webhook in Slack App dashboard and update WP_SITES_CONFIG |
| Slack bot "not_in_channel" | Bot not invited to target channel | Invite bot to channel with `/invite @botname` or use `channels:join` scope |
| Slack bot "missing_scope" | Bot token lacks required OAuth scopes | Add `chat:write` and `channels:read` scopes in Slack App settings |
| Slack rate limited (429) | Too many messages per second | Implement cooldown periods; batch non-critical alerts |
| SendGrid 403 error | API key lacks Mail Send permission | Regenerate API key with "Mail Send" access in SendGrid dashboard |
| Alerts not firing | Thresholds not configured or too high | Review threshold config; lower thresholds for testing |
| Duplicate alerts | No dedup rules configured | Enable deduplication with cooldown period per alert type |
| Detection script exit 1 | No alerting config found | Add slack_webhook_url, slack_bot_token, or sg_api_key to WP_SITES_CONFIG |
