---
name: wp-status
description: Show the status of configured WordPress sites including connectivity, content counts, and active plugins.
---

# WordPress Status Check

Perform a comprehensive status check of the configured WordPress sites.

## Steps

1. **List configured sites**: Call `list_sites` and `get_active_site` via WP REST Bridge MCP
2. **For the active site** (or all sites if requested):
   - Call `discover_content_types` to verify API connectivity
   - Call `list_content` for posts with `per_page: 1` to get recent activity
   - Call `list_content` for pages with `per_page: 1`
   - Call `list_plugins` to show active plugins
3. **If Hostinger-hosted**: Call `hosting_listWebsites` for infrastructure status
4. **Present a summary table** with:
   - Site name and URL
   - API status (connected/error)
   - Content counts (posts, pages)
   - Active plugins count
   - Last content update date

Keep the output concise and actionable. Flag any issues found.
