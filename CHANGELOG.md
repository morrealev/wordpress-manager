# Changelog

All notable changes to the WordPress Manager plugin for Claude Code.

## [1.7.1] - 2026-02-28

### Changed
- README aggiornato per v1.7.0: tabella 8 agent con colonna "Paired Skill", collaboration patterns, 24 skill, version history

## [1.7.0] - 2026-02-28

### Added
- **`wp-test-engineer` agent** — WordPress testing specialist
  - Executes Playwright E2E, Jest unit, PHPUnit integration tests
  - Test environment setup (wp-env, dependency installation)
  - Failure debugging with trace/screenshot analysis
  - Coverage report generation and CI integration
  - Pairs with `wp-e2e-testing` skill

- **`wp-security-hardener` agent** — Security hardening and incident response
  - Implements filesystem hardening, HTTP security headers, authentication hardening
  - REST API restriction with namespace whitelisting
  - 5-phase incident response: containment → investigation → remediation → recovery → post-incident
  - Handoff protocol: receives findings from `wp-security-auditor`, returns remediation report
  - Pairs with `wp-security` skill

- **`wp-accessibility-auditor` agent** — WCAG 2.2 AA compliance auditor
  - Automated scanning via axe-core, pa11y, Lighthouse
  - Code review for ARIA patterns, heading hierarchy, form labels, landmarks
  - Keyboard navigation assessment and theme compliance check
  - Block editor accessibility verification
  - Read-only (audit only, no code modifications)
  - Pairs with `wp-accessibility` skill

### Changed
- **`wp-deployment-engineer`** upgraded (★★★ → ★★★★)
  - Added WP REST Bridge tools for post-deploy verification
  - Added Method 4: Deploy from Local Environment (Studio/LocalWP/wp-env export)
  - Added cross-references to `wp-local-env` and `wp-deploy` skills
  - Added WebSearch to tools list

- **`wp-security-auditor`** upgraded
  - Added "Handoff to Remediation" section linking to `wp-security-hardener`
  - Added `security_inspect.mjs` quick pre-scan instructions
  - Added cross-references to `wp-security` and `wp-audit` skills

- **`wp-performance-optimizer`** upgraded
  - Added MCP tool separation clarification (WP REST Bridge vs Hostinger MCP)
  - Added cross-references to `wp-performance` and `wp-audit` skills

- **`wp-content-strategist`** upgraded
  - Added Multilingual Content section with `wp-i18n` cross-reference
  - Added text domain usage guidance for translatable content

- **`wp-site-manager`** upgraded
  - Added Specialized Agents delegation table (all 8 agents referenced)

- **Router decision-tree.md** — added agent references for testing, security hardening, and accessibility routes
- **Skill cross-references** — added "Recommended Agent" to `wp-e2e-testing`, `wp-security`, `wp-accessibility` SKILL.md files
- Version bumps: plugin.json + package.json → 1.7.0 (24 skills, 8 agents)

## [1.6.0] - 2026-02-28

### Added
- **`wp-e2e-testing` skill** — WordPress testing strategy and tooling
  - 7 reference files: wp-env-setup, playwright-wordpress, jest-wordpress, phpunit-wordpress, visual-regression, test-data-generation, ci-integration
  - Detection script (`test_inspect.mjs`) — detects Playwright, Jest, PHPUnit, wp-env, CI config
  - Covers test strategy by project kind, E2E/unit/integration testing, visual regression, CI pipelines

- **`wp-security` skill** — WordPress security hardening and incident response
  - 7 reference files: filesystem-hardening, http-headers, authentication-hardening, api-restriction, user-capabilities, wp-config-security, incident-response
  - Detection script (`security_inspect.mjs`) — scans wp-config constants, file permissions, .htaccess, security plugins
  - 5-phase incident response procedure: containment → investigation → remediation → recovery → post-incident

- **`wp-i18n` skill** — WordPress internationalization and localization
  - 6 reference files: php-i18n, js-i18n, translation-workflow, wpcli-i18n, rtl-support, multilingual-setup
  - Detection script (`i18n_inspect.mjs`) — detects text domain, .pot/.po/.mo files, i18n function usage
  - Covers PHP gettext, @wordpress/i18n for JS, .pot/.po/.mo/.json workflow, RTL support, WPML/Polylang

- **`wp-accessibility` skill** — WordPress WCAG 2.2 accessibility compliance
  - 6 reference files: block-a11y, theme-a11y, interactive-a11y, media-a11y, a11y-audit-tools, a11y-testing
  - Covers block editor a11y, theme accessibility-ready requirements, interactive patterns (APG), media a11y, automated/manual testing

- **`wp-headless` skill** — Decoupled/headless WordPress architecture
  - 6 reference files: api-layer-choice, wpgraphql, headless-auth, cors-config, frontend-integration, webhooks
  - Detection script (`headless_inspect.mjs`) — detects WPGraphQL, CORS config, frontend frameworks
  - Covers REST API vs WPGraphQL decision, JWT auth, CORS, Next.js/Nuxt/Astro integration, ISR, content webhooks

### Changed
- **Router upgraded to v4** — added keyword routing for 5 new skills
  - Development routing: wp-e2e-testing, wp-i18n, wp-accessibility, wp-headless
  - Operations routing: wp-security (hardening and incident response)
- **Cross-references** added to 6 existing skills:
  - `wp-block-development` → wp-e2e-testing, wp-accessibility
  - `wp-plugin-development` → wp-e2e-testing, wp-i18n, wp-security
  - `wp-block-themes` → wp-accessibility
  - `wp-interactivity-api` → wp-accessibility
  - `wp-rest-api` → wp-headless
  - `wp-audit` → wp-security
- Version bumps: plugin.json + package.json → 1.6.0 (24 skills)

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
