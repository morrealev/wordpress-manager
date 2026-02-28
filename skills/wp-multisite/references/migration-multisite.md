# Migration: Single-site to Multisite and Back

Migrating between single-site and multisite WordPress installations requires careful planning due to database structure differences.

## Single-site to Multisite

### Prerequisites
- WordPress installed at domain root (not a subdirectory)
- All plugins deactivated
- Permalink structure using "pretty permalinks" (not plain)
- Full database and file backup

### Procedure

1. **Backup**: Full database dump + wp-content directory
2. **Deactivate all plugins** via wp-admin or wp-cli
3. **Enable multisite**: Add `define('WP_ALLOW_MULTISITE', true);` to wp-config.php
4. **Network Setup**: Navigate to Tools > Network Setup, choose sub-directory or sub-domain
5. **Apply configuration**: Copy generated code to wp-config.php and .htaccess
6. **Re-login**: WordPress redirects to login — sign in as Super Admin
7. **Re-activate plugins**: One by one, test each plugin for multisite compatibility
8. **Verify**: Check permalink structure, media uploads, and user roles

### What Changes in the Database

| Component | Before | After |
|-----------|--------|-------|
| Tables | `wp_posts`, `wp_options`, ... | Same (become site 1) |
| New tables | — | `wp_blogs`, `wp_site`, `wp_sitemeta`, `wp_registration_log`, `wp_signups` |
| Options | `wp_options` | `wp_options` (site 1) + `wp_sitemeta` (network) |

## Multisite to Single-site

This migration is more complex because you need to extract one sub-site from the network.

### Procedure (extract sub-site)

1. **Backup**: Full database dump + wp-content directory
2. **Export content**: Use WordPress Export (Tools > Export) on the target sub-site
3. **Fresh WordPress install**: Install a clean single-site WordPress
4. **Import content**: Use WordPress Importer plugin
5. **Copy uploads**: Copy `wp-content/uploads/sites/{blog_id}/` to `wp-content/uploads/`
6. **Activate theme and plugins**: Install and activate the same theme and plugins
7. **Verify**: Check media URLs, internal links, shortcodes

### Alternative: Direct Database Extraction

For large sites where export/import is impractical:

1. Export tables with prefix `wp_{blog_id}_` (e.g., `wp_2_posts`, `wp_2_options`)
2. Rename tables to standard prefix (e.g., `wp_2_posts` → `wp_posts`)
3. Update `siteurl` and `home` in `wp_options`
4. Search-replace old URLs in content
5. Remove multisite constants from wp-config.php
6. Update .htaccess to standard WordPress rules

## WP-CLI Migration Commands

```bash
# Export single site from multisite
wp db export site-backup.sql --url=subsite.example.com

# Search-replace URLs after migration
wp search-replace 'subsite.example.com' 'newdomain.com' --all-tables

# Export content as WXR
wp export --url=subsite.example.com --dir=/tmp/exports/
```

## Tips and Gotchas

- **Media paths**: Multisite stores uploads in `uploads/sites/{blog_id}/`. After migration to single-site, media URLs need search-replace.
- **User roles**: Users may have different roles on different sub-sites. When extracting, only the target site's role assignments transfer.
- **Plugins**: Some plugins store network-wide options in `wp_sitemeta`. These are lost when extracting to single-site.
- **Test first**: Always perform migration on a staging environment before production.
- **Backup twice**: Keep backups of both the source (multisite) and target (single-site) before starting.
