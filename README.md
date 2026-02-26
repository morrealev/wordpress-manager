# WordPress Manager Plugin for Claude Code

Unified WordPress management plugin that orchestrates multiple MCP servers, specialized agents, and knowledge-rich skills to manage self-hosted WordPress sites and Hostinger infrastructure from Claude Code.

## Architecture

```
wordpress-manager/
├── .claude-plugin/plugin.json    # Plugin manifest
├── .mcp.json                     # MCP server definitions
├── agents/                       # 5 specialized agents
├── commands/                     # 5 slash commands
├── skills/                       # 5 skills with reference libraries
├── hooks/hooks.json              # 4 safety hooks (PreToolUse)
└── servers/wp-rest-bridge/       # Custom MCP server (TypeScript)
```

## MCP Servers

### Hostinger MCP (`hostinger-mcp`)
- **Source**: `hostinger-api-mcp@latest` (npm)
- **Auth**: `HOSTINGER_API_TOKEN` environment variable
- **Capabilities**: 119 tools covering hosting, DNS, SSL, email, VPS, domains
- **Use**: Infrastructure management, DNS updates, SSL certificates, site imports

### WP REST Bridge (`wp-rest-bridge`)
- **Source**: Custom TypeScript MCP server bundled in `servers/wp-rest-bridge/`
- **Auth**: `WP_SITES_CONFIG` JSON env var with per-site credentials
- **Capabilities**: 40+ tools for content, media, taxonomies, plugins, users, comments
- **Use**: Content CRUD, plugin management, user administration, media uploads
- **Multi-site**: Supports multiple sites via `switch_site`, `list_sites`, `get_active_site`

### WordPress.com MCP (External)
- **Source**: Built-in Claude Code integration (claude.ai)
- **Use**: WordPress.com hosted sites (content authoring, site settings, editor context)

## Agents

| Agent | Color | Role |
|-------|-------|------|
| `wp-site-manager` | cyan | Central orchestrator for multi-site operations, status monitoring, diagnostics |
| `wp-deployment-engineer` | green | Deploy workflows: file upload, plugin updates, database migrations, DNS |
| `wp-content-strategist` | magenta | Content creation, SEO optimization, taxonomy management, editorial workflow |
| `wp-security-auditor` | red | Security audits: plugin vulnerabilities, user accounts, SSL, hardening |
| `wp-performance-optimizer` | yellow | Performance audits: Core Web Vitals, caching, media optimization, TTFB |

## Commands

| Command | Description |
|---------|-------------|
| `/wordpress-manager:wp-status` | Quick health check of a WordPress site |
| `/wordpress-manager:wp-deploy` | Deploy changes to a WordPress site |
| `/wordpress-manager:wp-audit` | Run security, performance, or SEO audit |
| `/wordpress-manager:wp-backup` | Create, list, or restore site backups |
| `/wordpress-manager:wp-setup` | Onboard a new WordPress site |

## Skills

| Skill | Trigger Phrases | Reference Files |
|-------|----------------|-----------------|
| `wp-deploy` | "deploy", "push to production", "update site" | hostinger-deploy.md, ssh-deploy.md |
| `wp-audit` | "audit my site", "security check", "performance test" | security-checklist.md, performance-checklist.md, seo-checklist.md |
| `wp-content` | "create blog post", "manage content", "SEO" | content-templates.md, seo-optimization.md |
| `wp-migrate` | "migrate my site", "move to Hostinger", "transfer" | hostinger-migration.md, cross-platform.md |
| `wp-backup` | "backup my site", "create backup", "restore" | backup-strategies.md, restore-procedures.md |

## Safety Hooks

Four `PreToolUse` prompt-based hooks protect against accidental destructive operations:

1. **Content Deletion** - Confirms before `delete_content`, `delete_media`, `delete_user`, `delete_term`
2. **Plugin Deactivation** - Confirms before `deactivate_plugin` (dependency risk)
3. **WordPress Import** - Confirms before `hosting_importWordpressWebsite` (overwrites site)
4. **DNS Changes** - Confirms before `DNS_updateDNSRecordsV1`, `DNS_resetDNSRecordsV1`

## Setup

### 1. Enable the Plugin

The plugin is registered as a local plugin in `~/.claude/settings.json`:
```json
{
  "enabledPlugins": {
    "wordpress-manager@local": true
  }
}
```

### 2. Configure Hostinger API Token

Generate a token at [Hostinger API Dashboard](https://www.hostinger.com/my-api) and add it to your environment:
```bash
export HOSTINGER_API_TOKEN="your-api-token"
```

### 3. Configure WordPress Sites

Set `WP_SITES_CONFIG` as a JSON string with your site credentials:
```bash
export WP_SITES_CONFIG='[
  {
    "id": "mysite",
    "url": "https://mysite.com",
    "username": "admin",
    "password": "xxxx xxxx xxxx xxxx"
  }
]'
export WP_DEFAULT_SITE="mysite"
```

**Password**: Use a WordPress Application Password (Users > Profile > Application Passwords), not the account password.

### 4. Build the WP REST Bridge

```bash
cd ~/.claude/plugins/local/wordpress-manager/servers/wp-rest-bridge
npm install
npx tsc
```

## Tool Inventory

| Server | Tools | Categories |
|--------|-------|------------|
| hostinger-mcp | 119 | Hosting, DNS, SSL, Email, VPS, Domains, Billing |
| wp-rest-bridge | 40+ | Content (CRUD), Taxonomies, Media, Plugins, Users, Comments, Site Meta |
| WordPress.com (external) | ~15 | Content Authoring, Site Settings, Editor Context |

**Total**: ~175 tools available through the unified plugin interface.

## Development

### Project Structure

```
servers/wp-rest-bridge/src/
├── server.ts              # MCP server entry point (StdioServerTransport)
├── wordpress.ts           # Axios-based WP REST API client (multi-site Map)
├── types.ts               # Zod schemas + TypeScript types
└── tools/
    ├── index.ts            # Tool registry (switch_site, list_sites, get_active_site)
    ├── unified-content.ts  # CRUD for posts, pages, custom post types
    ├── unified-taxonomies.ts # Categories, tags, custom taxonomies
    ├── media.ts            # Upload, list, update, delete media
    ├── plugins.ts          # List, activate, deactivate, search plugins
    ├── users.ts            # User CRUD + role management
    ├── comments.ts         # Comment moderation + CRUD
    └── plugin-repository.ts # Search wordpress.org plugin directory
```

### Build

```bash
cd servers/wp-rest-bridge
npx tsc              # Compile TypeScript to build/
```

### Dependencies

- `@modelcontextprotocol/sdk` ^1.27.1
- `axios` ^1.7.9
- `zod` ^3.24.1
- TypeScript 5.7+, Node.js 18+

## Version History

| Version | Phase | What Changed |
|---------|-------|-------------|
| 1.0.0 | Phase 1 | Core plugin: 2 agents, 1 skill, 2 commands, 4 hooks, 2 MCP servers |
| 1.1.0 | Phase 2 | +3 agents (content, security, performance), +2 skills (audit, content) |
| 1.2.0 | Phase 3 | +3 commands (audit, backup, setup), +2 skills (migrate, backup) |

## License

MIT
