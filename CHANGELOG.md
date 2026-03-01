# Changelog

All notable changes to the WordPress Manager plugin for Claude Code.

## [2.12.2] — 2026-03-01

### Fixed — Structured Data Tools Rewrite

**sd_inject: content-block approach (replaces broken meta approach)**
- JSON-LD now injected as `<!-- wp:html -->` block in post content
- No mu-plugin or `register_post_meta()` required — works out of the box
- Idempotent: re-injecting same @type replaces existing block, no duplicates

**sd_list_schemas: content scanning (replaces broken meta scanning)**
- Scans post content for `<script type="application/ld+json">` blocks
- No longer depends on unregistered `_schema_json_ld` meta field

**sd_validate: multi-block support**
- Now finds ALL JSON-LD scripts on a page (not just the first)
- Reports per-schema issues with type labels

### Validated end-to-end on opencactus.com
- sd_inject Article on post 2348: ✅
- sd_list_schemas finds injected schema: ✅
- sd_validate on live URL: ✅ (2 schemas detected)
- Idempotency verified: ✅

## [2.12.1] — 2026-03-01

### Fixed — Critical MCP Tool Parameter Passing

**Server registration fix (affects ~60 tools)**
- Fixed `toZodType()` conversion in server.js: tools defined with JSON Schema properties (plain objects) instead of Zod `.shape` references were not receiving parameters from the MCP client
- Affected modules: GSC (8), Mailchimp (7), Buffer (5), SendGrid (6), Slack (3), CWV (4), Plausible (4), GA4 (6), LinkedIn (5), Twitter (5), Schema (3), WC-Webhooks (4), WC-Workflows (4)
- Original WordPress core (44) and WooCommerce (30) tools were unaffected (use Zod `.shape`)

**Schema tool fixes**
- Fixed import `makeRequest` → `makeWordPressRequest` in schema.js (prevented server startup)
- Fixed duplicated REST API path `wp/v2/wp/v2/posts` → `posts` in sd_list_schemas and sd_inject

**Documentation**
- Corrected tool count from 145 to 148 across GUIDE.md and package.json
- WordPress core: Plugins 6 (not 5), Users 6 (not 5), Media 5 (not 4), +Search (1)

### Validated end-to-end on opencactus.com
- `get_active_site`, `list_content`, `sd_validate` (markup + URL), `sd_list_schemas`
- GSC, Mailchimp tools return correct "not configured" errors

## [2.12.0] — 2026-03-01

### Added — Content Generation + Structured Data (Tier 7: Content Factory Completeness)

**Structured Data (3 MCP tools)**
- `sd_validate` — validate JSON-LD/Schema.org markup
- `sd_inject` — inject/update JSON-LD in WordPress posts
- `sd_list_schemas` — audit Schema.org types across the site
- New skill: `wp-structured-data` with schema types, validation, and injection references
- Detection script: `schema_inspect.mjs`
- Supported types: Article, Product, FAQ, HowTo, LocalBusiness, Event, Organization, BreadcrumbList

**Content Generation (procedure-based, no new MCP tools)**
- New skill: `wp-content-generation` with AI-driven content pipeline
- 7-step procedure: brief → keyword research → outline → draft → SEO optimize → structured data → publish
- Uses existing MCP tools (wp/v2, gsc_*, sd_*)
- Detection script: `content_gen_inspect.mjs`
- References: generation workflow, brief templates, outline patterns

**Infrastructure**
- Router v18 (+2 categories: content generation, structured data)
- Updated wp-content-strategist agent with AI generation and schema procedures

**Stats:** 41 → 43 skills | 142 → 148 MCP tools | Router v17 → v18

### WCOP Score
- Content Factory: 9/10 → 10/10 (AI generation + structured data)
- Distribution: 9/10 (completed in v2.10-2.11)
- **Total: 8.8/10 → 9.2/10**

## [2.11.0] — 2026-03-01

### Added — Auto-Transform Pipeline (Tier 6b: Distribution Completeness)

