---
name: wp-content-workflows
description: This skill should be used when the user asks about "workflow automation",
  "triggers", "scheduled tasks", "WP-Cron", "content publishing triggers",
  "hook-based actions", "post status transitions", "automated notifications",
  "workflow triggers", "event-driven actions", "content lifecycle hooks",
  "multi-channel actions", "trigger management", or mentions setting up
  automated workflows that fire on WordPress events or schedules.
version: 1.0.0
tags: [workflows, triggers, cron, automation, hooks, scheduling]
---

# WordPress Content Workflows Skill

## Overview

Event-driven workflow automation system for WordPress. Combines WP-Cron scheduling, content lifecycle hooks, and WordPress action/filter hooks to trigger multi-channel actions (Slack, email, webhook). Provides trigger creation, management, testing (dry-run), and audit logging. This skill connects WordPress events to notification and action channels, enabling automated responses to content changes, user actions, and scheduled tasks.

## When to Use

- User wants to create automated triggers for WordPress events
- User needs scheduled tasks (cron-based publishing, periodic reports)
- User asks about post status transitions (draft to published, trash, etc.)
- User wants to hook into WordPress actions (user_register, comment_post, etc.)
- User needs multi-channel action routing (Slack + email + webhook on same event)
- User asks about trigger management (list, test, enable/disable, delete)
- User wants to set up WooCommerce order-based workflows
- User needs to audit or troubleshoot existing workflow triggers

## Decision Tree

1. **What type of trigger?**
   - "cron" / "scheduled" / "periodic" → Schedule-Based Triggers (Procedure 1)
   - "on publish" / "post status" / "content change" → Content Lifecycle Hooks (Procedure 2)
   - "on login" / "user register" / "comment" / "plugin" → WP Action/Filter Hooks (Procedure 3)
   - "notify Slack and email" / "multi-channel" → Multi-Channel Action Configuration (Procedure 4)
   - "list triggers" / "test" / "disable" / "delete" → Trigger Management (Procedure 5)

2. **Run detection first:**
   ```bash
   node skills/wp-content-workflows/scripts/workflow_inspect.mjs [--cwd=/path/to/project]
   ```
   This identifies configured action channels, automation plugins, WP-Cron status, and webhook setup.

## Procedures

### Procedure 1: Schedule-Based Triggers

See `references/schedule-triggers.md`
- Configure WP-Cron intervals (hourly, twicedaily, daily, weekly, custom)
- Set up scheduled content publishing triggers
- Create recurring health check and report triggers
- External cron setup (server cron vs WP-Cron)
- Test scheduled trigger with `wf_create_trigger` using cron schedule type

### Procedure 2: Content Lifecycle Hooks

See `references/content-lifecycle-hooks.md`
- Hook into post status transitions (draft→published, published→trash)
- Support custom post types (products, portfolios, events)
- Monitor taxonomy and term changes
- Track media upload events
- Create trigger with `wf_create_trigger` using content lifecycle event type

### Procedure 3: WP Action/Filter Hooks

See `references/wp-action-hooks.md`
- Hook into core WordPress actions (user_register, wp_login, comment_post)
- WooCommerce hooks (woocommerce_new_order, woocommerce_order_status_changed)
- Plugin activation/deactivation hooks
- Filter hooks for content transformation workflows
- Create trigger with `wf_create_trigger` using action hook event type

### Procedure 4: Multi-Channel Action Configuration

See `references/multi-channel-actions.md`
- Map triggers to one or more action channels (Slack, email, webhook)
- Configure template variables ({{post_title}}, {{user_name}}, {{order_total}})
- Channel-specific formatting (Block Kit for Slack, HTML for email, JSON for webhook)
- Rate limiting per channel to prevent flooding
- Update trigger actions with `wf_update_trigger`

### Procedure 5: Trigger Management

See `references/trigger-management.md`
- List and filter triggers with `wf_list_triggers`
- Activate/deactivate triggers without deleting (via `wf_update_trigger`)
- Test triggers in dry-run mode
- Review trigger audit log
- Bulk operations (enable/disable all, export/import)
- Delete stale triggers with `wf_delete_trigger`

## MCP Tools Reference

| Tool | Description |
|------|-------------|
| `wf_list_triggers` | List all workflow triggers with optional status/type filters |
| `wf_create_trigger` | Create a new workflow trigger (cron, lifecycle, action hook) |
| `wf_update_trigger` | Update trigger config, actions, or status (active/inactive) |
| `wf_delete_trigger` | Delete a workflow trigger (with safety confirmation) |

## Reference Files

| File | Content |
|------|---------|
| `references/schedule-triggers.md` | WP-Cron patterns, custom intervals, external cron setup |
| `references/content-lifecycle-hooks.md` | Post status transitions, CPT support, taxonomy changes, media events |
| `references/wp-action-hooks.md` | Core WP actions, WooCommerce hooks, plugin hooks, filter hooks |
| `references/multi-channel-actions.md` | Channel config, template variables, formatting, rate limiting |
| `references/trigger-management.md` | Listing, activate/deactivate, dry-run testing, audit log, bulk ops |

## Recommended Agent

Use the **`wp-site-manager`** for automated workflow orchestration that combines trigger creation, multi-channel action routing, and lifecycle management.

## Related Skills

- **`wp-alerting`** — shares Slack and SendGrid channels for notification delivery
- **`wp-monitoring`** — source of health/performance data that may trigger workflows
- **`wp-webhooks`** — outbound/inbound webhook infrastructure for webhook action channel
- **`wp-social-email`** — shares SendGrid and Mailchimp config for email actions

## Cross-references

- Workflow triggers pair with `wp-alerting` for severity-based notification routing
- Scheduled triggers depend on WP-Cron config detectable via `wp-monitoring`
- Webhook actions use `wp-webhooks` infrastructure for outbound delivery
- Email actions share SendGrid/Mailchimp config with `wp-social-email`
- WooCommerce hooks connect to `wp-woocommerce` for order-based workflows

## Troubleshooting

| Issue | Cause | Resolution |
|-------|-------|------------|
| Cron trigger not firing | DISABLE_WP_CRON is true and no server cron configured | Set up server cron job: `*/5 * * * * wget -qO- https://example.com/wp-cron.php` |
| Content hook missed | Post updated via direct DB query (bypasses hooks) | Ensure content changes go through `wp_update_post()` or REST API |
| Slack action fails | slack_webhook_url or slack_bot_token not configured | Add Slack credentials to WP_SITES_CONFIG |
| Email action 403 | SendGrid API key lacks Mail Send permission | Regenerate key with "Mail Send" access in SendGrid dashboard |
| Duplicate triggers firing | Multiple hooks registered for same event | Review triggers with `wf_list_triggers` and deduplicate |
| Trigger test fails | Action channel unreachable or credentials expired | Run `workflow_inspect.mjs` to verify channel configuration |
| WooCommerce hooks silent | WooCommerce not active or hooks not registered | Verify WooCommerce is active; hooks fire only after `woocommerce_init` |
| Detection script exit 1 | No workflow config found | Add action channel credentials to WP_SITES_CONFIG and install wp-crontrol |
