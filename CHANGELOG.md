# Changelog

All notable changes to the WordPress Manager plugin for Claude Code.

## [2.1.0] - 2026-02-28

### Added
- **WordPress monitoring support** — new skill and agent for ongoing site observability
- **New skill**: `wp-monitoring` with 6 reference files (uptime checks, performance baseline, security scanning, content integrity, alerting strategies, reporting templates)
- **New agent**: `wp-monitoring-agent` (color: teal) — read-only monitoring, health reports, anomaly detection, baseline comparison
- **Detection script**: `monitoring_inspect.mjs` — detects existing monitoring setup (uptime, performance, security, logging, content integrity)

### Changed
- Router decision-tree.md upgraded to v8 with monitoring keywords and routing
- `wp-audit` skill: added monitoring cross-reference
- `wp-security-auditor` agent: added periodic scanning cross-reference to wp-monitoring
- `wp-performance-optimizer` agent: added trend tracking cross-reference to wp-monitoring
- `wp-site-manager` agent: added monitoring delegation row
- Plugin now has 11 agents and 28 skills

## [2.0.0] - 2026-02-28

### Added
- **CI/CD support** — new skill and agent for WordPress pipeline automation
- **New skill**: `wp-cicd` with 7 reference files (GitHub Actions, GitLab CI, Bitbucket Pipelines, wp-env CI, deploy strategies, secrets management, quality gates)
- **New agent**: `wp-cicd-engineer` (color: cyan) — pipeline generation, quality gates, deploy automation, CI troubleshooting
- **Detection script**: `cicd_inspect.mjs` — detects CI platforms, quality tools, wp-env readiness

### Changed
- Router decision-tree.md upgraded to v7 with CI/CD keywords and routing
- `wp-e2e-testing`, `wp-deploy`, `wp-phpstan` skills: added CI/CD cross-references
- `wp-site-manager` agent: added CI/CD delegation row
- Plugin now has 10 agents and 27 skills

## [1.9.0] - 2026-02-28

### Added
- **WordPress Multisite support** — 10 new MCP tools for network management
- **WP-CLI execution module** (`wpcli.ts`) — local and SSH remote command execution
- **New skill**: `wp-multisite` with 6 reference files (network setup, site management, domain mapping, network plugins, user roles, migration)
- **Detection script**: `multisite_inspect.mjs` — detects multisite configuration
- **SiteConfig extended**: `wp_path`, `ssh_host`, `ssh_user`, `ssh_key`, `ssh_port`, `is_multisite` fields

### New MCP Tools (10)
- `ms_list_sites` — List all sub-sites in the network
- `ms_get_site` — Get sub-site details
- `ms_create_site` — Create a new sub-site
- `ms_activate_site` — Activate or deactivate a sub-site
- `ms_delete_site` — Delete a sub-site (with safety gate)
- `ms_list_network_plugins` — List plugins with network activation status (REST)
- `ms_network_activate_plugin` — Network-activate a plugin (wp-cli)
- `ms_network_deactivate_plugin` — Network-deactivate a plugin (wp-cli)
- `ms_list_super_admins` — List Super Admin users (wp-cli)
- `ms_get_network_settings` — Get network-wide settings (wp-cli)

### Changed
- `wp-site-manager` agent: added Multisite Network Management section
- Router decision-tree.md upgraded to v6 with multisite keywords
- `wp-wpcli-and-ops` and `wp-security` skills: added multisite cross-references
- WP REST Bridge: 71 → 81 total tools

## [1.8.0] - 2026-02-28

### Added
- **WooCommerce support** — 30 new MCP tools via WP REST Bridge (`wc/v3` namespace)
  - `wc-products.ts` (7 tools): CRUD products, categories, variations
  - `wc-orders.ts` (6 tools): List, get, update status, notes, refunds
  - `wc-customers.ts` (4 tools): List, get, create, update customers
  - `wc-coupons.ts` (4 tools): CRUD coupons with discount rules
  - `wc-reports.ts` (5 tools): Sales, top sellers, order/product/customer totals
  - `wc-settings.ts` (4 tools): Payment gateways, shipping zones, tax classes, system status
- **`wp-woocommerce` skill** — WooCommerce operations with decision tree and 8 reference files
  - Reference files: product-management, order-workflow, analytics-reports, coupon-marketing, shipping-setup, payment-gateways, tax-configuration, wc-extensions
- **`wp-ecommerce-manager` agent** — WooCommerce store management (color: orange)
  - 5 procedures: product catalog, order processing, sales analytics, coupon campaigns, store health
  - Report template with KPIs and recommendations
- **`woocommerce_inspect.mjs`** detection script — scans for WC plugin, hooks, composer deps, API config
- WooCommerce authentication: Consumer Key/Secret via separate AxiosInstance in WP REST Bridge
  - `SiteConfig` extended with optional `wc_consumer_key`/`wc_consumer_secret`
  - `makeWooCommerceRequest()` reusing existing retry and concurrency logic
- WC types: `WCProduct`, `WCOrder`, `WCCustomer`, `WCCoupon` in types.ts

### Changed
- Router upgraded to v5 — WooCommerce keywords in Step 0 + Step 2b routing entry
- `wp-site-manager` agent — added `wp-ecommerce-manager` to delegation table
- Cross-references added to `wp-audit`, `wp-deploy`, `wp-backup` skills
- WP REST Bridge: 41 → 71 total tools
- Version bumps: plugin.json + package.json → 1.8.0 (25 skills, 9 agents)

## [1.7.2] - 2026-02-28

### Changed
- GUIDE.md aggiornata per v1.7.1: 8 agent, 24 skill, 12 scenari d'uso, router v4, 5 skill estese, cross-ref bidirezionali, 10 nuovi termini glossario (+273 righe)

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
