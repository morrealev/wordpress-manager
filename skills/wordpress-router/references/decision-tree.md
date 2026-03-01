# Router decision tree (v17 — development + local environment + operations + multisite + CI/CD + monitoring + webhooks + content repurposing + programmatic SEO + content attribution + multi-language network + social/email distribution + search console + content optimization + analytics + alerting + workflows + LinkedIn + Twitter/X)

This routing guide covers WordPress **development**, **local environment**, and **operations** workflows.

## Step 0: determine task category

Before repo triage, classify the user’s intent:

- **Development** (modifying code) → proceed to Step 1
- **Local Environment** (managing local dev sites) → skip to Step 2c
- **Operations** (managing live sites) → skip to Step 2b

Keywords that indicate **local environment**:
local site, Studio, LocalWP, Local by Flywheel, wp-env, local WordPress, start site, stop site, create local site, local development, symlink plugin, local database, switch PHP version, localhost, local preview, detect environment, WASM, SQLite local

Keywords that indicate **operations**:
deploy, push to production, audit, security check, backup, restore, migrate, move site, create post, manage content, site status, check plugins, performance check, SEO audit, WooCommerce, prodotto, ordine, coupon, negozio, catalogo, inventario, vendite, carrello, multisite, network, sub-site, sub-sito, domain mapping, super admin, network activate, monitor, uptime, health report, trend, scansione periodica, alerting, performance baseline, fleet, all sites, network health, cross-site, webhook, outbound notification, event propagation, Zapier, content sync, repurpose content, social posts from blog, content atomization, newsletter from posts, content distribution, programmatic SEO, template pages, city pages, location pages, bulk page generation, scalable landing pages, content ROI, attribution, which content drives sales, conversion tracking, UTM tracking, revenue per post, multilingual, multi-language, hreflang, international SEO, translate site, language sites, localize content, social publish, schedule post, Buffer, email campaign, Mailchimp, SendGrid, transactional email, content distribution, newsletter send, Google Search Console, GSC, keyword tracking, keyword rankings, search analytics, indexing status, URL inspection, sitemap submit, search performance, SERP data, optimize content, headline scoring, readability analysis, SEO score, content scoring, meta optimization, content freshness, content triage, bulk optimize, Flesch-Kincaid, keyword density, Google Analytics, GA4, traffic analytics, pageviews, sessions, user analytics, Plausible, privacy analytics, Core Web Vitals, CWV, LCP, INP, CLS, PageSpeed, page speed, site speed, performance score, Slack alert, email alert, notification channel, alert threshold, severity routing, escalation, incident notification, uptime alert, error alert, performance alert, scheduled report, health digest, alert cooldown, alert dedup, workflow trigger, automation, scheduled event, content lifecycle, cron trigger, hook trigger, workflow rule, automate, trigger management, LinkedIn, LinkedIn post, LinkedIn article, B2B social, pubblica LinkedIn, Twitter, X, tweet, thread, pubblica tweet, Twitter analytics

Keywords that indicate **development**:
create block, block.json, theme.json, register_rest_route, plugin development, hooks, PHPStan, build, test, scaffold, i18n, translation, accessibility, a11y, headless, decoupled, WPGraphQL, CI, CD, pipeline, GitHub Actions, GitLab CI, deploy automatico, workflow, quality gate

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
- **CI / CD / pipeline / GitHub Actions / GitLab CI / Bitbucket Pipelines / quality gate / deploy automatico / continuous integration**
  → `wp-cicd` skill + `wp-cicd-engineer` agent

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
- **Monitor / uptime / health report / trend / scansione periodica / alerting / performance baseline / ongoing checks / fleet / all sites / cross-site comparison**
  → `wp-monitoring` skill + `wp-monitoring-agent` agent
- **Webhook / outbound notification / event propagation / Zapier / Make / n8n / content sync webhook**
  → `wp-webhooks` skill + `wp-site-manager` agent
- **Repurpose content / social posts from blog / newsletter from content / atomize / content distribution / turn blog into social**
  → `wp-content-repurposing` skill + `wp-content-strategist` agent
- **Programmatic SEO / template pages / city pages / bulk page generation / scalable landing pages / location-based SEO / product variant pages**
  → `wp-programmatic-seo` skill + `wp-content-strategist` agent
- **Content attribution / ROI / conversion tracking / UTM / revenue per post / which content drives sales**
  → `wp-content-attribution` skill + `wp-ecommerce-manager` agent
- **Multi-language / multilingual / hreflang / international SEO / language sites / translate network**
  → `wp-multilang-network` skill + `wp-site-manager` agent
- **Social/email distribution / publish to social / schedule post / email campaign / Mailchimp / Buffer / SendGrid / newsletter / transactional email / content distribution**
  → `wp-social-email` skill + `wp-distribution-manager` agent
- **Google Search Console / keyword tracking / indexing status / sitemap submit / search performance / GSC / SERP data**
  → `wp-search-console` skill + `wp-content-strategist` agent
- **Content optimization / headline scoring / readability / SEO score / meta optimization / content freshness / content triage / optimize posts / Flesch-Kincaid / keyword density**
  → `wp-content-optimization` skill + `wp-content-strategist` agent
- **Google Analytics / GA4 / Plausible / traffic analytics / pageviews / sessions / user analytics / Core Web Vitals / CWV / PageSpeed / site speed / performance score**
  → `wp-analytics` skill + `wp-monitoring-agent` agent
- **Slack alert / email alert / notification channel / alert threshold / severity routing / escalation / incident notification / uptime alert / performance alert / scheduled report / health digest / alert cooldown**
  → `wp-alerting` skill + `wp-monitoring-agent` agent
- **Workflow trigger / automation / scheduled event / content lifecycle / cron trigger / hook trigger / workflow rule / automate / trigger management**
  → `wp-content-workflows` skill + `wp-site-manager` agent
- **LinkedIn / LinkedIn post / LinkedIn article / B2B social / pubblica LinkedIn**
  → `wp-linkedin` skill + `wp-distribution-manager` agent
- **Twitter / X / tweet / thread / pubblica tweet / Twitter analytics**
  → `wp-twitter` skill + `wp-distribution-manager` agent

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
