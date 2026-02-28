# Router decision tree (v6 — development + local environment + operations + multisite)

This routing guide covers WordPress **development**, **local environment**, and **operations** workflows.

## Step 0: determine task category

Before repo triage, classify the user’s intent:

- **Development** (modifying code) → proceed to Step 1
- **Local Environment** (managing local dev sites) → skip to Step 2c
- **Operations** (managing live sites) → skip to Step 2b

Keywords that indicate **local environment**:
local site, Studio, LocalWP, Local by Flywheel, wp-env, local WordPress, start site, stop site, create local site, local development, symlink plugin, local database, switch PHP version, localhost, local preview, detect environment, WASM, SQLite local

Keywords that indicate **operations**:
deploy, push to production, audit, security check, backup, restore, migrate, move site, create post, manage content, site status, check plugins, performance check, SEO audit, WooCommerce, prodotto, ordine, coupon, negozio, catalogo, inventario, vendite, carrello, multisite, network, sub-site, sub-sito, domain mapping, super admin, network activate

Keywords that indicate **development**:
create block, block.json, theme.json, register_rest_route, plugin development, hooks, PHPStan, build, test, scaffold, i18n, translation, accessibility, a11y, headless, decoupled, WPGraphQL

## Step 1: classify repo kind (from triage — development only)

Run `wp-project-triage` first, then use `triage.project.kind`:

- `wp-core` → WordPress core checkout work.
- `wp-site` → full site repo (wp-content present).
- `wp-block-theme` → theme.json/templates/patterns workflows.
- `wp-theme` → classic theme workflows.
- `wp-block-plugin` → Gutenberg block development in a plugin.
- `wp-plugin` / `wp-mu-plugin` → plugin workflows.
- `gutenberg` → Gutenberg monorepo workflows.

Priority: `gutenberg` > `wp-core` > `wp-site` > `wp-block-theme` > `wp-block-plugin` > `wp-theme` > `wp-plugin`.

## Step 2a: route by development intent (keywords)

- **Interactivity API / data-wp-* / @wordpress/interactivity / viewScriptModule**
  → `wp-interactivity-api`
- **Abilities API / wp_register_ability / wp-abilities/v1**
  → `wp-abilities-api`
- **Blocks / block.json / registerBlockType / attributes / save serialization**
  → `wp-block-development`
