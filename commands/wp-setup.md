---
name: wp-setup
description: Configure a new WordPress site for management via the wordpress-manager plugin. Guides through API access, credentials, and initial status check.
---

# WordPress Site Setup

Add and configure a new WordPress site for management through Claude Code.

## Usage

- `/wordpress-manager:wp-setup` — Interactive setup wizard
- `/wordpress-manager:wp-setup <site-url>` — Setup a specific site

## Process

### Step 1: Gather Site Information
Ask the user for:
- **Site URL**: The WordPress site's base URL (e.g., `https://opencactus.com`)
- **Site ID**: A short identifier for multi-site switching (e.g., `opencactus`)
- **Admin username**: WordPress admin email or username
- **Application password**: Generated from WordPress Admin → Users → Profile → Application Passwords
- **Hosting provider**: Hostinger / other (determines available tools)

### Step 2: Configure Credentials
1. Read current `~/.claude/mcp-secrets.env`
2. Parse existing `WP_SITES_CONFIG` JSON array
3. Add new site entry:
   ```json
   {"id": "site-id", "url": "https://site-url.com", "username": "user", "password": "app-password"}
   ```
4. Update `WP_SITES_CONFIG` in `mcp-secrets.env`
5. Optionally update `WP_DEFAULT_SITE`

### Step 3: Verify Connectivity
1. Restart wp-rest-bridge MCP server (or instruct user to restart Claude Code session)
2. Use `switch_site` to the new site
3. Use `discover_content_types` to verify API access
4. Use `list_content` with `per_page: 1` to confirm data retrieval
5. Use `list_plugins` to verify admin-level access

### Step 4: Configure Hostinger (if applicable)
If the site is Hostinger-hosted:
1. Verify `HOSTINGER_API_TOKEN` is set in `mcp-secrets.env`
2. Test with `hosting_listWebsites` to confirm site appears
3. Note Hostinger-specific capabilities (deploy, DNS, etc.)

### Step 5: Run Initial Status Check
Execute the equivalent of `/wordpress-manager:wp-status` on the new site to establish a baseline.

### Step 6: Report
Present a summary:
- Site ID and URL
- API connectivity status
- Content counts (posts, pages)
- Active plugins count
- Hosting type and available capabilities

## Prerequisites

Before running setup, the user needs:
1. WordPress admin access to generate an Application Password
2. The site's REST API enabled (default in WordPress 4.7+)
3. If Hostinger: API token from Hostinger panel
