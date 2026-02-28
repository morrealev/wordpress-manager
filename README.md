# WordPress Manager Plugin for Claude Code

Unified WordPress management **and** development plugin that orchestrates multiple MCP servers, specialized agents, and knowledge-rich skills to manage self-hosted WordPress sites, Hostinger infrastructure, and guide WordPress development — all from Claude Code.

## Architecture

```
wordpress-manager/
├── .claude-plugin/plugin.json    # Plugin manifest (v1.7.0)
├── .mcp.json                     # MCP server definitions
├── agents/                       # 8 specialized agents
├── commands/                     # 5 slash commands
├── skills/                       # 24 skills (5 operational + 18 development + 1 local env)
├── hooks/hooks.json              # 6 safety hooks (PreToolUse)
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

| Agent | Color | Role | Paired Skill |
|-------|-------|------|-------------|
| `wp-site-manager` | cyan | Central orchestrator for multi-site operations, status monitoring, diagnostics | — |
| `wp-deployment-engineer` | green | Deploy workflows: Hostinger MCP, SSH, local env export, post-deploy verification | `wp-deploy` |
| `wp-content-strategist` | magenta | Content creation, SEO optimization, taxonomy management, multilingual content | `wp-content` |
| `wp-security-auditor` | red | Security audits: plugin vulnerabilities, user accounts, SSL, DNS (read-only) | `wp-audit` |
| `wp-security-hardener` | red | Security hardening and incident response (implements fixes from auditor) | `wp-security` |
| `wp-performance-optimizer` | yellow | Performance audits: Core Web Vitals, caching, media optimization, TTFB | `wp-performance` |
| `wp-test-engineer` | blue | Test execution: Playwright E2E, Jest unit, PHPUnit, debug failures, CI setup | `wp-e2e-testing` |
| `wp-accessibility-auditor` | purple | WCAG 2.2 AA compliance audits: axe-core, pa11y, Lighthouse, code review (read-only) | `wp-accessibility` |

**Agent collaboration patterns:**
- **Audit → Fix**: `wp-security-auditor` (finds issues) → `wp-security-hardener` (implements fixes)
- **Delegation**: `wp-site-manager` delegates to specialized agents via its Specialized Agents table

## Commands

| Command | Description |
|---------|-------------|
| `/wordpress-manager:wp-status` | Quick health check of a WordPress site |
| `/wordpress-manager:wp-deploy` | Deploy changes to a WordPress site |
| `/wordpress-manager:wp-audit` | Run security, performance, or SEO audit |
| `/wordpress-manager:wp-backup` | Create, list, or restore site backups |
| `/wordpress-manager:wp-setup` | Onboard a new WordPress site |

## Skills

### Operational Skills (5) — managing live WordPress sites

| Skill | Trigger Phrases | Reference Files |
|-------|----------------|-----------------|
| `wp-deploy` | "deploy", "push to production", "update site" | hostinger-deploy.md, ssh-deploy.md |
| `wp-audit` | "audit my site", "security check", "performance test" | security-checklist.md, performance-checklist.md, seo-checklist.md |
| `wp-content` | "create blog post", "manage content", "SEO" | content-templates.md, seo-optimization.md |
| `wp-migrate` | "migrate my site", "move to Hostinger", "transfer" | hostinger-migration.md, cross-platform.md |
| `wp-backup` | "backup my site", "create backup", "restore" | backup-strategies.md, restore-procedures.md |

### Local Environment Skill (1) — managing local WordPress dev environments

| Skill | Purpose | Key References |
|-------|---------|----------------|
| `wp-local-env` | Unified local env management: Studio, LocalWP, wp-env detection, lifecycle, WP-CLI, symlinks, DB ops | studio-adapter.md, localwp-adapter.md, wpenv-adapter.md, mcp-adapter-setup.md |

### Development Skills (18) — building WordPress projects

13 core skills integrated from [WordPress/agent-skills](https://github.com/WordPress/agent-skills) (GPL-2.0-or-later), plus 5 extended skills (testing, security, i18n, accessibility, headless).

| Skill | Purpose | Key References |
|-------|---------|----------------|
| `wordpress-router` | Unified router v4: classifies tasks (dev vs local env vs ops) and routes to correct skill/agent | decision-tree.md |
| `wp-project-triage` | Auto-detects project type (plugin, theme, block theme, core) | detect_wp_project.mjs, triage.schema.json |
| `wp-block-development` | Gutenberg block creation: block.json, attributes, save, edit | 10 references, list_blocks.mjs |
| `wp-block-themes` | Block theme development: theme.json, templates, patterns | 6 references, detect_block_themes.mjs |
| `wp-plugin-development` | Plugin architecture: hooks, activation, Settings API, admin pages | 6 references, detect_plugins.mjs |
| `wp-rest-api` | REST endpoint development: register_rest_route, permissions | 6 references |
| `wp-interactivity-api` | Interactivity API: data-wp-* directives, viewScriptModule | 3 references |
| `wp-abilities-api` | Abilities API: wp_register_ability, capability management | 2 references |
| `wp-wpcli-and-ops` | WP-CLI usage: commands, wp-cli.yml, scaffolding | 7 references, wpcli_inspect.mjs |
| `wp-phpstan` | Static analysis: PHPStan for WordPress, phpstan.neon | 3 references, phpstan_inspect.mjs |
| `wp-performance` | Backend profiling: WP-CLI profile/doctor, query optimization | 10 references, perf_inspect.mjs |
| `wp-playground` | WordPress Playground: disposable instances, blueprints, snapshots | 3 references |
| `wpds` | WordPress Design System: @wordpress/components, tokens, patterns | Requires WPDS MCP server |
| `wp-e2e-testing` | Testing strategy: Playwright E2E, Jest, PHPUnit, visual regression, CI | 7 references, test_inspect.mjs |
| `wp-security` | Security hardening: filesystem, headers, auth, API restriction, incident response | 7 references, security_inspect.mjs |
| `wp-i18n` | Internationalization: PHP/JS gettext, .pot/.po/.mo workflow, RTL, WPML/Polylang | 6 references, i18n_inspect.mjs |
| `wp-accessibility` | WCAG 2.2 compliance: block a11y, theme a11y, interactive patterns, testing | 6 references |
| `wp-headless` | Headless/decoupled: REST vs WPGraphQL, JWT auth, CORS, Next.js/Nuxt/Astro | 6 references, headless_inspect.mjs |

## Safety Hooks

Six `PreToolUse` hooks protect against accidental destructive operations:

**Prompt-based (LLM validation):**
1. **Content Deletion** - Confirms before `delete_content`, `delete_media`, `delete_user`, `delete_term`
2. **Plugin Deactivation** - Confirms before `deactivate_plugin` (dependency risk)
3. **WordPress Import** - Confirms before `hosting_importWordpressWebsite` (overwrites site)
4. **DNS Changes** - Confirms before `DNS_updateDNSRecordsV1`, `DNS_resetDNSRecordsV1`

**Command-based (script validation):**
5. **Pre-deploy Check** - `pre-deploy-check.sh` validates site reachability and auth before deploy tools
6. **Backup Reminder** - `backup-reminder.sh` advisory reminder before import operations

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

### 5. Verify Setup

Run the health check script to validate all connections:
```bash
source ~/.claude/mcp-secrets.env
bash ~/.claude/plugins/local/wordpress-manager/scripts/health-check.sh
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
| 1.3.0 | Phase 4 | E2E testing, utility scripts, command hooks, WordPress.com dual-mode support |
| 1.4.0 | Phase 5 | +13 development skills from WordPress/agent-skills community repo (blocks, themes, plugins, REST API, Interactivity API, Abilities API, WP-CLI, PHPStan, Performance, Playground, WPDS, Router, Triage) |
| 1.5.0 | Phase 6 | +1 local environment skill (`wp-local-env`): WordPress Studio, LocalWP, wp-env detection, unified management, router v3 |
| 1.6.0 | Phase 7 | +5 development skills (testing, security, i18n, accessibility, headless), router v4, cross-references |
| 1.7.0 | Phase 8 | +3 agents (test-engineer, security-hardener, accessibility-auditor), 5 agent upgrades, bidirectional cross-refs, audit→fix handoff chain |

## License

MIT — Original plugin code.
GPL-2.0-or-later — Development skills integrated from [WordPress/agent-skills](https://github.com/WordPress/agent-skills).