- Auto-transform pipeline in `wp-content-repurposing` skill (new Section 5)
- Template system: blog→tweet, blog→thread, blog→LinkedIn post, blog→LinkedIn article, blog→email snippet
- Platform-specific formatting rules with character limits
- Integration with `li_*`, `tw_*`, `buf_*`, `mc_*` MCP tools
- New references: `auto-transform-pipeline.md`, `transform-templates.md`

**Stats:** 41 skills (unchanged) | 142 MCP tools (unchanged) | WCOP Distribution: 8/10 → 9/10

## [2.10.0] — 2026-03-01

### Added — Direct Social APIs (Tier 6a: Distribution Completeness)

**LinkedIn Integration (5 MCP tools)**
- `li_get_profile` — get authenticated user profile
- `li_create_post` — create feed post (text, link, image)
- `li_create_article` — publish long-form article
- `li_get_analytics` — post analytics (impressions, clicks, engagement)
- `li_list_posts` — list recent user posts
- New skill: `wp-linkedin` with setup, posting, and analytics references
- Detection script: `linkedin_inspect.mjs`

**Twitter/X Integration (5 MCP tools)**
- `tw_create_tweet` — publish tweet (text, media)
- `tw_create_thread` — publish connected tweet thread
- `tw_get_metrics` — tweet metrics (impressions, likes, retweets)
- `tw_list_tweets` — list recent user tweets
- `tw_delete_tweet` — delete tweet
- New skill: `wp-twitter` with setup, posting, and analytics references
- Detection script: `twitter_inspect.mjs`

**Infrastructure**
- LinkedIn client helpers in wordpress.js (hasLinkedIn, makeLinkedInRequest)
- Twitter client helpers in wordpress.js (hasTwitter, makeTwitterRequest)
- Router v17 (+2 categories: LinkedIn, Twitter/X)
- +2 safety hooks (tw_delete_tweet, li_create_article)
- Updated wp-distribution-manager agent with LinkedIn + Twitter procedures

**Stats:** 39 → 41 skills | 132 → 142 MCP tools | 10 → 12 hooks | Router v16 → v17

## [2.9.0] - 2026-03-01

### Added — Automated Workflows (WCOP Tier 4+5 Complete)
- **wp-content-workflows skill** — workflow triggers for scheduled events, content lifecycle hooks, and WP action/filter hooks
- **4 new MCP tools**: `wf_list_triggers`, `wf_create_trigger`, `wf_update_trigger`, `wf_delete_trigger`
- **5 reference files**: schedule-triggers, content-lifecycle-hooks, wp-action-hooks, multi-channel-actions, trigger-management
- **Detection script**: `workflow_inspect.mjs` — detects action channels, automation plugins, custom REST endpoints, WP-Cron config
- **Safety hook**: PreToolUse confirmation for `wf_delete_trigger` (prevents accidental deletion of active workflows)

### Changed
- **wp-site-manager agent**: added Workflow Automation Management section (6-step procedure), 4 Workflow MCP tools, wp-content-workflows in Related Skills
- **Router v16**: added 9 workflow keywords and `wp-content-workflows` route
- **Cross-references**: wp-webhooks → wp-content-workflows, wp-social-email → wp-content-workflows

### Metrics
- Skills: 39 (+1) | MCP tools: 132 (+4) | Reference files: 192 (+5) | Detection scripts: 27 (+1) | Safety hooks: 5 (+1)

### WCOP Score (Final)
| Layer | v2.6.0 | v2.9.0 |
|-------|--------|--------|
| Content Factory | 9/10 | 9/10 |
| Quality Assurance | 9/10 | 9/10 |
| Distribution | 8/10 | 8/10 |
| Observability | 7/10 | **9/10** |
| Automation | 7/10 | **9/10** |
| **Total** | **8/10** | **8.8/10** |

## [2.8.0] - 2026-03-01

### Added — Smart Alerting (WCOP Tier 4b)
- **wp-alerting skill** — severity-based alert routing via Slack and SendGrid
- **3 new MCP tools**: `slack_send_alert` (webhook), `slack_send_message` (Bot Token + Block Kit), `slack_list_channels`
- **4 reference files**: slack-integration, alert-thresholds, escalation-paths, report-scheduling
- **Detection script**: `alerting_inspect.mjs` — detects Slack, SendGrid, monitoring setup
- **SiteConfig extension**: `slack_webhook_url`, `slack_bot_token`, `slack_channel`

