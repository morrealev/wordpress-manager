# Router decision tree (v2 — unified development + operations)

This routing guide covers both WordPress **development** and **operations** workflows.

## Step 0: determine task category

Before repo triage, classify the user’s intent:

- **Development** (modifying code) → proceed to Step 1
- **Operations** (managing live sites) → skip to Step 2b

Keywords that indicate **operations**:
deploy, push to production, audit, security check, backup, restore, migrate, move site, create post, manage content, site status, check plugins, performance check, SEO audit

Keywords that indicate **development**:
create block, block.json, theme.json, register_rest_route, plugin development, hooks, PHPStan, build, test, scaffold

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

## Step 2b: route by operational intent (keywords)

- **Deploy / push / production / Hostinger**
  → `wp-deploy` skill + `wp-deployment-engineer` agent
- **Audit / security check / vulnerability / hacked / health check**
  → `wp-audit` skill + `wp-security-auditor` agent
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

## Step 3: guardrails checklist (always)

### Development guardrails
- Verify detected tooling before suggesting commands (Composer vs npm/yarn/pnpm).
- Prefer existing lint/test scripts if present.
- If version constraints aren’t detectable, ask for target WP core and PHP versions.

### Operations guardrails
- Confirm target site before any operation.
- Verify backups exist before destructive operations (deploy, migrate, restore).
- Get explicit user confirmation before publishing, deleting, or modifying live content.
- Never deactivate plugins or delete content without listing dependencies first.
- For multi-site operations, announce which site you’re operating on.
