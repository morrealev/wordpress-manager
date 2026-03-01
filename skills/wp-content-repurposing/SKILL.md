---
name: wp-content-repurposing
description: This skill should be used when the user asks to "repurpose content",
  "create social posts from blog", "transform content for social media", "email
  newsletter from posts", "content atomization", "reuse content across channels",
  "adapt content for different platforms", "turn blog into social", "content
  distribution", or mentions turning WordPress content into multi-format outputs.
version: 1.0.0
---

# WordPress Content Repurposing Skill

## Overview

Content repurposing is the systematic transformation of canonical WordPress content into channel-specific formats. Instead of creating original content for each platform, you extract value from existing posts, pages, and products and reshape it for social media, email newsletters, ad copy, and other distribution channels.

## When to Use

- User has existing WordPress content and wants to distribute it across channels
- User asks to turn blog posts into social media content
- User wants to create email newsletters from existing content
- User needs to atomize long-form content into smaller shareable pieces
- User wants platform-specific content variants from a single source

## Content Repurposing vs Content Creation

| Need | Skill |
|------|-------|
| Create new original content from scratch | `wp-content` |
| Transform existing content for new channels | `wp-content-repurposing` (this skill) |
| SEO-optimized blog post creation | `wp-content` |
| Blog post → social thread + email digest | `wp-content-repurposing` (this skill) |

## Decision Tree

1. **What output format?**
   - "social posts" / "Twitter thread" / "LinkedIn" / "Instagram" → Social formats (Section 1)
   - "email" / "newsletter" / "digest" → Email newsletter (Section 2)
   - "atomize" / "break down" / "content calendar" → Content atomization (Section 3)
   - "character limits" / "platform specs" / "image sizes" → Platform specifications (Section 4)

2. **Run detection first:**
   ```bash
   node skills/wp-content-repurposing/scripts/repurposing_inspect.mjs [--cwd=/path/to/project]
   ```
   This identifies existing content volume, social plugins, and email integrations.

## Repurposing Areas

### Section 1: Social Formats
See `references/social-formats.md`
- Blog post → Twitter/X thread
- Blog post → LinkedIn article summary
- Blog post → Instagram carousel
- Blog post → Facebook engagement post
- Product → social proof posts

### Section 2: Email Newsletter
See `references/email-newsletter.md`
- Blog post → newsletter digest
- Product launch → email announcement
- Content series → drip sequence
- Subject line and CTA optimization

### Section 3: Content Atomization
See `references/content-atomization.md`
- Pillar content → atomic units (quotes, stats, tips)
- Atomization workflow and content calendar
- Repurposing matrix (1 post → 5-10 outputs)
- Quality gates for standalone value

### Section 4: Platform Specifications
See `references/platform-specs.md`
- Character limits per platform
- Image dimensions per platform
- Hashtag and link strategies
- Posting frequency recommendations

## Reference Files

| File | Content |
|------|---------|
| `references/social-formats.md` | Templates for Twitter, LinkedIn, Instagram, Facebook |
| `references/email-newsletter.md` | Newsletter digest, drip sequences, subject lines |
| `references/content-atomization.md` | Atomization workflow, content calendar, repurposing matrix |
| `references/platform-specs.md` | Character limits, image sizes, posting frequency |

## Recommended Agent

**`wp-content-strategist`** — selects source content via WP REST Bridge, extracts key elements, applies platform templates, and generates formatted outputs for review.

## Related Skills

- **`wp-content`** — content creation and lifecycle management (source content)
- **`wp-headless`** — headless content delivery for multi-channel architectures
- **`wp-woocommerce`** — product content for e-commerce repurposing
- **wp-social-email** — publish repurposed content to social and email channels
