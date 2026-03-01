---
name: wp-social-email
description: This skill should be used when the user asks to "publish to social media",
  "schedule social posts", "send email campaign", "Mailchimp integration",
  "Buffer scheduling", "SendGrid email", "content distribution",
  "newsletter campaign", "email marketing", "social media management",
  "distribute content", or mentions publishing WordPress content to social
  and email channels.
version: 1.0.0
---

# WordPress Social & Email Distribution Skill

## Overview

Social and email distribution connects WordPress content to external marketing channels via three services: Mailchimp (email campaigns and audience management), Buffer (social media scheduling and publishing), and SendGrid (transactional email delivery). The WP REST Bridge provides 18 MCP tools across these services, enabling content distribution workflows directly from the WordPress authoring environment.

## When to Use

- User wants to send a newsletter or email campaign from WordPress content
- User needs to schedule social media posts when a blog post is published
- User asks about Mailchimp audience management or subscriber lists
- User wants to connect Buffer for social media scheduling
- User needs transactional email delivery via SendGrid (welcome emails, confirmations)
- User asks about content distribution pipelines (blog → social → email)
- User wants to segment audiences for targeted campaigns
- User needs analytics on email open rates, click rates, or social engagement

## Decision Tree

1. **What channel or service?**
   - "Mailchimp" / "audience" / "email campaign" / "newsletter" → Mailchimp integration (Section 1)
   - "Buffer" / "social post" / "schedule tweet" / "social media" → Buffer social publishing (Section 2)
   - "SendGrid" / "transactional email" / "email delivery" → SendGrid transactional (Section 3)
   - "distribute content" / "blog to social" / "content pipeline" → Content-to-distribution workflow (Section 4)
   - "audience segment" / "targeting" / "list management" → Audience segmentation (Section 5)
   - "email analytics" / "open rate" / "click rate" / "campaign report" → Distribution analytics (Section 6)

2. **Run detection first:**
   ```bash
   node skills/wp-social-email/scripts/distribution_inspect.mjs [--cwd=/path/to/project]
   ```
   This identifies configured distribution services and API credentials.

## Service Overview

| Service | Tools | Auth Type | Use Case |
|---------|-------|-----------|----------|
| Mailchimp | 7 tools (`mc_*`) | API key | Email campaigns, audience management, subscriber lists |
| Buffer | 5 tools (`buf_*`) | Access token | Social media scheduling, queue management, analytics |
| SendGrid | 6 tools (`sg_*`) | API key | Transactional email, templates, contact management |

## Distribution Sections

### Section 1: Mailchimp Integration
See `references/mailchimp-integration.md`
- API key setup and WP_SITES_CONFIG configuration
- Audience management (list, get members, add subscribers)
- Campaign workflow: create → set content → send → report
- A/B testing and send time optimization

### Section 2: Buffer Social Publishing
See `references/buffer-social-publishing.md`
- Access token setup and WP_SITES_CONFIG configuration
- Profile management and channel connections
- Post creation with media attachments and scheduling
- Queue management and posting analytics

### Section 3: SendGrid Transactional Email
See `references/sendgrid-transactional.md`
- API key setup and WP_SITES_CONFIG configuration
- Transactional email for welcome, password reset, order confirmation
- Dynamic template management
- Contact management and email deliverability

### Section 4: Content-to-Distribution Workflow
See `references/content-to-distribution.md`
- WordPress-to-channel pipeline (fetch post → format → distribute)
- Content adaptation per channel (blog → social, blog → newsletter)
- Scheduling strategies (immediate, drip, evergreen rotation)
- Multi-channel orchestration

### Section 5: Audience Segmentation
See `references/audience-segmentation.md`
- Mailchimp list segmentation strategies
- SendGrid contact lists and custom fields
- Buffer profile-based targeting
- Building audience personas from WordPress user data

### Section 6: Distribution Analytics
See `references/distribution-analytics.md`
- Mailchimp campaign reports (open rate, click rate, bounces)
- Buffer analytics (reach, engagement, clicks)
- SendGrid stats (deliverability, opens, clicks)
- Cross-channel performance comparison and KPIs

## Reference Files

| File | Content |
|------|---------|
| `references/mailchimp-integration.md` | API setup, audiences, campaigns, A/B testing |
| `references/buffer-social-publishing.md` | Access token, profiles, posts, queue management |
| `references/sendgrid-transactional.md` | API setup, transactional email, templates, contacts |
| `references/content-to-distribution.md` | Content pipeline, adaptation, scheduling, multi-channel |
| `references/audience-segmentation.md` | List segmentation, custom fields, personas |
| `references/distribution-analytics.md` | Campaign reports, social stats, KPIs, benchmarks |

## MCP Tools

### Mailchimp Tools (7)

| Tool | Description |
|------|-------------|
| `mc_list_audiences` | List all Mailchimp audiences (lists) with member counts |
| `mc_get_audience_members` | Get subscribers for a specific audience with pagination |
| `mc_add_subscriber` | Add or update a subscriber in an audience |
| `mc_create_campaign` | Create a new email campaign (regular, plaintext, A/B test) |
| `mc_set_campaign_content` | Set the HTML or template content for a campaign |
| `mc_send_campaign` | Send or schedule a campaign for delivery |
| `mc_get_campaign_report` | Get campaign performance metrics (opens, clicks, bounces) |

### Buffer Tools (5)

| Tool | Description |
|------|-------------|
| `buf_list_profiles` | List connected social media profiles (Twitter, Facebook, LinkedIn, etc.) |
| `buf_create_update` | Create a social media post with text, media, and optional schedule time |
| `buf_list_pending` | List posts in the Buffer queue awaiting publication |
| `buf_list_sent` | List previously published posts with engagement data |
| `buf_get_analytics` | Get analytics for a profile (reach, engagement, clicks) |

### SendGrid Tools (6)

| Tool | Description |
|------|-------------|
| `sg_send_email` | Send a transactional email (plain, HTML, or template-based) |
| `sg_list_templates` | List available dynamic email templates |
| `sg_get_template` | Get template details including version and HTML content |
| `sg_list_contacts` | List contacts with optional search and filtering |
| `sg_add_contacts` | Add or update contacts with custom fields |
| `sg_get_stats` | Get email statistics (deliveries, opens, clicks, bounces) |

## Recommended Agent

Use the **`wp-distribution-manager`** agent for complex multi-channel distribution workflows that span multiple services or require coordinated content adaptation.

## Related Skills

- **`wp-content-repurposing`** — transform content formats before distribution
- **`wp-webhooks`** — trigger distribution on WordPress events (publish, update)
- **`wp-content`** — create and manage WordPress content for distribution
- **`wp-content-attribution`** — track content sources and attribution across channels
- **`wp-content-workflows`** — automate distribution via workflow triggers (schedule, content lifecycle, hooks)
