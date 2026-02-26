---
name: wp-status
description: Show the status of configured WordPress sites including connectivity, content counts, active plugins, SSL certificate health, and Hostinger infrastructure diagnostics.
---

# WordPress Status Check

Perform a comprehensive status check of the configured WordPress sites.

## Steps

1. **List configured sites**: Call `list_sites` and `get_active_site` via WP REST Bridge MCP
2. **For the active site** (or all sites if requested):
   - Call `discover_content_types` to verify API connectivity
   - Call `list_content` for posts with `per_page: 1` to get recent activity
   - Call `list_content` for pages with `per_page: 1`
   - Call `list_plugins` to show active plugins count and list active ones
   - Call `list_users` with `per_page: 1` to verify user access
3. **SSL Certificate Check**: Use Bash to run:
   ```bash
   echo | openssl s_client -servername <domain> -connect <domain>:443 2>/dev/null | openssl x509 -noout -enddate
   ```
   Report days remaining. Flag if < 30 days.
4. **Hostinger Infrastructure Diagnostics**:
   - Call `hosting_listWebsites` via Hostinger MCP
   - If HTTP 530 response: report "Site Frozen — subscription may be expired, check hostinger.com"
   - If successful: report hosting plan, PHP version, server location
   - Call DNS tools if domain diagnostics are needed
5. **Present a summary table** with:
   - Site name and URL
   - WP REST API status (connected/error)
   - Hostinger API status (active/frozen/unavailable)
   - SSL certificate expiry (days remaining)
   - Content counts (posts, pages)
   - Active plugins count
   - Last content update date

## Hostinger Status Codes Reference

| HTTP Code | Meaning | Action |
|-----------|---------|--------|
| 200 | OK | Hostinger API functional |
| 401 | Unauthorized | Token expired or invalid — regenerate at hostinger.com/my-api |
| 403 | Forbidden | Token lacks required scopes |
| 530 | Site Frozen | Subscription expired or account suspended — check billing |
| 5xx | Server Error | Hostinger infrastructure issue — retry later |

## Output Format

Keep the output concise and actionable. Flag any issues found with severity:
- **CRITICAL**: Site unreachable, SSL expired, authentication failed
- **WARNING**: SSL expiring < 30 days, Hostinger frozen, high plugin count (> 20)
- **INFO**: Everything healthy, routine status