### Changed
- **wp-monitoring-agent**: added Procedure 10 (Alert Dispatch — severity-based routing: info→Slack webhook, warning→Slack Bot + thread, critical→Slack + email), added Alerting MCP Tools section (3 Slack + 2 SendGrid)
- **Router v15**: added 13 alerting keywords and `wp-alerting` route
- **Cross-references**: wp-monitoring → wp-alerting + wp-analytics

### Metrics
- Skills: 38 (+1) | MCP tools: 128 (+3) | Reference files: 187 (+4) | Detection scripts: 26 (+1)

## [2.7.0] - 2026-03-01

### Added — Analytics (WCOP Tier 4a)
- **wp-analytics skill** — unified analytics: GA4, Plausible, Core Web Vitals
- **14 new MCP tools**: 6 GA4 (`ga4_run_report`, `ga4_get_realtime`, `ga4_top_pages`, `ga4_traffic_sources`, `ga4_user_demographics`, `ga4_conversion_events`), 4 Plausible (`pl_get_stats`, `pl_get_timeseries`, `pl_get_breakdown`, `pl_get_realtime`), 4 CWV (`cwv_analyze_url`, `cwv_batch_analyze`, `cwv_get_field_data`, `cwv_compare_pages`)
- **5 reference files**: ga4-integration, plausible-setup, cwv-monitoring, analytics-dashboards, traffic-attribution
- **Detection script**: `analytics_inspect.mjs` — detects GA4, Plausible, Google API key config
- **SiteConfig extension**: `ga4_property_id`, `ga4_service_account_key`, `plausible_api_key`, `plausible_base_url`, `google_api_key`

### Changed
- **wp-monitoring-agent**: added Procedure 8 (Analytics Monitoring) and Procedure 9 (CWV Trend Check) with 14 analytics MCP tools
- **Router v14**: added GA4, Plausible, CWV keywords and route
- **Cross-references**: wp-search-console, wp-content-attribution, wp-content-optimization → wp-analytics

### Metrics
- Skills: 37 (+1) | MCP tools: 125 (+14) | Reference files: 183 (+5) | Detection scripts: 25 (+1)

## [2.6.0] - 2026-03-01

### Added
- **Content Optimization skill** (`wp-content-optimization`) — AI-driven content quality optimization using Claude's linguistic analysis
  - 6 procedures: Headline Analysis, Readability Analysis, SEO Content Scoring, Meta Description Optimization, Content Freshness Audit, Bulk Content Triage
  - 5 reference files: `headline-optimization.md`, `readability-analysis.md`, `seo-content-scoring.md`, `meta-optimization.md`, `content-freshness.md`
  - Detection script: `content_optimization_inspect.mjs` (content volume, age, SEO plugins, readability, GSC availability, WooCommerce)
  - Bulk Content Triage classification: Quick Wins, Needs Rewrite, Performing, Archive
- **AI Content Optimization Workflow** in `wp-content-strategist` agent — 5-step content optimization pipeline with bulk triage

### Changed
- Router decision-tree.md upgraded to v13 with content optimization keywords and routing
- Cross-references added: `wp-content` → wp-content-optimization, `wp-search-console` → wp-content-optimization, `wp-content-attribution` → wp-content-optimization, `wp-programmatic-seo` → wp-content-optimization
- Plugin now has 36 skills, 12 agents, and 111 MCP tools — **Tier 3 WCOP complete**

### WCOP Score
| Layer | v2.3.1 | v2.6.0 |
|-------|--------|--------|
| Content Factory | 9/10 | 9/10 |
| Quality Assurance | 8/10 | 9/10 |
| Distribution | 4/10 | **8/10** |
| Observability | 5/10 | **7/10** |
| Automation | 4/10 | **7/10** |
| **Total** | **6/10** | **8/10** |

## [2.5.0] - 2026-03-01

### Added
- **Google Search Console skill** (`wp-search-console`) — keyword tracking, indexing management, SEO feedback loops
  - 5 reference files: `gsc-setup.md`, `keyword-tracking.md`, `indexing-management.md`, `content-seo-feedback.md`, `competitor-gap-analysis.md`
  - Detection script: `search_console_inspect.mjs` (GSC config, sitemaps, robots.txt, SEO plugins)
