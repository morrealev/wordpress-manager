# Content-to-Distribution Workflow

## Overview

The content-to-distribution pipeline transforms WordPress content into format-appropriate messages for email and social channels. This reference covers the full workflow: fetching content, adapting it per channel, scheduling distribution, and orchestrating multi-channel campaigns.

## WordPress-to-Channel Pipeline

### Core flow

```
WordPress Post → Fetch Content → Adapt Format → Distribute
                 (wp_get_post)   (per channel)   (mc_*/buf_*/sg_*)
```

### Step 1: Fetch the source content

```
Tool: wp_get_post
Params:
  id: 42
  _embed: true    # Include featured image, author, categories
Returns:
  title, excerpt, content (HTML), permalink, featured_media_url,
  author, categories, tags, date
```

### Step 2: Adapt for each channel

The same post requires different formatting per distribution target.

### Step 3: Distribute via service tools

Route the adapted content to the appropriate MCP tool.

## Content Adaptation Per Channel

### Blog → Newsletter (Mailchimp)

| Element | Adaptation |
|---------|------------|
| Title | Campaign subject line (max 150 chars, add emoji or personalization) |
| Excerpt | Preview text (max 200 chars) |
| Content | Full HTML body, reformatted for email (inline CSS, max 600px width) |
| Featured image | Hero image at top of email (600px wide) |
| CTA | "Read the full post" button linking to permalink |

```
1. wp_get_post → extract title, content, featured_image
2. mc_create_campaign → subject = post title, from_name = site name
3. mc_set_campaign_content → html = email-formatted post content
4. mc_send_campaign → deliver or schedule
```

### Blog → Social Post (Buffer)

| Platform | Adaptation |
|----------|------------|
| Twitter/X | Title + shortened excerpt (max 250 chars with URL) |
| LinkedIn | Title + full excerpt + 3-5 hashtags (max 700 chars) |
| Facebook | Title + excerpt + URL (no character pressure) |
| Instagram | Excerpt + 10-15 hashtags (image required) |

```
1. wp_get_post → extract title, excerpt, permalink, featured_image
2. Compose platform-specific text variants
3. buf_create_update → text, media.photo, profile_ids, scheduled_at
```

### Blog → Transactional Notification (SendGrid)

For notifying specific users about relevant new content:

```
1. wp_get_post → extract title, excerpt, permalink
2. sg_list_contacts → find users matching content category
3. sg_send_email → template with post title, excerpt, read-more link
```

## Scheduling Strategies

### Immediate distribution

Publish to all channels as soon as the WordPress post goes live. Best for breaking news or time-sensitive content.

```
1. WordPress publish event triggers distribution
2. mc_send_campaign (send now)
3. buf_create_update (no scheduled_at → immediate queue)
4. sg_send_email (immediate delivery)
```

### Staggered distribution

Spread distribution across hours or days to maximize reach across time zones and channel algorithms.

```
Day 0, Hour 0:  Blog post published
Day 0, Hour 1:  buf_create_update → Twitter (immediate engagement)
Day 0, Hour 4:  buf_create_update → LinkedIn (business hours)
Day 1, Hour 10: mc_send_campaign → Newsletter (Tuesday 10am optimal)
Day 3:          buf_create_update → Facebook (extend reach)
Day 7:          sg_send_email → Re-engagement for non-openers
```

### Evergreen rotation

Re-distribute high-performing content on a recurring schedule:

```
1. buf_list_sent → identify posts with highest engagement
2. Filter for content older than 30 days (avoid fatigue)
3. buf_create_update → re-share with updated text
4. Track performance to retire content below threshold
```

## Multi-Channel Distribution Workflow

### Full orchestration example

Distribute a new blog post across all three services:

```
# 1. Fetch source content
wp_get_post id=42 → { title, excerpt, content, permalink, featured_image }

# 2. Email campaign (Mailchimp)
mc_create_campaign type="regular" audience_id=... subject="{title}"
mc_set_campaign_content campaign_id=... html="{formatted_content}"
mc_send_campaign campaign_id=... schedule_time="2026-03-15T10:00:00Z"

# 3. Social posts (Buffer)
buf_create_update profile_ids=[twitter] text="{short_text}" media.photo="{featured_image}"
buf_create_update profile_ids=[linkedin] text="{long_text}" scheduled_at="2026-03-15T14:00:00Z"

# 4. Notification email (SendGrid)
sg_send_email to="vip-subscribers" template_id="d-newpost" dynamic_template_data={title, excerpt, permalink}
```

### Coordination checklist

- [ ] Source content finalized and published on WordPress
- [ ] Email campaign created and content set (Mailchimp)
- [ ] Social posts queued for each target profile (Buffer)
- [ ] Transactional notifications sent to relevant user segments (SendGrid)
- [ ] UTM parameters appended to all outbound URLs
- [ ] Analytics tracking confirmed for each channel

## Best Practices

- **Single source of truth**: Always fetch content from WordPress (`wp_get_post`) rather than duplicating content manually
- **URL tracking**: Append UTM parameters per channel (`utm_source=mailchimp`, `utm_source=buffer`, `utm_source=sendgrid`)
- **Content freshness**: Verify post status is `publish` before distributing; draft content should never reach channels
- **Error handling**: If one channel fails, proceed with others; log failures and retry individually
- **Preview before send**: Use Mailchimp preview and Buffer draft features to review formatting before live distribution
- **Audience overlap**: Be mindful that users may follow multiple channels; vary the messaging slightly to avoid fatigue
