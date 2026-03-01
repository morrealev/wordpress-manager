# LinkedIn Posting Guide

## Feed Posts vs Articles

| Feature | Feed Post (`li_create_post`) | Article (`li_create_article`) |
|---------|-----|---------|
| Length | Up to 3,000 chars | Unlimited (long-form) |
| Format | Plain text + link/image | HTML body |
| Use case | Quick updates, links, images | Blog-to-LinkedIn, thought leadership |
| Engagement | Higher reach, lower depth | Lower reach, higher depth |
| SEO | No | Yes (indexed by search engines) |

## Creating Feed Posts

### Basic Text Post
```
Tool: li_create_post
Params: { "text": "Excited to share our latest blog post about...", "visibility": "PUBLIC" }
```

### Post with Link Share
```
Tool: li_create_post
Params: { "text": "New article on our blog!", "link_url": "https://mysite.com/blog/post-slug", "visibility": "PUBLIC" }
```

LinkedIn automatically generates a link preview card with the page's Open Graph metadata.

### Best Practices for Feed Posts
- **First 2 lines matter** — LinkedIn truncates after ~210 characters with "...see more"
- **Hashtags**: 3-5 relevant hashtags at the end
- **Mentions**: Use LinkedIn mention syntax for company pages
- **Emojis**: Use sparingly for visual breaks
- **CTA**: Include a clear call-to-action

## Publishing Articles

### Blog-to-LinkedIn Workflow
1. Fetch WordPress post: `wp_get_post` with `id`
2. Extract: title, content (HTML), featured image URL
3. Create article: `li_create_article` with title, body_html, thumbnail_url

### Content Adaptation Tips
- Remove WordPress-specific shortcodes from HTML
- Ensure images use absolute URLs
- Keep title under 100 characters
- First paragraph should hook the reader
- Add "Originally published on [site]" at the end

## Visibility Settings

- **PUBLIC** — Visible to all LinkedIn users (default)
- **CONNECTIONS** — Visible only to your connections
