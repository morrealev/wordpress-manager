---
name: wp-multisite
description: |
  This skill should be used when the user asks about "multisite", "network admin",
  "sub-sites", "domain mapping", "super admin", "network activate",
  "WordPress Multisite network", or any multisite network management operations.
version: 1.0.0
---

## Overview

WordPress Multisite network management via WP-CLI (10 MCP tools). Covers sub-site CRUD, network plugin management, Super Admin listing, network settings, and domain mapping guidance. Uses a hybrid approach: REST API where available, WP-CLI for network-only operations.

## When to Use

- User mentions multisite, network, sub-sites, or domain mapping
- User needs to create, activate, deactivate, or delete sub-sites
- User wants to network-activate or network-deactivate plugins
- User needs Super Admin listing or network settings
- User asks about migrating single-site to multisite or vice versa

## Prerequisites

WP-CLI access and multisite flag must be configured in `WP_SITES_CONFIG`:

```json
{
  "id": "mynetwork",
  "url": "https://network.example.com",
  "username": "superadmin",
  "password": "xxxx xxxx xxxx xxxx",
  "wp_path": "/var/www/wordpress",
  "ssh_host": "network.example.com",
  "ssh_user": "deploy",
  "ssh_key": "~/.ssh/id_rsa",
  "is_multisite": true
}
```

- `wp_path` — required for all wp-cli operations
- `ssh_host` / `ssh_user` — required for remote sites (omit for local)
- `is_multisite: true` — required flag to enable ms_* tools

## Detection

Run the detection script to check multisite presence:

```bash
node skills/wp-multisite/scripts/multisite_inspect.mjs
```

## Multisite Operations Decision Tree

1. **Sub-site management?**
   - List all sub-sites → `ms_list_sites`
   - Get sub-site details → `ms_get_site`
   - Create new sub-site → `ms_create_site`
   - Activate/deactivate → `ms_activate_site`
   - Delete sub-site → `ms_delete_site`

2. **Network plugin management?**
   - List all plugins (with network status) → `ms_list_network_plugins`
   - Network-activate plugin → `ms_network_activate_plugin`
   - Network-deactivate plugin → `ms_network_deactivate_plugin`

3. **Network administration?**
   - List Super Admins → `ms_list_super_admins`
   - Get network settings → `ms_get_network_settings`

4. **Domain mapping / network setup / migration?**
   - See reference files below (no dedicated MCP tool — use wp-cli via Bash)

## Recommended Agent

For complex multi-step multisite operations, use the `wp-site-manager` agent (which has a dedicated Multisite Network Management section).

## Additional Resources

### Reference Files

- **`references/network-setup.md`** — Sub-directory vs sub-domain, wp-config constants, installation
- **`references/site-management.md`** — CRUD sub-sites, templates, bulk operations
- **`references/domain-mapping.md`** — Custom domains, SSL, DNS CNAME, sunrise.php
- **`references/network-plugins.md`** — Network-activated vs per-site plugins, must-use plugins
- **`references/user-roles.md`** — Super Admin capabilities, site-level roles
- **`references/migration-multisite.md`** — Single to multisite and back, database tables

### Related Skills

- `wp-wpcli-and-ops` — WP-CLI command reference and multisite flags
- `wp-security` — Super Admin capabilities and multisite security
- `wp-deploy` — Deploy to multisite network
- `wp-multilang-network` — Multi-language network orchestration (hreflang, content sync, international SEO)