- **theme.json / Global Styles / templates/*.html / patterns/**
  → `wp-block-themes`
- **Plugin architecture / hooks / activation / Settings API / admin pages**
  → `wp-plugin-development`
- **REST endpoint / register_rest_route / permission_callback**
  → `wp-rest-api`
- **WP-CLI / wp-cli.yml / commands**
  → `wp-wpcli-and-ops`
- **PHPStan / static analysis / phpstan.neon**
  → `wp-phpstan`
- **Performance profiling / query optimization / editor slowness**
  → `wp-performance` (backend profiling with WP-CLI doctor/profile)
- **UI components / design tokens / @wordpress/components / @wordpress/ui / WPDS**
  → `wpds` (WordPress Design System)
- **Playground / disposable WP / blueprint / sandbox / test environment / version switching**
  → `wp-playground`
- **Test / E2E / Playwright / Jest / PHPUnit / wp-env testing / coverage / visual regression**
  → `wp-e2e-testing` skill + `wp-test-engineer` agent
- **i18n / translation / .pot / gettext / text domain / RTL / Polylang / WPML / multilingual**
  → `wp-i18n`
- **Accessibility / a11y / WCAG / ARIA / screen reader / keyboard navigation / focus management**
  → `wp-accessibility` skill + `wp-accessibility-auditor` agent
- **Headless / decoupled / WPGraphQL / Next.js / Nuxt / Astro / Gatsby / CORS / ISR / SSG / frontend integration**
  → `wp-headless`

## Step 2b: route by operational intent (keywords)

- **Deploy / push / production / Hostinger**
  → `wp-deploy` skill + `wp-deployment-engineer` agent
- **Audit / security check / vulnerability / hacked / health check**
  → `wp-audit` skill + `wp-security-auditor` agent
- **Harden / permissions / headers / WAF / malware / compromised / incident response / security hardening**
  → `wp-security` skill + `wp-security-hardener` agent
- **Backup / snapshot / disaster recovery / restore**
  → `wp-backup` skill
- **Migrate / move / transfer / clone site / change hosting**
  → `wp-migrate` skill
- **Create post / write content / manage pages / categories / SEO content**
  → `wp-content` skill + `wp-content-strategist` agent
- **Slow site / PageSpeed / Core Web Vitals / optimize performance**
  → `wp-audit` skill (performance scope) + `wp-performance-optimizer` agent
- **Site status / list plugins / manage users / multi-site coordination**
  → `wp-site-manager` agent
- **DNS / domain / SSL / hosting configuration**
  → `wp-site-manager` agent (Hostinger MCP tools)
- **WooCommerce / woo / shop / products / orders / coupons / cart / store management / sales report / inventory**
  → `wp-woocommerce` skill + `wp-ecommerce-manager` agent
- **Multisite / network / sub-sites / domain mapping / super admin / network activate**
  → `wp-multisite` skill + `wp-site-manager` agent

## Step 2c: route by local environment intent (keywords)

First, run detection to discover installed tools and sites:
```bash
node skills/wp-local-env/scripts/detect_local_env.mjs
```

Then route by intent:

- **Create / new site / setup local / install WordPress locally**
  → `wp-local-env` skill (Section 1: Site lifecycle → Create)
- **Start site / stop site / delete site / site status**
  → `wp-local-env` skill (Section 1: Site lifecycle)
- **WP-CLI / plugin list / scaffold / export / local command**
  → `wp-local-env` skill (Section 2: WP-CLI operations)
- **Symlink / link plugin / develop locally / local dev workflow**
  → `wp-local-env` skill (Section 3: Development workflow)
- **Local REST API / localhost API / application password local**
  → `wp-local-env` skill (Section 4: REST API access)
- **Local database / SQLite / export DB / backup local / mysql local**
  → `wp-local-env` skill (Section 5: Database operations)
- **Switch PHP / switch WordPress version / test version / local testing**
  → `wp-local-env` skill (Section 6: Testing and version switching)
- **Preview / share local / ngrok / tunnel / demo site**
  → `wp-local-env` skill (Section 7: Preview and share)
- **MCP adapter / local MCP / WordPress MCP server**
  → `wp-local-env` skill (Section 8: MCP integration) + `references/mcp-adapter-setup.md`
- **Which tool / Studio vs LocalWP / which local env / recommend tool**
  → `wp-local-env` skill (run detection, present comparison)

**Overlap with Development**: If the user is developing a plugin/theme AND needs a local site to test it, route to `wp-local-env` first (symlink workflow), then to development skills for the code changes.

**Overlap with Operations**: If the user mentions "deploy from local" or "push local to production", route to `wp-local-env` for export, then to `wp-deploy` for the deployment.

## Step 3: guardrails checklist (always)

### Development guardrails
- Verify detected tooling before suggesting commands (Composer vs npm/yarn/pnpm).
- Prefer existing lint/test scripts if present.
- If version constraints aren’t detectable, ask for target WP core and PHP versions.

### Local environment guardrails
- Run `detect_local_env.mjs` before assuming which tool is available.
- For LocalWP: verify the site is started (GUI) before WP-CLI or DB operations.
- For Studio: verify the Studio app is running before CLI operations.
- For wp-env: verify Docker is running (`docker info`) before starting.
- Never delete a local site without explicit user confirmation.
- When multiple tools are detected, use the `recommended` field from detection output.

### Operations guardrails
- Confirm target site before any operation.
- Verify backups exist before destructive operations (deploy, migrate, restore).
- Get explicit user confirmation before publishing, deleting, or modifying live content.
- Never deactivate plugins or delete content without listing dependencies first.
- For multi-site operations, announce which site you’re operating on.
