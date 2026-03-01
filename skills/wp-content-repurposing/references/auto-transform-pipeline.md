# Auto-Transform Pipeline

## Overview

The auto-transform pipeline converts WordPress content into platform-ready outputs with minimal manual intervention. It follows a 4-stage architecture: **Fetch → Extract → Template → Output**.

Each stage is composable — you can run the full pipeline for hands-free distribution or stop at any stage for review and manual adjustments.

## Pipeline Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  FETCH   │───▶│ EXTRACT  │───▶│ TEMPLATE │───▶│  OUTPUT  │
│          │    │          │    │          │    │          │
│ wp_get_  │    │ title    │    │ platform │    │ li_*     │
│ post     │    │ excerpt  │    │ rules    │    │ tw_*     │
│ wp_list_ │    │ headings │    │ char     │    │ buf_*    │
│ posts    │    │ key pts  │    │ limits   │    │ mc_*     │
│          │    │ image    │    │ tone     │    │ sg_*     │
│          │    │ tags     │    │ hashtags │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Stage 1: Fetch

Retrieve source content from WordPress using REST tools.

| Tool | Use Case |
|------|----------|
| `wp_get_post` | Single post by ID |
| `wp_list_posts` | Recent posts for batch processing |
| `wp_get_page` | Static page content |
| `wc_get_product` | WooCommerce product for e-commerce social |

Extract from the response: `title.rendered`, `excerpt.rendered`, `content.rendered`, `featured_media`, `categories`, `tags`.

### Stage 2: Extract

Parse the raw content into atomic elements for templating.

**Extraction rules:**
- **Title**: Strip HTML entities, keep under 100 chars
- **Excerpt**: First 2-3 sentences if no excerpt set, strip HTML
- **Headings**: All H2/H3 from content (used for thread splitting)
- **Key points**: Sentences containing numbers, statistics, or strong claims
- **Featured image**: Resolve `featured_media` ID to URL via `wp_get_media`
- **Tags**: Map to hashtags (lowercase, no spaces, `#` prefix)
- **Categories**: Use for tone/audience targeting

**Tag-to-hashtag conversion:**
```
"Zero Calorie" → #zerocalorie
"Cactus Water" → #cactuswater
"Health Tips"  → #healthtips
```

### Stage 3: Template

Apply platform-specific formatting rules from `transform-templates.md`.

**Template selection logic:**
| Target Platform | Content Length | Template |
|----------------|---------------|----------|
| Twitter/X | Short (< 5 key points) | Single tweet |
| Twitter/X | Long (≥ 5 key points or ≥ 3 H2s) | Thread |
| LinkedIn | Any | Feed post (default) or Article (if > 2000 words) |
| Buffer | Per-profile | Adapts to connected profiles |
| Email | Any | Snippet with CTA |

### Stage 4: Output

Dispatch to distribution channels using MCP tools.

| Channel | Tool | Requires Confirmation |
|---------|------|-----------------------|
| LinkedIn post | `li_create_post` | No |
| LinkedIn article | `li_create_article` | Yes (safety hook) |
| Twitter single | `tw_create_tweet` | No |
| Twitter thread | `tw_create_thread` | No |
| Buffer queue | `buf_create_update` | No |
| Mailchimp campaign | `mc_create_campaign` + `mc_update_campaign_content` + `mc_send_campaign` | Yes (safety hook) |
| SendGrid email | `sg_send_email` | Yes (safety hook) |

## Configuration

### Batch Processing

For multi-post transforms (e.g., "repurpose the last 5 posts"):

1. Fetch posts: `wp_list_posts` with `per_page=5`, `orderby=date`
2. Loop: Extract → Template → Output per post
3. For Buffer: space scheduling with `scheduled_at` (30-minute intervals)
4. Report: Summary table with post title, channels, status

### Tone Adaptation

| Platform | Tone | Adjustments |
|----------|------|-------------|
| Twitter/X | Casual, punchy | Short sentences, emojis OK, hook first |
| LinkedIn | Professional | Industry language, data-driven, insights |
| Email | Friendly, direct | Personal tone, clear CTA, benefit-focused |
| Buffer (multi) | Per-profile defaults | Adapts to connected platform |

## Integration Points

This pipeline integrates with the distribution tools added in v2.10.0:

- **LinkedIn**: `li_create_post`, `li_create_article`, `li_get_analytics`
- **Twitter/X**: `tw_create_tweet`, `tw_create_thread`, `tw_get_metrics`
- **Buffer**: `buf_create_update`, `buf_get_analytics`
- **Mailchimp**: `mc_create_campaign`, `mc_update_campaign_content`, `mc_send_campaign`
- **SendGrid**: `sg_send_email`

Always check service availability before pipeline execution:
```
hasLinkedIn() → li_* tools available
hasTwitter()  → tw_* tools available
hasBuffer()   → buf_* tools available
hasMailchimp() → mc_* tools available
hasSendGrid() → sg_* tools available
```

## Safety

- **Never auto-send** emails or campaigns — always require user confirmation
- **Preview before publish** — show formatted output before dispatching to any channel
- **Rate limiting** — respect platform API rate limits (Twitter: 300 tweets/3h, LinkedIn: 100 posts/day)
- **Duplicate detection** — check recent posts on platform before publishing identical content
