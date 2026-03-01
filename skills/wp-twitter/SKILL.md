---
name: wp-twitter
description: This skill should be used when the user asks to "publish a tweet",
  "create a thread", "Twitter analytics", "tweet a post", "pubblica tweet",
  "Twitter/X publishing", or mentions Twitter/X posting, threads, and analytics
  for WordPress content.
version: 1.0.0
tags: [twitter, x, social-media, tweets, threads, direct-social]
---

# WordPress Twitter/X Integration Skill

## Overview

Direct Twitter/X publishing connects WordPress content to Twitter via the API v2. This enables quick content distribution: single tweets for announcements, threads for long-form storytelling, and metrics for engagement tracking. The WP REST Bridge provides 5 MCP tools with the `tw_*` namespace.

## When to Use

- User wants to tweet about a WordPress blog post
- User needs to create a Twitter thread from a blog post
- User asks about tweet metrics (impressions, likes, retweets)
- User wants to manage tweets (publish, list, delete)
- User needs social media distribution via Twitter/X

## Decision Tree

1. **What Twitter action?**
   - "tweet" / "publish tweet" / "post to Twitter" → Single tweet (Section 1)
   - "thread" / "tweetstorm" / "multi-tweet" → Thread creation (Section 2)
   - "analytics" / "metrics" / "impressions" → Metrics (Section 3)
   - "delete" / "remove tweet" → Delete tweet (Section 4)
   - "setup" / "configure" / "connect Twitter" → Setup guide (Section 5)

2. **Run detection first:**
   ```bash
   node skills/wp-twitter/scripts/twitter_inspect.mjs [--cwd=/path/to/project]
   ```
   This identifies configured Twitter credentials in WP_SITES_CONFIG.

## Sections

### Section 1: Single Tweet
See `references/twitter-posting.md`
- Tweet creation with text, media, and reply-to
- Character limit enforcement (280 chars)
- Hashtag and mention strategy
- Link sharing and Twitter card generation

### Section 2: Thread Creation
See `references/twitter-posting.md`
- Blog post → thread conversion
- Thread splitting logic
- Sequential reply-chaining
- Best practices for thread engagement

### Section 3: Metrics
See `references/twitter-analytics.md`
- Tweet impressions, likes, retweets, replies, quotes
- Performance tracking over time
- Engagement benchmarks

### Section 4: Tweet Deletion
- Delete a specific tweet by ID
- Safety hook requires explicit user confirmation
- Deletion is irreversible

### Section 5: Setup Guide
See `references/twitter-setup.md`
- Twitter Developer Portal app creation
- API v2 Bearer token generation
- WP_SITES_CONFIG configuration
- Required access levels and permissions

## Reference Files

| File | Content |
|------|---------|
| `references/twitter-setup.md` | Developer portal, API keys, WP_SITES_CONFIG, permissions |
| `references/twitter-posting.md` | Tweets, threads, content adaptation, formatting |
| `references/twitter-analytics.md` | Metrics, engagement tracking, performance benchmarks |

## MCP Tools

| Tool | Description |
|------|-------------|
| `tw_create_tweet` | Publish a tweet (text, media, reply-to) |
| `tw_create_thread` | Publish a connected tweet thread |
| `tw_get_metrics` | Get tweet metrics (impressions, likes, retweets) |
| `tw_list_tweets` | List recent user tweets |
| `tw_delete_tweet` | Delete a tweet (irreversible, safety hook) |

## Recommended Agent

Use the **`wp-distribution-manager`** agent for multi-channel workflows that combine Twitter/X with Mailchimp, Buffer, SendGrid, and LinkedIn.

## Related Skills

- **`wp-linkedin`** — LinkedIn direct publishing (B2B channel)
- **`wp-social-email`** — Mailchimp, Buffer, SendGrid distribution
- **`wp-content-repurposing`** — Transform blog content into tweet-optimized formats
- **`wp-content`** — Create source WordPress content for distribution
