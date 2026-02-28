# Site Management

Sub-site lifecycle in a WordPress Multisite network: creating, configuring, activating/deactivating, and deleting sites.

## MCP Tools

| Tool | Usage |
|------|-------|
| `ms_list_sites` | List all sub-sites with status |
| `ms_get_site` | Get details of a specific sub-site |
| `ms_create_site` | Create a new sub-site |
| `ms_activate_site` | Activate or deactivate a sub-site |
| `ms_delete_site` | Permanently delete a sub-site |

## Sub-site Lifecycle

```
Create → Active → [Deactivate → Archived/Spam/Deleted]
                 → [Delete permanently]
```

## Common Procedures

### List All Sub-sites

1. `ms_list_sites` — returns blog_id, url, registered date, status for all sites
2. Review the `archived`, `spam`, `deleted` flags for each

### Create a New Sub-site

1. `ms_create_site` with slug, title, admin email
2. WordPress creates the sub-site with default theme and plugins
3. The specified email becomes the sub-site admin

### Deactivate a Sub-site

1. `ms_activate_site` with `active: false` and the target blog_id
2. Deactivated sites return a "This site has been archived" message to visitors
3. Content and settings are preserved

### Delete a Sub-site

1. `ms_delete_site` with blog_id and `confirm: true`
2. **Permanent**: removes all content, settings, and uploads for that sub-site
3. Database tables for the sub-site are dropped

## Site Properties

| Property | Description |
|----------|-------------|
| `blog_id` | Unique numeric identifier |
| `domain` | Domain name of the sub-site |
| `path` | URL path (e.g., `/blog/` in sub-directory mode) |
| `registered` | Creation timestamp |
| `last_updated` | Last modification timestamp |
| `public` | Whether the site appears in search results |
| `archived` | Manually archived by network admin |
| `spam` | Marked as spam |
| `deleted` | Soft-deleted (not permanently removed) |

## Tips and Gotchas

- **Blog ID 1**: The main site always has `blog_id: 1`. Do not delete it.
- **Uploads**: Each sub-site has its own uploads directory under `wp-content/uploads/sites/{blog_id}/`.
- **Database tables**: Each sub-site gets its own set of tables with prefix `wp_{blog_id}_` (e.g., `wp_2_posts`, `wp_2_options`).
- **Default content**: New sub-sites get a "Hello World" post and sample page, similar to a fresh WordPress install.
- **Themes**: Sub-sites can only use themes that are network-enabled or network-activated. See `network-plugins.md`.
