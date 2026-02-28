# Network Plugins and Themes

In WordPress Multisite, plugins and themes can be managed at the network level (Super Admin) or at the individual site level (Site Admin). Understanding the activation modes prevents conflicts.

## MCP Tools

| Tool | Usage |
|------|-------|
| `ms_list_network_plugins` | List all plugins with network activation status |
| `ms_network_activate_plugin` | Activate a plugin across the entire network |
| `ms_network_deactivate_plugin` | Deactivate a plugin from the entire network |

## Plugin Activation Modes

| Mode | Who Controls | Scope | Use Case |
|------|-------------|-------|----------|
| Network-activated | Super Admin | All sites | Security plugins, caching, essential functionality |
| Per-site activated | Site Admin | One site | Site-specific features |
| Must-use (mu-plugins) | Developer | All sites, always on | Core business logic, cannot be deactivated |

## Procedures

### Network-Activate a Plugin

1. `ms_network_activate_plugin` with the plugin slug
2. The plugin immediately activates on ALL sub-sites
3. Site Admins cannot deactivate a network-activated plugin

### Network-Deactivate a Plugin

1. `ms_network_deactivate_plugin` with the plugin slug
2. The plugin deactivates on ALL sub-sites simultaneously
3. Per-site activation state is lost

### Check Plugin Status

1. `ms_list_network_plugins` — returns all plugins with their status
2. Look for `network_only: true` in the response for network-activated plugins

## Theme Management

Themes in multisite work differently from plugins:

| Action | Level | Effect |
|--------|-------|--------|
| Network Enable | Super Admin | Theme becomes available for site admins to activate |
| Network Disable | Super Admin | Theme removed from site admin's theme list |
| Activate | Site Admin | Theme becomes active for that specific site |

A theme must be **network-enabled** before any site admin can use it.

## Must-Use Plugins

- Location: `wp-content/mu-plugins/`
- Always active on ALL sites — cannot be deactivated via UI
- Loaded before regular plugins
- No activation hooks (code runs immediately)
- Useful for: custom login, security rules, performance optimizations

## Tips and Gotchas

- **Network activation is immediate**: No confirmation dialog. All sites are affected instantly.
- **Plugin conflicts**: A network-activated plugin may conflict with per-site plugins. Test thoroughly.
- **Updates**: Plugin updates on multisite affect all sites. Test in staging first.
- **Memory**: Each network-activated plugin increases memory usage across all sites.
- **Drop-in replacements**: `object-cache.php`, `advanced-cache.php`, `db.php` are shared across all sites.
