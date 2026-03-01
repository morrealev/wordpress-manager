---
name: wp-linkedin
description: This skill should be used when the user asks to "publish to LinkedIn",
  "LinkedIn post", "LinkedIn article", "B2B social", "pubblica su LinkedIn",
  "LinkedIn analytics", "LinkedIn engagement", or mentions LinkedIn publishing
  and analytics for WordPress content.
version: 1.0.0
tags: [linkedin, social-media, b2b, direct-social]
---

# WordPress LinkedIn Integration Skill

## Overview

Direct LinkedIn publishing connects WordPress content to LinkedIn via the Community Management API v2. This enables B2B-focused content distribution: feed posts for quick updates, long-form articles for blog-to-LinkedIn workflows, and analytics for engagement tracking. The WP REST Bridge provides 5 MCP tools with the `li_*` namespace.

## When to Use

- User wants to publish a WordPress blog post to LinkedIn
- User needs to create LinkedIn feed posts from WordPress content
- User wants to publish a long-form LinkedIn article from a blog post
- User asks about LinkedIn post analytics (impressions, clicks, engagement)
- User needs B2B social media distribution from WordPress

## Decision Tree

1. **What LinkedIn action?**
   - "publish post" / "LinkedIn update" / "feed post" → Posting workflow (Section 1)
   - "article" / "long-form" / "blog to LinkedIn" → Article publishing (Section 2)
   - "analytics" / "engagement" / "impressions" → Analytics (Section 3)
   - "setup" / "configure" / "connect LinkedIn" → Setup guide (Section 4)

2. **Run detection first:**
   ```bash
   node skills/wp-linkedin/scripts/linkedin_inspect.mjs [--cwd=/path/to/project]
   ```
   This identifies configured LinkedIn credentials in WP_SITES_CONFIG.

## Sections

### Section 1: LinkedIn Posting
See `references/linkedin-posting.md`
- Feed post creation with text, links, and images
- Visibility settings (PUBLIC vs CONNECTIONS)
- Content adaptation from WordPress excerpt/title
- Hashtag strategy and mention formatting

### Section 2: Article Publishing
See `references/linkedin-posting.md`
- Blog post → LinkedIn article conversion
- HTML content formatting for LinkedIn
- Thumbnail and media handling
- Article vs post decision criteria

### Section 3: Analytics
See `references/linkedin-analytics.md`
- Post impressions and engagement metrics
- Click-through rates and share counts
- Performance comparison across posts
- B2B content performance benchmarks

### Section 4: Setup Guide
See `references/linkedin-setup.md`
- LinkedIn Developer App creation
- OAuth 2.0 access token generation
- WP_SITES_CONFIG configuration
- Required scopes: w_member_social, r_liteprofile

## Reference Files

| File | Content |
|------|---------|
| `references/linkedin-setup.md` | Developer app, OAuth setup, WP_SITES_CONFIG, scopes |
| `references/linkedin-posting.md` | Post creation, articles, content adaptation, formatting |
| `references/linkedin-analytics.md` | Metrics, engagement tracking, performance benchmarks |

## MCP Tools

| Tool | Description |
|------|-------------|
| `li_get_profile` | Get authenticated LinkedIn user profile |
| `li_create_post` | Create a LinkedIn feed post (text, link, image) |
| `li_create_article` | Publish a long-form LinkedIn article |
| `li_get_analytics` | Get post analytics (impressions, clicks, engagement) |
| `li_list_posts` | List recent posts by the authenticated user |

## Recommended Agent

Use the **`wp-distribution-manager`** agent for multi-channel workflows that combine LinkedIn with Mailchimp, Buffer, SendGrid, and Twitter/X.

## Related Skills

- **`wp-twitter`** — Twitter/X direct publishing (awareness channel)
- **`wp-social-email`** — Mailchimp, Buffer, SendGrid distribution
- **`wp-content-repurposing`** — Transform blog content into LinkedIn-optimized formats
- **`wp-content`** — Create source WordPress content for distribution