- **8 new GSC MCP tools** via WP REST Bridge:
  - `gsc_list_sites`, `gsc_search_analytics`, `gsc_inspect_url`, `gsc_list_sitemaps`, `gsc_submit_sitemap`, `gsc_delete_sitemap`, `gsc_top_queries`, `gsc_page_performance`
- **SEO Feedback Loop** procedure in `wp-content-strategist` agent — GSC-driven content optimization (6-step workflow)
- SiteConfig extended with `gsc_service_account_key`, `gsc_site_url`
- `googleapis` npm dependency for Google Search Console API access

### Changed
- Router decision-tree.md upgraded to v12 with GSC keywords and routing
- Cross-references added: `wp-programmatic-seo` → wp-search-console, `wp-content-attribution` → wp-search-console, `wp-monitoring` → wp-search-console
- Plugin now has 35 skills, 12 agents, and 111 MCP tools (103 → 111)

## [2.4.0] - 2026-03-01

### Added
- **Social/Email Distribution skill** (`wp-social-email`) — content distribution to Mailchimp, Buffer, and SendGrid
  - 6 reference files: `mailchimp-integration.md`, `buffer-social-publishing.md`, `sendgrid-transactional.md`, `content-to-distribution.md`, `audience-segmentation.md`, `distribution-analytics.md`
  - Detection script: `distribution_inspect.mjs` (WP_SITES_CONFIG keys, WP distribution plugins, content readiness)
- **18 new MCP tools** via WP REST Bridge:
  - 7 Mailchimp tools: `mc_list_audiences`, `mc_get_audience_members`, `mc_create_campaign`, `mc_update_campaign_content`, `mc_send_campaign`, `mc_get_campaign_report`, `mc_add_subscriber`
  - 5 Buffer tools: `buf_list_profiles`, `buf_create_update`, `buf_list_pending`, `buf_list_sent`, `buf_get_analytics`
  - 6 SendGrid tools: `sg_send_email`, `sg_list_templates`, `sg_get_template`, `sg_list_contacts`, `sg_add_contacts`, `sg_get_stats`
- **wp-distribution-manager agent** (indigo) — 5 procedures: detect services, fetch WP content, format for channel, publish/schedule, track analytics
- **2 safety hooks**: PreToolUse confirmation for `mc_send_campaign` and `sg_send_email`
- TypeScript types: `MCMailchimpAudience`, `MCCampaign`, `MCCampaignReport`, `BufProfile`, `BufUpdate`, `SGEmailRequest`, `SGTemplate`, `SGStats`
- SiteConfig extended with `mailchimp_api_key`, `buffer_access_token`, `sendgrid_api_key`

### Changed
- Router decision-tree.md upgraded to v11 with social/email distribution keywords and routing
- Cross-references added: `wp-content-repurposing` → wp-social-email, `wp-webhooks` → wp-social-email, `wp-content` → wp-social-email
- Plugin now has 34 skills, 12 agents, and 103 MCP tools

## [2.3.1] - 2026-02-28

### Changed
- **GUIDE.md**: aggiornamento completo da v2.2.0 a v2.3.0 — documenta programmatic SEO, content-commerce attribution, multi-language network (22 scenari, 33 skill, 85 tool, router v10, +16 termini glossario)

## [2.3.0] - 2026-02-28

### Added
- **Programmatic SEO skill** (`wp-programmatic-seo`) — template-based scalable page generation via headless WordPress + multisite
  - 5 reference files: `template-architecture.md`, `location-seo.md`, `product-seo.md`, `data-sources.md`, `technical-seo.md`
  - Detection script: `programmatic_seo_inspect.mjs` (headless frontend, SEO plugins, CPTs, WPGraphQL)
  - Agent updated: Programmatic SEO Workflow + example in `wp-content-strategist`
