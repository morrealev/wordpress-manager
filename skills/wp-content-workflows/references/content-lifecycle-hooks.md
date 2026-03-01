# Content Lifecycle Hooks

## Post Status Transitions

WordPress fires `transition_post_status` on every status change:

| Transition | From → To | Common Use |
|------------|-----------|------------|
| Publish | `draft` → `publish` | Notify team of new content |
| Schedule | `draft` → `future` | Confirm scheduling |
| Unpublish | `publish` → `draft` | Alert editors |
| Trash | `publish` → `trash` | Audit log entry |
| Restore | `trash` → `draft` | Notify original author |
| Pending review | `draft` → `pending` | Notify reviewers |

### Hook Signatures

```php
// Generic transition hook
add_action('transition_post_status', function ($new, $old, $post) {
    if ($new === 'publish' && $old !== 'publish') {
        // First-time publish — trigger workflow
    }
}, 10, 3);

// Specific transition hooks (preferred for performance)
add_action('draft_to_publish', function ($post) {
    // Fires only on draft → publish transition
});

add_action('pending_to_publish', function ($post) {
    // Fires on pending → publish (after review approval)
});
```

### Trigger Config Example

```json
{
  "type": "content_lifecycle",
  "event": "draft_to_publish",
  "post_type": "post",
  "actions": [
    { "channel": "slack", "message": ":newspaper: New post published: *{{post_title}}* by {{post_author}}" }
  ]
}
```

## Custom Post Type Support

The same transition hooks work for any registered post type:

| Post Type | Slug | Example Trigger |
|-----------|------|-----------------|
| WooCommerce Product | `product` | Notify when new product goes live |
| Portfolio | `portfolio` | Share on social when portfolio item published |
| Event | `event` | Send reminder email on event publish |
| Landing Page | `page` | Alert marketing team on page publish |

Filter by post type in trigger config:

```json
{
  "event": "draft_to_publish",
  "post_type": ["post", "product"],
  "condition": "post_type IN (post, product)"
}
```

## Taxonomy and Term Changes

| Hook | Fires When | Parameters |
|------|------------|------------|
| `set_object_terms` | Terms assigned to a post | `$object_id`, `$terms`, `$tt_ids`, `$taxonomy` |
| `created_term` | New term created | `$term_id`, `$tt_id`, `$taxonomy` |
| `edited_term` | Term updated | `$term_id`, `$tt_id`, `$taxonomy` |
| `delete_term` | Term deleted | `$term_id`, `$tt_id`, `$taxonomy`, `$deleted_term` |

Example: notify when a post is tagged with "featured":

```json
{
  "type": "content_lifecycle",
  "event": "set_object_terms",
  "condition": "taxonomy == 'post_tag' AND terms CONTAINS 'featured'",
  "actions": [
    { "channel": "slack", "message": "Post tagged as featured: {{post_title}}" }
  ]
}
```

## Media Upload Events

| Hook | Fires When | Parameters |
|------|------------|------------|
| `add_attachment` | New media uploaded | `$attachment_id` |
| `edit_attachment` | Attachment metadata updated | `$attachment_id` |
| `delete_attachment` | Media file deleted | `$attachment_id` |
| `wp_handle_upload` | File upload processed | `$upload` array |

Example: log large file uploads:

```json
{
  "type": "content_lifecycle",
  "event": "add_attachment",
  "condition": "filesize > 5MB",
  "actions": [
    { "channel": "webhook", "url": "{{audit_webhook_url}}", "payload": { "event": "large_upload", "file": "{{filename}}", "size": "{{filesize}}" } }
  ]
}
```

## Example: Notify Slack When Blog Post Published

```json
{
  "name": "Blog Post Published Notification",
  "type": "content_lifecycle",
  "event": "draft_to_publish",
  "post_type": "post",
  "actions": [
    {
      "channel": "slack",
      "message": ":mega: *New blog post published!*\n*Title:* {{post_title}}\n*Author:* {{post_author}}\n*URL:* {{post_url}}",
      "channel_override": "#content-updates"
    }
  ],
  "status": "active"
}
```
