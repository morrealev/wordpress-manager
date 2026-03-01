# Buffer Social Publishing

## Overview

Buffer is a social media scheduling platform that manages posting across Twitter/X, Facebook, Instagram, LinkedIn, and other channels. The WP REST Bridge provides 5 MCP tools (`buf_*`) for creating posts, managing queues, and retrieving analytics.

## Setup

### Access Token Configuration

Add Buffer credentials to `WP_SITES_CONFIG`:

```json
{
  "sites": [{
    "name": "my-site",
    "url": "https://example.com",
    "distribution": {
      "buffer": {
        "access_token": "1/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }]
}
```

Obtain the access token from Buffer's developer portal (Settings → Apps → Access Token).

## Profile Management

### List connected profiles

```
Tool: buf_list_profiles
Returns: Array of profiles with id, service (twitter, facebook, etc.),
         formatted_username, avatar, schedules, counts
```

Each profile represents a connected social account. A single Buffer account may have multiple profiles (e.g., @company on Twitter + Company Page on Facebook).

## Post Creation

### Create a social post

```
Tool: buf_create_update
Params:
  profile_ids: ["profile_abc123"]
  text: "New blog post: 10 Tips for Better SEO — Read more at https://example.com/seo-tips"
  scheduled_at: "2026-03-15T14:00:00Z"   # Optional: omit for immediate queue
```

### Create a post with media

```
Tool: buf_create_update
Params:
  profile_ids: ["profile_abc123", "profile_def456"]
  text: "Check out our latest product launch!"
  media:
    photo: "https://example.com/wp-content/uploads/2026/03/product-launch.jpg"
    thumbnail: "https://example.com/wp-content/uploads/2026/03/product-launch-thumb.jpg"
```

### Post to multiple profiles

Pass an array of `profile_ids` to publish the same content across channels simultaneously. Buffer adapts character limits per platform.

```
Tool: buf_create_update
Params:
  profile_ids: ["twitter_id", "facebook_id", "linkedin_id"]
  text: "We just published a comprehensive guide to WordPress performance optimization."
```

## Queue Management

### List pending posts

```
Tool: buf_list_pending
Params:
  profile_id: "profile_abc123"
Returns: Array of queued posts with id, text, scheduled_at, media
```

### List sent posts

```
Tool: buf_list_sent
Params:
  profile_id: "profile_abc123"
  count: 20
  page: 1
Returns: Array of published posts with engagement metrics
```

## WordPress-to-Buffer Workflow

Typical flow for distributing a WordPress post to social media:

1. **Fetch the post** using `wp_get_post` to get title, excerpt, permalink, featured image
2. **Format for social**: Compose text from post title + excerpt (truncated to platform limits)
3. **Attach media**: Use the featured image URL as the `media.photo` parameter
4. **Schedule**: Set `scheduled_at` for optimal posting time or omit for queue placement
5. **Post to profiles**: Select target profiles and call `buf_create_update`

```
# Example: Blog post → Twitter + LinkedIn
Step 1: wp_get_post id=42 → { title, excerpt, link, featured_media_url }
Step 2: Compose text = "📝 {title}\n\n{excerpt}\n\nRead more: {link}"
Step 3: buf_create_update profile_ids=[twitter, linkedin] text=... media.photo={featured_media_url}
```

## Best Practices

- **Optimal posting times**: Analyze `buf_get_analytics` to identify when your audience is most active; schedule posts during those windows
- **Platform-specific formatting**: Twitter has 280 chars; LinkedIn allows 3000; tailor text length per profile rather than using identical copy
- **Hashtag strategy**: Use 1-2 relevant hashtags on Twitter, 3-5 on LinkedIn; avoid hashtags on Facebook
- **Image dimensions**: Use 1200x628px for link previews, 1080x1080px for square posts; Buffer will resize but starting with correct dimensions avoids cropping
- **Queue spacing**: Buffer's default schedule spaces posts throughout the day; avoid overriding with manual times unless needed
- **Evergreen content**: Re-queue high-performing posts using `buf_list_sent` to identify top performers, then `buf_create_update` to re-share
- **UTM parameters**: Append `?utm_source=buffer&utm_medium=social&utm_campaign={campaign}` to URLs for tracking in Google Analytics
- **Avoid duplicate content**: Check `buf_list_pending` before creating new posts to prevent queue duplication