- **Content-Commerce Attribution skill** (`wp-content-attribution`) — link WooCommerce sales data to content that drives conversions
  - 5 reference files: `utm-tracking-setup.md`, `conversion-funnels.md`, `attribution-models.md`, `roi-calculation.md`, `reporting-dashboards.md`
  - Detection script: `attribution_inspect.mjs` (WooCommerce, analytics plugins, UTM tracking, order meta)
  - Agent updated: Content Attribution Workflow + example in `wp-ecommerce-manager`
- **Multi-Language Network skill** (`wp-multilang-network`) — multisite multi-language orchestration with hreflang and content sync
  - 5 reference files: `network-architecture.md`, `hreflang-config.md`, `content-sync.md`, `language-routing.md`, `seo-international.md`
  - Detection script: `multilang_inspect.mjs` (multisite status, multilingual plugins, language patterns, hreflang)
  - Agent updated: Multi-Language Network Management + example in `wp-site-manager`

### Changed
- Router decision-tree.md upgraded to v10 with programmatic SEO, content attribution, and multi-language network keywords and routing
- Cross-references added: `wp-headless` → wp-programmatic-seo, `wp-woocommerce` → wp-content-attribution, `wp-content` → wp-content-attribution, `wp-multisite` → wp-multilang-network, `wp-i18n` → wp-multilang-network
- Plugin now has 33 skills, 11 agents, and 85 MCP tools

## [2.2.1] - 2026-02-28

### Changed
- **GUIDE.md**: aggiornamento completo da v2.1.0 a v2.2.0 — documenta fleet monitoring, content repurposing, webhook propagation (19 scenari, 30 skill, 85 tool, router v9, +6 termini glossario)

## [2.2.0] - 2026-02-28

### Added
- **Fleet monitoring** — cross-site health assessment for all configured WordPress sites
  - New reference file: `skills/wp-monitoring/references/fleet-monitoring.md` (fleet iteration, cross-site patterns, fleet baselines, site grouping, scheduling, P0 escalation)
  - Detection script updated: `detectFleetConfiguration()` checks WP_SITES_CONFIG and sites.json for multi-site fleet
  - Agent updated: Procedure 7 (Fleet Monitoring) + Fleet Report Template in `wp-monitoring-agent`

- **Content repurposing skill** (`wp-content-repurposing`) — transform WordPress content into multi-channel outputs
  - 4 reference files: social-formats (Twitter/LinkedIn/Instagram/Facebook templates), email-newsletter (digest/drip/subject lines), content-atomization (pillar→atoms workflow, repurposing matrix), platform-specs (character limits, image dimensions, posting frequency)
  - Detection script: `repurposing_inspect.mjs` — detects social plugins, email plugins, content volume
  - Agent updated: `wp-content-strategist` now includes Content Repurposing Workflow and repurposing example

- **Webhook propagation skill** (`wp-webhooks`) — WordPress outbound webhook configuration and management
  - 5 reference files: woocommerce-webhooks (API, topics, MCP tools), wordpress-core-webhooks (mu-plugin, action hooks), integration-recipes (Zapier/Make/n8n/Slack/CDN), payload-formats (JSON payloads, WC examples), webhook-security (HMAC-SHA256, signatures, rate limiting)
  - Detection script: `webhook_inspect.mjs` — detects WC webhooks, mu-plugin webhooks, webhook plugins, wp-config constants
  - 4 new MCP tools via WP REST Bridge: `wc_list_webhooks`, `wc_create_webhook`, `wc_update_webhook`, `wc_delete_webhook`
  - `WCWebhook` TypeScript interface added to types.ts
  - Safety hook for `wc_delete_webhook` (PreToolUse prompt confirmation)

### Changed
- Router decision-tree.md upgraded to v9 with fleet, webhook, and content repurposing keywords and routing
- Cross-references added: `wp-content` → wp-content-repurposing, `wp-headless` → wp-webhooks, `wp-woocommerce` → wp-webhooks
- Plugin now has 30 skills, 11 agents, and 85 MCP tools

## [2.1.1] - 2026-02-28

### Changed
- **GUIDE.md**: aggiornamento completo da v1.7.1 a v2.1.0 — documenta WooCommerce, Multisite, CI/CD, Monitoring (11 agent, 28 skill, 81 tool, 16 script, router v8, 16 scenari, +13 termini glossario)

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
