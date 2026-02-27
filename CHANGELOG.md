# Changelog

All notable changes to the WordPress Manager plugin for Claude Code.

## [1.5.0] - 2026-02-27

### Added
- **`wp-local-env` skill** — Unified local WordPress development environment management
  - Cross-platform detection script (`detect_local_env.mjs`) for Studio, LocalWP, wp-env
  - 4 reference files: `studio-adapter.md`, `localwp-adapter.md`, `wpenv-adapter.md`, `mcp-adapter-setup.md`
  - 8 procedure sections: detection, lifecycle, WP-CLI, symlink dev workflow, REST API, database ops, version switching, preview/share
  - MCP Adapter integration guide (STDIO + HTTP transports)

### Changed
- **Router upgraded to v3** — three-category routing (development + local environment + operations)
  - `decision-tree.md` upgraded from v2 to v3 with Step 2c for local environment routing
  - Added local environment keywords and overlap resolution with dev/ops
  - Added local environment guardrails
- **`wp-wpcli-and-ops`** — Added local environment WP-CLI invocation methods (Studio/LocalWP/wp-env)
- **`wp-deploy`** — Added "Deploying from Local Environment" section with export instructions
- **`wp-playground`** — Added comparison table with `wp-local-env` and escalation paths
- Version bumps: plugin.json + package.json → 1.5.0

## [1.4.0] - 2026-02-27

### Added
- **13 development skills** integrated from [WordPress/agent-skills](https://github.com/WordPress/agent-skills) community repository (GPL-2.0-or-later):
  - `wordpress-router` — Unified task router (development + operations)
  - `wp-project-triage` — Auto-detect project type (plugin, theme, block theme, core)
  - `wp-block-development` — Gutenberg block creation (block.json, attributes, save/edit)
  - `wp-block-themes` — Block theme development (theme.json, templates, patterns)
  - `wp-plugin-development` — Plugin architecture (hooks, activation, Settings API)
  - `wp-rest-api` — REST endpoint development (register_rest_route, permissions)
  - `wp-interactivity-api` — Interactivity API (data-wp-* directives, viewScriptModule)
  - `wp-abilities-api` — Abilities API (wp_register_ability, capability management)
  - `wp-wpcli-and-ops` — WP-CLI usage (commands, scaffolding, wp-cli.yml)
  - `wp-phpstan` — Static analysis (PHPStan for WordPress)
  - `wp-performance` — Backend profiling (WP-CLI profile/doctor, query optimization)
  - `wp-playground` — WordPress Playground (disposable instances, blueprints, snapshots)
  - `wpds` — WordPress Design System (@wordpress/components, tokens, patterns)
- 70 reference files (total across all skills) and 7 detection/inspection scripts
- Unified decision tree v2 routing both development and operational tasks
- Dual-license documentation (MIT + GPL-2.0-or-later)

### Changed
- `wordpress-router` SKILL.md rewritten as unified router (dev + ops)
- `decision-tree.md` upgraded from v1 to v2 with operational routing
- README.md updated to reflect 18-skill architecture

## [1.3.0] - 2026-02-26

### Added
- E2E testing framework for all commands and agents
- Utility scripts: `health-check.sh`, `validate-wp-operation.sh`
- Command-based hooks: `pre-deploy-check.sh`, `backup-reminder.sh`
- WordPress.com MCP dual-mode support (self-hosted + WordPress.com)

## [1.2.0] - 2026-02-25

### Added
- 3 new slash commands: `wp-audit`, `wp-backup`, `wp-setup`
- 2 new skills: `wp-migrate` (cross-platform migration), `wp-backup` (backup/restore)
- Migration procedures for Hostinger, SSH, and cross-platform transfers

## [1.1.0] - 2026-02-24

### Added
- 3 new agents: `wp-content-strategist`, `wp-security-auditor`, `wp-performance-optimizer`
- 2 new skills: `wp-audit` (security/performance/SEO checklists), `wp-content` (content lifecycle)
- SEO optimization templates and content creation workflows

## [1.0.0] - 2026-02-23

### Added
- Initial plugin release
- 2 agents: `wp-site-manager`, `wp-deployment-engineer`
- 1 skill: `wp-deploy` (Hostinger + SSH deployment)
- 2 commands: `wp-status`, `wp-deploy`
- 4 prompt-based safety hooks (PreToolUse)
- 2 MCP servers: Hostinger MCP, WP REST Bridge (custom TypeScript)
- Multi-site support via `switch_site`, `list_sites`, `get_active_site`
