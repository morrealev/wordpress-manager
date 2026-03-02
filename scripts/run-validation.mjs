#!/usr/bin/env node
// scripts/run-validation.mjs — MCP Tool Validation Runner
// Spawns wp-rest-bridge server, connects via MCP SDK, tests all registered tools.
// Usage:
//   node scripts/run-validation.mjs                        # interactive mode
//   node scripts/run-validation.mjs --site=mysite      # target specific site
//   node scripts/run-validation.mjs --module=gsc           # single module
//   node scripts/run-validation.mjs --include-writes       # include write tools
//   node scripts/run-validation.mjs --test-writes          # CRUD sequence testing
//   node scripts/run-validation.mjs --test-writes --tier=1 # only Tier 1
//   node scripts/run-validation.mjs --delay=200            # ms between calls

import { createRequire } from 'module';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const SERVER_DIR = resolve(PROJECT_ROOT, 'servers/wp-rest-bridge');
const SDK_PATH = resolve(SERVER_DIR, 'node_modules/@modelcontextprotocol/sdk');
const RESULTS_PATH = resolve(PROJECT_ROOT, 'docs/validation/results.json');
const VALIDATION_MD_PATH = resolve(PROJECT_ROOT, 'docs/VALIDATION.md');
const RUNNER_VERSION = '1.2.0';

// Dynamic import of MCP SDK from server's node_modules
const require = createRequire(resolve(SERVER_DIR, 'package.json'));

// ── CLI Args ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const a = args.find(a => a.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const filterModule = getArg('module');
const filterSite = getArg('site');
const includeWrites = hasFlag('include-writes');
const testWrites = hasFlag('test-writes');
const filterTier = getArg('tier') ? parseInt(getArg('tier'), 10) : null;
const delay = parseInt(getArg('delay') || '100', 10);
const TIMEOUT_MS = parseInt(getArg('timeout') || '10000', 10);

// ── Site Configuration ──────────────────────────────────────────────
function getConfiguredSites() {
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return [];
  try {
    const sites = JSON.parse(raw);
    return sites.map(s => ({ id: s.id, url: s.url }));
  } catch { return []; }
}

// ── Tool Registry ────────────────────────────────────────────────────
// All 148+ tools classified by module, service, and type.
const TOOL_REGISTRY = [
  // --- WordPress Core: Content ---
  { name: 'list_content', module: 'unified-content', service: 'wordpress_core', type: 'read', safeArgs: { content_type: 'post', per_page: 1 } },
  { name: 'get_content', module: 'unified-content', service: 'wordpress_core', type: 'read', safeArgs: 'dynamic' },
  { name: 'create_content', module: 'unified-content', service: 'wordpress_core', type: 'write' },
  { name: 'update_content', module: 'unified-content', service: 'wordpress_core', type: 'write' },
  { name: 'delete_content', module: 'unified-content', service: 'wordpress_core', type: 'write' },
  { name: 'discover_content_types', module: 'unified-content', service: 'wordpress_core', type: 'read', safeArgs: {} },
  { name: 'find_content_by_url', module: 'unified-content', service: 'wordpress_core', type: 'read', safeArgs: 'dynamic' },
  { name: 'get_content_by_slug', module: 'unified-content', service: 'wordpress_core', type: 'read', safeArgs: 'dynamic' },

  // --- WordPress Core: Taxonomies ---
  { name: 'discover_taxonomies', module: 'unified-taxonomies', service: 'wordpress_core', type: 'read', safeArgs: {} },
  { name: 'list_terms', module: 'unified-taxonomies', service: 'wordpress_core', type: 'read', safeArgs: { taxonomy: 'category', per_page: 1 } },
  { name: 'get_term', module: 'unified-taxonomies', service: 'wordpress_core', type: 'read', safeArgs: { taxonomy: 'category', id: 1 } },
  { name: 'create_term', module: 'unified-taxonomies', service: 'wordpress_core', type: 'write' },
  { name: 'update_term', module: 'unified-taxonomies', service: 'wordpress_core', type: 'write' },
  { name: 'delete_term', module: 'unified-taxonomies', service: 'wordpress_core', type: 'write' },
  { name: 'assign_terms_to_content', module: 'unified-taxonomies', service: 'wordpress_core', type: 'write' },
  { name: 'get_content_terms', module: 'unified-taxonomies', service: 'wordpress_core', type: 'read', safeArgs: 'dynamic' },

  // --- WordPress Core: Comments ---
  { name: 'list_comments', module: 'comments', service: 'wordpress_core', type: 'read', safeArgs: { per_page: 1 } },
  { name: 'get_comment', module: 'comments', service: 'wordpress_core', type: 'read', safeArgs: 'dynamic' },
  { name: 'create_comment', module: 'comments', service: 'wordpress_core', type: 'write' },
  { name: 'update_comment', module: 'comments', service: 'wordpress_core', type: 'write' },
  { name: 'delete_comment', module: 'comments', service: 'wordpress_core', type: 'write' },

  // --- WordPress Core: Media ---
  { name: 'list_media', module: 'media', service: 'wordpress_core', type: 'read', safeArgs: { per_page: 1 } },
  { name: 'get_media', module: 'media', service: 'wordpress_core', type: 'read', safeArgs: 'dynamic' },
  { name: 'create_media', module: 'media', service: 'wordpress_core', type: 'write' },
  { name: 'edit_media', module: 'media', service: 'wordpress_core', type: 'write' },
  { name: 'delete_media', module: 'media', service: 'wordpress_core', type: 'write' },

  // --- WordPress Core: Users ---
  { name: 'list_users', module: 'users', service: 'wordpress_core', type: 'read', safeArgs: { per_page: 1 } },
  { name: 'get_user', module: 'users', service: 'wordpress_core', type: 'read', safeArgs: { id: 1 } },
  { name: 'get_me', module: 'users', service: 'wordpress_core', type: 'read', safeArgs: {} },
  { name: 'create_user', module: 'users', service: 'wordpress_core', type: 'write' },
  { name: 'update_user', module: 'users', service: 'wordpress_core', type: 'write' },
  { name: 'delete_user', module: 'users', service: 'wordpress_core', type: 'write' },

  // --- WordPress Core: Plugins ---
  { name: 'list_plugins', module: 'plugins', service: 'wordpress_core', type: 'read', safeArgs: { status: 'active' } },
  { name: 'get_plugin', module: 'plugins', service: 'wordpress_core', type: 'read', safeArgs: 'dynamic' },
  { name: 'activate_plugin', module: 'plugins', service: 'wordpress_core', type: 'write' },
  { name: 'deactivate_plugin', module: 'plugins', service: 'wordpress_core', type: 'write' },
  { name: 'create_plugin', module: 'plugins', service: 'wordpress_core', type: 'write' },
  { name: 'delete_plugin', module: 'plugins', service: 'wordpress_core', type: 'write' },

  // --- WordPress Core: Search ---
  { name: 'wp_search', module: 'search', service: 'wordpress_core', type: 'read', safeArgs: { search: 'test', per_page: 1 } },

  // --- WordPress Core: Plugin Repository ---
  { name: 'search_plugin_repository', module: 'plugin-repository', service: 'wordpress_core', type: 'read', safeArgs: { search: 'seo' } },
  { name: 'get_plugin_details', module: 'plugin-repository', service: 'wordpress_core', type: 'read', safeArgs: { slug: 'akismet' } },

  // --- WordPress Core: Site Management ---
  { name: 'switch_site', module: 'server', service: 'wordpress_core', type: 'write' },
  { name: 'list_sites', module: 'server', service: 'wordpress_core', type: 'read', safeArgs: {} },
  { name: 'get_active_site', module: 'server', service: 'wordpress_core', type: 'read', safeArgs: {} },

  // --- Multisite: Network ---
  { name: 'ms_list_network_plugins', module: 'multisite-network', service: 'multisite', type: 'read', safeArgs: {} },
  { name: 'ms_network_activate_plugin', module: 'multisite-network', service: 'multisite', type: 'write' },
  { name: 'ms_network_deactivate_plugin', module: 'multisite-network', service: 'multisite', type: 'write' },
  { name: 'ms_list_super_admins', module: 'multisite-network', service: 'multisite', type: 'read', safeArgs: {} },
  { name: 'ms_get_network_settings', module: 'multisite-network', service: 'multisite', type: 'read', safeArgs: {} },

  // --- Multisite: Sites ---
  { name: 'ms_list_sites', module: 'multisite-sites', service: 'multisite', type: 'read', safeArgs: {} },
  { name: 'ms_get_site', module: 'multisite-sites', service: 'multisite', type: 'read', safeArgs: { site_id: 1 } },
  { name: 'ms_create_site', module: 'multisite-sites', service: 'multisite', type: 'write' },
  { name: 'ms_activate_site', module: 'multisite-sites', service: 'multisite', type: 'write' },
  { name: 'ms_delete_site', module: 'multisite-sites', service: 'multisite', type: 'write' },

  // --- WooCommerce: Products ---
  { name: 'wc_list_products', module: 'wc-products', service: 'woocommerce', type: 'read', safeArgs: { per_page: 1 } },
  { name: 'wc_get_product', module: 'wc-products', service: 'woocommerce', type: 'read', safeArgs: { id: 1 } },
  { name: 'wc_create_product', module: 'wc-products', service: 'woocommerce', type: 'write' },
  { name: 'wc_update_product', module: 'wc-products', service: 'woocommerce', type: 'write' },
  { name: 'wc_delete_product', module: 'wc-products', service: 'woocommerce', type: 'write' },
  { name: 'wc_list_product_categories', module: 'wc-products', service: 'woocommerce', type: 'read', safeArgs: { per_page: 1 } },
  { name: 'wc_list_product_variations', module: 'wc-products', service: 'woocommerce', type: 'read', safeArgs: { product_id: 1 } },

  // --- WooCommerce: Orders ---
  { name: 'wc_list_orders', module: 'wc-orders', service: 'woocommerce', type: 'read', safeArgs: { per_page: 1 } },
  { name: 'wc_get_order', module: 'wc-orders', service: 'woocommerce', type: 'read', safeArgs: { id: 1 } },
  { name: 'wc_update_order_status', module: 'wc-orders', service: 'woocommerce', type: 'write' },
  { name: 'wc_list_order_notes', module: 'wc-orders', service: 'woocommerce', type: 'read', safeArgs: { order_id: 1 } },
  { name: 'wc_create_order_note', module: 'wc-orders', service: 'woocommerce', type: 'write' },
  { name: 'wc_create_refund', module: 'wc-orders', service: 'woocommerce', type: 'write' },

  // --- WooCommerce: Customers ---
  { name: 'wc_list_customers', module: 'wc-customers', service: 'woocommerce', type: 'read', safeArgs: { per_page: 1 } },
  { name: 'wc_get_customer', module: 'wc-customers', service: 'woocommerce', type: 'read', safeArgs: { id: 1 } },
  { name: 'wc_create_customer', module: 'wc-customers', service: 'woocommerce', type: 'write' },
  { name: 'wc_update_customer', module: 'wc-customers', service: 'woocommerce', type: 'write' },

  // --- WooCommerce: Coupons ---
  { name: 'wc_list_coupons', module: 'wc-coupons', service: 'woocommerce', type: 'read', safeArgs: { per_page: 1 } },
  { name: 'wc_get_coupon', module: 'wc-coupons', service: 'woocommerce', type: 'read', safeArgs: { id: 1 } },
  { name: 'wc_create_coupon', module: 'wc-coupons', service: 'woocommerce', type: 'write' },
  { name: 'wc_delete_coupon', module: 'wc-coupons', service: 'woocommerce', type: 'write' },

  // --- WooCommerce: Reports ---
  { name: 'wc_get_sales_report', module: 'wc-reports', service: 'woocommerce', type: 'read', safeArgs: {} },
  { name: 'wc_get_top_sellers', module: 'wc-reports', service: 'woocommerce', type: 'read', safeArgs: {} },
  { name: 'wc_get_orders_totals', module: 'wc-reports', service: 'woocommerce', type: 'read', safeArgs: {} },
  { name: 'wc_get_products_totals', module: 'wc-reports', service: 'woocommerce', type: 'read', safeArgs: {} },
  { name: 'wc_get_customers_totals', module: 'wc-reports', service: 'woocommerce', type: 'read', safeArgs: {} },

  // --- WooCommerce: Settings ---
  { name: 'wc_list_payment_gateways', module: 'wc-settings', service: 'woocommerce', type: 'read', safeArgs: {} },
  { name: 'wc_list_shipping_zones', module: 'wc-settings', service: 'woocommerce', type: 'read', safeArgs: {} },
  { name: 'wc_get_tax_classes', module: 'wc-settings', service: 'woocommerce', type: 'read', safeArgs: {} },
  { name: 'wc_get_system_status', module: 'wc-settings', service: 'woocommerce', type: 'read', safeArgs: {} },

  // --- WooCommerce: Webhooks ---
  { name: 'wc_list_webhooks', module: 'wc-webhooks', service: 'woocommerce', type: 'read', safeArgs: {} },
  { name: 'wc_create_webhook', module: 'wc-webhooks', service: 'woocommerce', type: 'write' },
  { name: 'wc_update_webhook', module: 'wc-webhooks', service: 'woocommerce', type: 'write' },
  { name: 'wc_delete_webhook', module: 'wc-webhooks', service: 'woocommerce', type: 'write' },

  // --- WooCommerce: Workflows ---
  { name: 'wf_list_triggers', module: 'wc-workflows', service: 'woocommerce', type: 'read', safeArgs: {} },
  { name: 'wf_create_trigger', module: 'wc-workflows', service: 'woocommerce', type: 'write' },
  { name: 'wf_update_trigger', module: 'wc-workflows', service: 'woocommerce', type: 'write' },
  { name: 'wf_delete_trigger', module: 'wc-workflows', service: 'woocommerce', type: 'write' },

  // --- Mailchimp ---
  { name: 'mc_list_audiences', module: 'mailchimp', service: 'mailchimp', type: 'read', safeArgs: {} },
  { name: 'mc_get_audience_members', module: 'mailchimp', service: 'mailchimp', type: 'read', safeArgs: { list_id: 'default' } },
  { name: 'mc_create_campaign', module: 'mailchimp', service: 'mailchimp', type: 'write' },
  { name: 'mc_update_campaign_content', module: 'mailchimp', service: 'mailchimp', type: 'write' },
  { name: 'mc_send_campaign', module: 'mailchimp', service: 'mailchimp', type: 'write' },
  { name: 'mc_get_campaign_report', module: 'mailchimp', service: 'mailchimp', type: 'read', safeArgs: { campaign_id: 'test' } },
  { name: 'mc_add_subscriber', module: 'mailchimp', service: 'mailchimp', type: 'write' },

  // --- Buffer ---
  { name: 'buf_list_profiles', module: 'buffer', service: 'buffer', type: 'read', safeArgs: {} },
  { name: 'buf_create_update', module: 'buffer', service: 'buffer', type: 'write' },
  { name: 'buf_list_pending', module: 'buffer', service: 'buffer', type: 'read', safeArgs: { profile_id: 'default' } },
  { name: 'buf_list_sent', module: 'buffer', service: 'buffer', type: 'read', safeArgs: { profile_id: 'default' } },
  { name: 'buf_get_analytics', module: 'buffer', service: 'buffer', type: 'read', safeArgs: { profile_id: 'default' } },

  // --- SendGrid ---
  { name: 'sg_send_email', module: 'sendgrid', service: 'sendgrid', type: 'write' },
  { name: 'sg_list_templates', module: 'sendgrid', service: 'sendgrid', type: 'read', safeArgs: {} },
  { name: 'sg_get_template', module: 'sendgrid', service: 'sendgrid', type: 'read', safeArgs: { template_id: 'test' } },
  { name: 'sg_list_contacts', module: 'sendgrid', service: 'sendgrid', type: 'read', safeArgs: {} },
  { name: 'sg_add_contacts', module: 'sendgrid', service: 'sendgrid', type: 'write' },
  { name: 'sg_get_stats', module: 'sendgrid', service: 'sendgrid', type: 'read', safeArgs: {} },

  // --- Google Search Console ---
  { name: 'gsc_list_sites', module: 'gsc', service: 'gsc', type: 'read', safeArgs: {} },
  { name: 'gsc_search_analytics', module: 'gsc', service: 'gsc', type: 'read', safeArgs: { start_date: '2025-01-01', end_date: '2025-01-31', dimensions: ['query'], row_limit: 5 } },
  { name: 'gsc_inspect_url', module: 'gsc', service: 'gsc', type: 'read', safeArgs: { url: '/' } },
  { name: 'gsc_list_sitemaps', module: 'gsc', service: 'gsc', type: 'read', safeArgs: {} },
  { name: 'gsc_submit_sitemap', module: 'gsc', service: 'gsc', type: 'write' },
  { name: 'gsc_delete_sitemap', module: 'gsc', service: 'gsc', type: 'write' },
  { name: 'gsc_top_queries', module: 'gsc', service: 'gsc', type: 'read', safeArgs: { days: 7, limit: 5 } },
  { name: 'gsc_page_performance', module: 'gsc', service: 'gsc', type: 'read', safeArgs: { days: 7, limit: 5 } },

  // --- Google Analytics 4 ---
  { name: 'ga4_run_report', module: 'ga4', service: 'ga4', type: 'read', safeArgs: { dimensions: ['date'], metrics: ['activeUsers'], start_date: '7daysAgo', end_date: 'today' } },
  { name: 'ga4_get_realtime', module: 'ga4', service: 'ga4', type: 'read', safeArgs: {} },
  { name: 'ga4_top_pages', module: 'ga4', service: 'ga4', type: 'read', safeArgs: { days: 7, limit: 5 } },
  { name: 'ga4_traffic_sources', module: 'ga4', service: 'ga4', type: 'read', safeArgs: { days: 7, limit: 5 } },
  { name: 'ga4_user_demographics', module: 'ga4', service: 'ga4', type: 'read', safeArgs: { days: 7 } },
  { name: 'ga4_conversion_events', module: 'ga4', service: 'ga4', type: 'read', safeArgs: { days: 7, limit: 5 } },

  // --- Plausible ---
  { name: 'pl_get_stats', module: 'plausible', service: 'plausible', type: 'read', safeArgs: { period: '7d' } },
  { name: 'pl_get_timeseries', module: 'plausible', service: 'plausible', type: 'read', safeArgs: { period: '7d' } },
  { name: 'pl_get_breakdown', module: 'plausible', service: 'plausible', type: 'read', safeArgs: { property: 'visit:source', period: '7d' } },
  { name: 'pl_get_realtime', module: 'plausible', service: 'plausible', type: 'read', safeArgs: {} },

  // --- Core Web Vitals ---
  { name: 'cwv_analyze_url', module: 'cwv', service: 'cwv', type: 'read', safeArgs: { url: 'https://example.com' } },
  { name: 'cwv_batch_analyze', module: 'cwv', service: 'cwv', type: 'read', safeArgs: { urls: ['https://example.com'] } },
  { name: 'cwv_get_field_data', module: 'cwv', service: 'cwv', type: 'read', safeArgs: { url: 'https://example.com' } },
  { name: 'cwv_compare_pages', module: 'cwv', service: 'cwv', type: 'read', safeArgs: { urls: ['https://example.com', 'https://example.org'] } },

  // --- Slack ---
  { name: 'slack_send_alert', module: 'slack', service: 'slack', type: 'write' },
  { name: 'slack_send_message', module: 'slack', service: 'slack', type: 'write' },
  { name: 'slack_list_channels', module: 'slack', service: 'slack', type: 'read', safeArgs: {} },

  // --- LinkedIn ---
  { name: 'li_get_profile', module: 'linkedin', service: 'linkedin', type: 'read', safeArgs: {} },
  { name: 'li_create_post', module: 'linkedin', service: 'linkedin', type: 'write' },
  { name: 'li_create_article', module: 'linkedin', service: 'linkedin', type: 'write' },
  { name: 'li_get_analytics', module: 'linkedin', service: 'linkedin', type: 'read', safeArgs: {} },
  { name: 'li_list_posts', module: 'linkedin', service: 'linkedin', type: 'read', safeArgs: {} },

  // --- Twitter ---
  { name: 'tw_create_tweet', module: 'twitter', service: 'twitter', type: 'write' },
  { name: 'tw_create_thread', module: 'twitter', service: 'twitter', type: 'write' },
  { name: 'tw_get_metrics', module: 'twitter', service: 'twitter', type: 'read', safeArgs: {} },
  { name: 'tw_list_tweets', module: 'twitter', service: 'twitter', type: 'read', safeArgs: {} },
  { name: 'tw_delete_tweet', module: 'twitter', service: 'twitter', type: 'write' },

  // --- Schema.org Structured Data ---
  { name: 'sd_validate', module: 'schema', service: 'wordpress_core', type: 'read', safeArgs: { url: '/' } },
  { name: 'sd_inject', module: 'schema', service: 'wordpress_core', type: 'write' },
  { name: 'sd_list_schemas', module: 'schema', service: 'wordpress_core', type: 'read', safeArgs: {} },
];

// Service detection probes: one canonical tool per service
const SERVICE_PROBES = {
  wordpress_core: 'get_active_site',
  woocommerce: 'wc_list_products',
  multisite: 'ms_list_sites',
  mailchimp: 'mc_list_audiences',
  buffer: 'buf_list_profiles',
  sendgrid: 'sg_list_templates',
  gsc: 'gsc_list_sites',
  ga4: 'ga4_top_pages',
  plausible: 'pl_get_stats',
  cwv: 'cwv_analyze_url',
  slack: 'slack_list_channels',
  linkedin: 'li_get_profile',
  twitter: 'tw_list_tweets',
};

// ── Write Sequences ─────────────────────────────────────────────────
// CRUD sequences: create → verify → update → verify → delete → verify(404)
// Each step extracts context for subsequent steps via `extract` and `as`.
const WRITE_SEQUENCES = [
  // --- Tier 1: Safe standalone CRUD ---
  {
    name: 'content', tier: 1, service: 'wordpress_core',
    steps: [
      { action: 'create', tool: 'create_content', args: { content_type: 'post', title: '[TEST] Validation Post', content: 'Test content — created by validation runner', status: 'draft' }, extract: 'id' },
      { action: 'verify', tool: 'get_content', argsFrom: ctx => ({ content_type: 'post', id: ctx.id }), expect: 'exists' },
      { action: 'update', tool: 'update_content', argsFrom: ctx => ({ content_type: 'post', id: ctx.id, title: '[TEST] Updated Validation Post' }) },
      { action: 'verify', tool: 'get_content', argsFrom: ctx => ({ content_type: 'post', id: ctx.id }), expect: 'exists' },
      { action: 'delete', tool: 'delete_content', argsFrom: ctx => ({ content_type: 'post', id: ctx.id, force: true }) },
    ],
    cleanup: ctx => ctx.id ? { tool: 'delete_content', args: { content_type: 'post', id: ctx.id, force: true } } : null,
  },
  {
    name: 'term', tier: 1, service: 'wordpress_core',
    steps: [
      { action: 'create', tool: 'create_term', args: { taxonomy: 'category', name: '[TEST] Validation Category' }, extract: 'id' },
      { action: 'verify', tool: 'get_term', argsFrom: ctx => ({ taxonomy: 'category', id: ctx.id }), expect: 'exists' },
      { action: 'update', tool: 'update_term', argsFrom: ctx => ({ taxonomy: 'category', id: ctx.id, name: '[TEST] Updated Category' }) },
      { action: 'verify', tool: 'get_term', argsFrom: ctx => ({ taxonomy: 'category', id: ctx.id }), expect: 'exists' },
      { action: 'delete', tool: 'delete_term', argsFrom: ctx => ({ taxonomy: 'category', id: ctx.id, force: true }) },
    ],
    cleanup: ctx => ctx.id ? { tool: 'delete_term', args: { taxonomy: 'category', id: ctx.id, force: true } } : null,
  },
  {
    name: 'comment', tier: 1, service: 'wordpress_core',
    // Needs a real post — uses dynamic postId resolved before running
    steps: [
      { action: 'create', tool: 'create_comment', argsFrom: ctx => ({ post: ctx._postId, content: '[TEST] Validation comment', author_name: 'Validator', author_email: 'test@validation.local' }), extract: 'id' },
      { action: 'verify', tool: 'get_comment', argsFrom: ctx => ({ id: ctx.id }), expect: 'exists' },
      { action: 'update', tool: 'update_comment', argsFrom: ctx => ({ id: ctx.id, content: '[TEST] Updated comment' }) },
      { action: 'verify', tool: 'get_comment', argsFrom: ctx => ({ id: ctx.id }), expect: 'exists' },
      { action: 'delete', tool: 'delete_comment', argsFrom: ctx => ({ id: ctx.id, force: true }) },
    ],
    cleanup: ctx => ctx.id ? { tool: 'delete_comment', args: { id: ctx.id, force: true } } : null,
  },
  {
    name: 'user', tier: 1, service: 'wordpress_core',
    steps: [
      { action: 'create', tool: 'create_user', argsFrom: () => ({ username: 'test_validator_' + Date.now(), email: `validator_${Date.now()}@test.local`, password: 'Val1dation!Test#2026', role: 'subscriber' }), extract: 'id' },
      { action: 'verify', tool: 'get_user', argsFrom: ctx => ({ id: ctx.id }), expect: 'exists' },
      { action: 'update', tool: 'update_user', argsFrom: ctx => ({ id: ctx.id, first_name: 'Test', last_name: 'Validator' }) },
      { action: 'verify', tool: 'get_user', argsFrom: ctx => ({ id: ctx.id }), expect: 'exists' },
      { action: 'delete', tool: 'delete_user', argsFrom: ctx => ({ id: ctx.id, reassign: 1, force: true }) },
    ],
    cleanup: ctx => ctx.id ? { tool: 'delete_user', args: { id: ctx.id, reassign: 1, force: true } } : null,
  },

  // --- Tier 2: CRUD with dependencies ---
  {
    name: 'media', tier: 2, service: 'wordpress_core',
    steps: [
      { action: 'create', tool: 'create_media', args: { title: '[TEST] Validation Image', source_url: 'https://s.w.org/images/core/emoji/15.0.3/72x72/2705.png' }, extract: 'id' },
      { action: 'verify', tool: 'get_media', argsFrom: ctx => ({ id: ctx.id }), expect: 'exists' },
      { action: 'update', tool: 'edit_media', argsFrom: ctx => ({ id: ctx.id, title: '[TEST] Updated Image', alt_text: 'validation test' }) },
      { action: 'verify', tool: 'get_media', argsFrom: ctx => ({ id: ctx.id }), expect: 'exists' },
      { action: 'delete', tool: 'delete_media', argsFrom: ctx => ({ id: ctx.id, force: true }) },
    ],
    cleanup: ctx => ctx.id ? { tool: 'delete_media', args: { id: ctx.id, force: true } } : null,
  },
  {
    name: 'plugin', tier: 2, service: 'wordpress_core',
    steps: [
      { action: 'create', tool: 'create_plugin', args: { slug: 'hello-dolly', status: 'inactive' }, extract: 'plugin' },
      { action: 'verify', tool: 'get_plugin', argsFrom: ctx => ({ plugin: ctx.plugin }), expect: 'exists' },
      { action: 'update', tool: 'activate_plugin', argsFrom: ctx => ({ plugin: ctx.plugin }) },
      { action: 'update', tool: 'deactivate_plugin', argsFrom: ctx => ({ plugin: ctx.plugin }) },
      { action: 'delete', tool: 'delete_plugin', argsFrom: ctx => ({ plugin: ctx.plugin }) },
    ],
    cleanup: ctx => ctx.plugin ? { tool: 'delete_plugin', args: { plugin: ctx.plugin } } : null,
  },
  {
    name: 'assign_terms', tier: 2, service: 'wordpress_core',
    steps: [
      // Create own test entities
      { action: 'create', tool: 'create_content', args: { content_type: 'post', title: '[TEST] Terms Assignment Post', content: 'test', status: 'draft' }, extract: 'id', as: 'postId' },
      { action: 'create', tool: 'create_term', args: { taxonomy: 'post_tag', name: '[TEST] Validation Tag' }, extract: 'id', as: 'tagId' },
      { action: 'update', tool: 'assign_terms_to_content', argsFrom: ctx => ({ content_id: ctx.postId, content_type: 'post', taxonomy: 'post_tag', terms: [ctx.tagId] }) },
      { action: 'verify', tool: 'get_content_terms', argsFrom: ctx => ({ content_id: ctx.postId, content_type: 'post' }), expect: 'exists' },
      // Cleanup created entities
      { action: 'delete', tool: 'delete_content', argsFrom: ctx => ({ content_type: 'post', id: ctx.postId, force: true }) },
      { action: 'delete', tool: 'delete_term', argsFrom: ctx => ({ taxonomy: 'post_tag', id: ctx.tagId, force: true }) },
    ],
    cleanup: ctx => {
      const tasks = [];
      if (ctx.postId) tasks.push({ tool: 'delete_content', args: { content_type: 'post', id: ctx.postId, force: true } });
      if (ctx.tagId) tasks.push({ tool: 'delete_term', args: { taxonomy: 'post_tag', id: ctx.tagId, force: true } });
      return tasks.length ? tasks : null;
    },
  },

  // --- Tier 3: Special operations ---
  {
    name: 'switch_site', tier: 3, service: 'wordpress_core',
    steps: [
      { action: 'verify', tool: 'get_active_site', args: {}, extract: 'site_id', as: 'originalSite', extractFn: text => { try { const d = JSON.parse(text); return d.site_id || d.id || text; } catch { return text; } } },
      { action: 'update', tool: 'switch_site', args: { site_id: 'othersite' } },
      { action: 'verify', tool: 'get_active_site', args: {}, expect: 'exists' },
      { action: 'update', tool: 'switch_site', argsFrom: ctx => ({ site_id: ctx.originalSite }) },
    ],
    cleanup: null,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function truncate(str, max = 200) {
  if (!str) return '';
  const s = String(str).replace(/\n/g, ' ');
  return s.length > max ? s.slice(0, max) + '...' : s;
}

function log(msg) {
  process.stderr.write(`[validation] ${msg}\n`);
}

// ── Write Sequence Executor ──────────────────────────────────────────
async function executeWriteSequences(client, services, delay, tierFilter = null) {
  const results = []; // per-tool results
  const cleanupQueue = []; // { tool, args } for emergency cleanup

  // Resolve a dynamic postId for comment sequence
  let sharedPostId = null;
  if (services.wordpress_core?.configured) {
    try {
      const r = await client.callTool({ name: 'list_content', arguments: { content_type: 'post', per_page: 1 } });
      const text = r.content?.[0]?.text || '';
      sharedPostId = JSON.parse(text)?.[0]?.id || null;
    } catch { /* ignore */ }
  }

  // Filter sequences by tier and service
  const sequences = WRITE_SEQUENCES.filter(seq => {
    if (tierFilter && seq.tier !== tierFilter) return false;
    const svc = services[seq.service];
    if (!svc || !svc.configured) return false;
    return true;
  });

  log(`Write sequences to run: ${sequences.map(s => `${s.name}(T${s.tier})`).join(', ') || 'none'}`);

  for (const seq of sequences) {
    log(`\n  ── Sequence: ${seq.name} (Tier ${seq.tier}) ──`);
    const ctx = { _postId: sharedPostId }; // shared context for this sequence
    let aborted = false;

    for (const step of seq.steps) {
      if (aborted && step.action !== 'delete') {
        // After abort, only attempt deletes (cleanup)
        results.push({
          name: step.tool,
          type: 'write',
          status: 'skipped',
          tested_at: null,
          duration_ms: null,
          response_preview: null,
          error_message: null,
          skip_reason: `Sequence "${seq.name}" aborted at earlier step`,
        });
        continue;
      }

      // Resolve arguments
      let toolArgs;
      if (step.argsFrom) {
        try {
          toolArgs = step.argsFrom(ctx);
        } catch (err) {
          results.push({
            name: step.tool,
            type: step.action === 'verify' ? 'read' : 'write',
            status: 'error',
            tested_at: new Date().toISOString(),
            duration_ms: 0,
            response_preview: null,
            error_message: `argsFrom failed: ${err.message}`,
            skip_reason: null,
          });
          if (step.action === 'create') aborted = true;
          continue;
        }
      } else {
        toolArgs = step.args || {};
      }

      // Execute tool call
      const startTime = Date.now();
      const toolResult = {
        name: step.tool,
        type: step.action === 'verify' ? 'read' : 'write',
        status: 'untested',
        tested_at: null,
        duration_ms: null,
        response_preview: null,
        error_message: null,
        skip_reason: null,
      };

      try {
        const result = await Promise.race([
          client.callTool({ name: step.tool, arguments: toolArgs }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)),
        ]);
        const elapsed = Date.now() - startTime;
        const text = result.content?.map(c => c.text || '').join(' ') || '';

        toolResult.tested_at = new Date().toISOString();
        toolResult.duration_ms = elapsed;
        toolResult.response_preview = truncate(`Seq:${seq.name} ${step.action} → ${text}`, 200);

        if (result.isError) {
          toolResult.status = 'failed';
          toolResult.error_message = truncate(text);
          if (step.action === 'create') aborted = true;
        } else {
          toolResult.status = 'passed';

          // Extract values into context
          if (step.extract) {
            let extracted;
            if (step.extractFn) {
              extracted = step.extractFn(text);
            } else {
              try {
                const parsed = JSON.parse(text);
                extracted = parsed[step.extract];
              } catch {
                // Try regex fallback for "id": 123 pattern
                const m = text.match(new RegExp(`"${step.extract}"\\s*:\\s*(\\d+|"[^"]+")`));
                if (m) extracted = m[1].replace(/"/g, '');
              }
            }
            if (extracted) {
              const key = step.as || step.extract;
              ctx[key] = extracted;
              log(`    → extracted ${key}=${extracted}`);
            }
          }

          // Register for cleanup if this was a create
          if (step.action === 'create' && seq.cleanup) {
            const cleanupSpec = seq.cleanup(ctx);
            if (cleanupSpec) {
              const specs = Array.isArray(cleanupSpec) ? cleanupSpec : [cleanupSpec];
              for (const spec of specs) {
                const tagged = { ...spec, seq: seq.name };
                // Deduplicate: don't re-add if same tool+args already queued
                const dup = cleanupQueue.find(c => c.tool === tagged.tool && c.seq === tagged.seq && JSON.stringify(c.args) === JSON.stringify(tagged.args));
                if (!dup) cleanupQueue.push(tagged);
              }
            }
          }
        }
      } catch (err) {
        toolResult.tested_at = new Date().toISOString();
        toolResult.duration_ms = Date.now() - startTime;
        toolResult.status = 'error';
        toolResult.error_message = truncate(err.message);
        if (step.action === 'create') aborted = true;
      }

      const icon = { passed: '+', failed: 'X', error: '!', skipped: '-' }[toolResult.status] || '?';
      log(`    [${icon}] ${step.action}:${step.tool} (${toolResult.duration_ms}ms)`);

      // For verify steps, don't add duplicate results — they test read tools
      // Only add results for write tools (create/update/delete)
      if (step.action !== 'verify') {
        results.push(toolResult);
      }

      // Remove from cleanup queue if delete succeeded
      if (step.action === 'delete' && toolResult.status === 'passed') {
        const idx = cleanupQueue.findIndex(c => c.tool === step.tool && c.seq === seq.name);
        if (idx >= 0) cleanupQueue.splice(idx, 1);
      }

      await sleep(delay);
    }
  }

  // ── Emergency Cleanup Phase ─────────────────────────────────────
  if (cleanupQueue.length > 0) {
    log(`\n  ── Cleanup: ${cleanupQueue.length} entity(s) to remove ──`);
    for (const item of cleanupQueue) {
      try {
        log(`    Cleaning: ${item.tool} ${JSON.stringify(item.args)}`);
        await client.callTool({ name: item.tool, arguments: item.args });
        log(`    → cleaned OK`);
      } catch (err) {
        log(`    → CLEANUP FAILED: ${err.message}`);
        log(`    ⚠ Manual cleanup needed: ${item.tool} ${JSON.stringify(item.args)}`);
      }
      await sleep(delay);
    }
  }

  return results;
}

// ── Interactive Mode ─────────────────────────────────────────────────
async function interactiveMode() {
  // Dynamic import of @clack/prompts from server's node_modules
  const clackPath = resolve(SERVER_DIR, 'node_modules/@clack/prompts/dist/index.mjs');
  const p = await import(clackPath);

  p.intro('WP REST Bridge — Validation Runner v' + RUNNER_VERSION);

  // 1. Site selection
  const sites = getConfiguredSites();
  let site = null;
  if (sites.length > 0) {
    site = await p.select({
      message: 'Seleziona il sito target',
      options: sites.map(s => ({ value: s.id, label: `${s.id} (${s.url})` })),
    });
    if (p.isCancel(site)) { p.cancel('Operazione annullata.'); return null; }
  } else {
    p.log.warn('Nessun sito configurato in WP_SITES_CONFIG — uso sito di default.');
  }

  // 2. Validation type
  const validationType = await p.select({
    message: 'Cosa vuoi validare?',
    options: [
      { value: 'read', label: 'Solo read tool' },
      { value: 'write-t1', label: 'Solo write tool (Tier 1 — CRUD base)' },
      { value: 'write-t2', label: 'Solo write tool (Tier 2 — con dipendenze)' },
      { value: 'write-all', label: 'Solo write tool (tutti i tier)' },
      { value: 'all', label: 'Tutto (read + write)' },
    ],
  });
  if (p.isCancel(validationType)) { p.cancel('Operazione annullata.'); return null; }

  // 3. Module filter
  const uniqueModules = [...new Set(TOOL_REGISTRY.map(t => t.module))].sort();
  const filterMod = await p.select({
    message: 'Filtrare per modulo? (opzionale)',
    options: [
      { value: null, label: 'Tutti i moduli' },
      ...uniqueModules.map(m => ({ value: m, label: m })),
    ],
  });
  if (p.isCancel(filterMod)) { p.cancel('Operazione annullata.'); return null; }

  // Derive config from selections
  const testReads = validationType === 'read' || validationType === 'all';
  const doTestWrites = validationType.startsWith('write') || validationType === 'all';
  let tier = null;
  if (validationType === 'write-t1') tier = 1;
  else if (validationType === 'write-t2') tier = 2;

  // 4. Confirmation
  const typeLabel = {
    'read': 'Read tools',
    'write-t1': 'Write Tier 1',
    'write-t2': 'Write Tier 2',
    'write-all': 'Write tutti i tier',
    'all': 'Read + Write',
  }[validationType];
  const modLabel = filterMod || 'tutti';
  const siteLabel = site || 'default';

  const confirmed = await p.confirm({
    message: `Eseguire validazione su ${siteLabel}?\n  ${typeLabel} | Modulo: ${modLabel}`,
  });
  if (p.isCancel(confirmed) || !confirmed) { p.cancel('Operazione annullata.'); return null; }

  return { site, testReads, testWrites: doTestWrites, filterTier: tier, filterModule: filterMod };
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  // ── Dual Mode Detection ────────────────────────────────────────
  const isInteractive = process.argv.length === 2;
  let config;

  if (isInteractive) {
    config = await interactiveMode();
    if (!config) process.exit(0); // user cancelled
  } else {
    config = {
      site: filterSite,
      testReads: !testWrites,  // default: read if not --test-writes
      testWrites: testWrites,
      filterTier,
      filterModule,
    };
  }

  log('WP REST Bridge Validation Runner v' + RUNNER_VERSION);

  // Ensure output directory exists
  mkdirSync(resolve(PROJECT_ROOT, 'docs/validation'), { recursive: true });

  // Import MCP SDK from server's node_modules
  const { Client } = await import(resolve(SDK_PATH, 'dist/esm/client/index.js'));
  const { StdioClientTransport } = await import(resolve(SDK_PATH, 'dist/esm/client/stdio.js'));

  const serverPath = resolve(SERVER_DIR, 'build/server.js');

  log(`Spawning server: node ${serverPath}`);
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: { ...process.env },
  });

  const client = new Client({ name: 'validation-runner', version: RUNNER_VERSION });

  try {
    await client.connect(transport);
    log('Connected to MCP server');

    // Switch site if specified (interactive or --site flag)
    if (config.site) {
      log(`Switching to site: ${config.site}`);
      await client.callTool({ name: 'switch_site', arguments: { site_id: config.site } });
    }

    // List tools from server
    const { tools: serverTools } = await client.listTools();
    const serverToolNames = new Set(serverTools.map(t => t.name));
    log(`Server reports ${serverToolNames.size} tools`);

    // Warn about unregistered tools
    for (const name of serverToolNames) {
      if (!TOOL_REGISTRY.find(t => t.name === name)) {
        log(`WARNING: Server tool "${name}" not in registry — add it to TOOL_REGISTRY`);
      }
    }
    for (const t of TOOL_REGISTRY) {
      if (!serverToolNames.has(t.name)) {
        log(`WARNING: Registry tool "${t.name}" not found on server`);
      }
    }

    // Filter registry by module if requested
    let registry = TOOL_REGISTRY;
    if (config.filterModule) {
      registry = registry.filter(t => t.module === config.filterModule);
      log(`Filtered to module "${config.filterModule}": ${registry.length} tools`);
    }

    // ── Service Detection ──────────────────────────────────────────
    log('Detecting service availability...');
    const services = {};
    for (const [service, probeTool] of Object.entries(SERVICE_PROBES)) {
      if (!serverToolNames.has(probeTool)) {
        services[service] = { configured: false, reason: 'probe tool not on server' };
        continue;
      }
      try {
        const probeEntry = TOOL_REGISTRY.find(t => t.name === probeTool);
        const probeArgs = probeEntry?.safeArgs || {};
        const result = await client.callTool({ name: probeTool, arguments: probeArgs });
        const text = result.content?.map(c => c.text || '').join(' ') || '';
        if (text.includes('not configured') || text.includes('Not configured')) {
          services[service] = { configured: false, reason: truncate(text, 100) };
        } else if (result.isError) {
          services[service] = { configured: false, reason: truncate(text, 100) };
        } else {
          services[service] = { configured: true };
        }
      } catch (err) {
        services[service] = { configured: false, reason: truncate(err.message, 100) };
      }
      await sleep(delay);
    }
    log('Service detection complete: ' + Object.entries(services).map(([k, v]) => `${k}=${v.configured ? 'OK' : 'NO'}`).join(', '));

    // ── Write Sequence Testing (--test-writes or interactive) ───
    if (config.testWrites) {
      log('\n=== WRITE TOOL TESTING (CRUD Sequences) ===');
      const writeResults = await executeWriteSequences(client, services, delay, config.filterTier);

      // Merge write results into existing results.json
      let existing = { meta: {}, services: {}, modules: {}, summary: { by_status: {} } };
      if (existsSync(RESULTS_PATH)) {
        try {
          existing = JSON.parse(readFileSync(RESULTS_PATH, 'utf-8'));
        } catch { /* start fresh if corrupted */ }
      }

      // Update meta
      existing.meta = {
        ...existing.meta,
        generated_at: new Date().toISOString(),
        runner_version: RUNNER_VERSION,
        last_write_test: new Date().toISOString(),
        write_test_tier: config.filterTier || 'all',
      };
      existing.services = { ...existing.services, ...services };

      // Update individual tool results within modules
      for (const wr of writeResults) {
        // Find which module this tool belongs to
        const regEntry = TOOL_REGISTRY.find(t => t.name === wr.name);
        if (!regEntry) continue;
        const mod = regEntry.module;
        if (!existing.modules[mod]) {
          existing.modules[mod] = { service: regEntry.service, tools: [] };
        }
        // Replace existing result for this tool, or add new
        const idx = existing.modules[mod].tools.findIndex(t => t.name === wr.name);
        if (idx >= 0) {
          existing.modules[mod].tools[idx] = wr;
        } else {
          existing.modules[mod].tools.push(wr);
        }
      }

      // Recalculate summary
      const allTools = Object.values(existing.modules).flatMap(m => m.tools);
      existing.summary.by_status = {};
      for (const status of ['passed', 'failed', 'error', 'not_configured', 'skipped_write', 'skipped', 'untested']) {
        existing.summary.by_status[status] = allTools.filter(r => r.status === status).length;
      }

      writeFileSync(RESULTS_PATH, JSON.stringify(existing, null, 2));
      generateMarkdown(existing);

      // Print summary
      const wPassed = writeResults.filter(r => r.status === 'passed').length;
      const wFailed = writeResults.filter(r => r.status === 'failed').length;
      const wError = writeResults.filter(r => r.status === 'error').length;
      const wSkipped = writeResults.filter(r => r.status === 'skipped').length;
      log(`\nWrite test summary: ${wPassed} passed, ${wFailed} failed, ${wError} errors, ${wSkipped} skipped`);
      log(`Results merged into ${RESULTS_PATH}`);
      log(`Markdown updated at ${VALIDATION_MD_PATH}`);

      // If not also testing reads, we're done
      if (!config.testReads) {
        await client.close();
        return;
      }
    }

    // ── Dynamic Args Resolution ──────────────────────────────────
    // For tools marked safeArgs:'dynamic', discover real IDs from the live site
    const dynamicArgs = {};
    if (services.wordpress_core?.configured) {
      log('Resolving dynamic test arguments...');
      try {
        // Discover a real post ID and slug
        const postsResult = await client.callTool({ name: 'list_content', arguments: { content_type: 'post', per_page: 1 } });
        const postsText = postsResult.content?.[0]?.text || '';
        const postId = JSON.parse(postsText)?.[0]?.id;
        const postSlug = JSON.parse(postsText)?.[0]?.slug;
        if (postId) {
          dynamicArgs.get_content = { content_type: 'post', id: postId };
          dynamicArgs.get_content_terms = { content_id: postId, content_type: 'post' };
          log(`  Post ID=${postId}, slug="${postSlug}"`);
        }
        if (postSlug) {
          dynamicArgs.get_content_by_slug = { slug: postSlug, content_types: ['post'] };
          dynamicArgs.find_content_by_url = { url: '/' + postSlug + '/' };
        }
        await sleep(delay);

        // Discover a real comment ID
        const commentsResult = await client.callTool({ name: 'list_comments', arguments: { per_page: 1 } });
        const commentsText = commentsResult.content?.[0]?.text || '';
        const commentId = JSON.parse(commentsText)?.[0]?.id;
        if (commentId) {
          dynamicArgs.get_comment = { id: commentId };
          log(`  Comment ID=${commentId}`);
        }
        await sleep(delay);

        // Discover a real plugin name
        const pluginsResult = await client.callTool({ name: 'list_plugins', arguments: { status: 'active' } });
        const pluginsText = pluginsResult.content?.[0]?.text || '';
        try {
          const plugins = JSON.parse(pluginsText);
          const firstPlugin = Array.isArray(plugins) ? plugins[0] : Object.values(plugins)[0];
          const pluginSlug = firstPlugin?.plugin || firstPlugin?.textdomain;
          if (pluginSlug) {
            dynamicArgs.get_plugin = { plugin: pluginSlug };
            log(`  Plugin="${pluginSlug}"`);
          }
        } catch { /* skip if parsing fails */ }
        await sleep(delay);

        // Discover a real media ID
        const mediaResult = await client.callTool({ name: 'list_media', arguments: { per_page: 1 } });
        const mediaText = mediaResult.content?.[0]?.text || '';
        const mediaId = JSON.parse(mediaText)?.[0]?.id;
        if (mediaId) {
          dynamicArgs.get_media = { id: mediaId };
          log(`  Media ID=${mediaId}`);
        }
        await sleep(delay);
      } catch (err) {
        log(`  Dynamic resolution error: ${err.message}`);
      }
    }

    // ── Tool Testing ───────────────────────────────────────────────
    log('Testing tools...');
    const toolResults = [];

    for (const entry of registry) {
      const toolResult = {
        name: entry.name,
        type: entry.type,
        status: 'untested',
        tested_at: null,
        duration_ms: null,
        response_preview: null,
        error_message: null,
        skip_reason: null,
      };

      // Skip writes unless --include-writes or interactive "all" mode
      if (entry.type === 'write' && !includeWrites && !config.testWrites) {
        toolResult.status = 'skipped_write';
        toolResult.skip_reason = 'Write tool — use --include-writes to test';
        toolResults.push(toolResult);
        continue;
      }

      // Skip if service not configured
      const svc = services[entry.service];
      if (svc && !svc.configured) {
        toolResult.status = 'not_configured';
        toolResult.skip_reason = `Service "${entry.service}" not configured`;
        toolResults.push(toolResult);
        continue;
      }

      // Resolve dynamic safeArgs
      let resolvedArgs = entry.safeArgs;
      if (entry.safeArgs === 'dynamic') {
        resolvedArgs = dynamicArgs[entry.name] || null;
        if (!resolvedArgs) {
          toolResult.status = 'skipped';
          toolResult.skip_reason = 'No data found for dynamic args resolution';
          toolResults.push(toolResult);
          continue;
        }
      }

      // Skip if no safeArgs defined for read tool
      if (!resolvedArgs) {
        toolResult.status = 'skipped';
        toolResult.skip_reason = 'No safe test arguments defined';
        toolResults.push(toolResult);
        continue;
      }

      // Skip if tool not on server
      if (!serverToolNames.has(entry.name)) {
        toolResult.status = 'skipped';
        toolResult.skip_reason = 'Tool not registered on server';
        toolResults.push(toolResult);
        continue;
      }

      // Execute tool call
      const startTime = Date.now();
      try {
        const result = await Promise.race([
          client.callTool({ name: entry.name, arguments: resolvedArgs }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)),
        ]);
        const elapsed = Date.now() - startTime;
        const text = result.content?.map(c => c.text || '').join(' ') || '';

        toolResult.tested_at = new Date().toISOString();
        toolResult.duration_ms = elapsed;
        toolResult.response_preview = truncate(text);

        if (result.isError) {
          toolResult.status = text.includes('not configured') || text.includes('Not configured')
            ? 'not_configured' : 'failed';
          toolResult.error_message = truncate(text);
        } else {
          toolResult.status = 'passed';
        }
      } catch (err) {
        toolResult.tested_at = new Date().toISOString();
        toolResult.duration_ms = Date.now() - startTime;
        toolResult.status = 'error';
        toolResult.error_message = truncate(err.message);
      }

      const icon = { passed: '+', failed: 'X', error: '!', not_configured: '~' }[toolResult.status] || '?';
      log(`  [${icon}] ${entry.name} (${toolResult.duration_ms}ms)`);
      toolResults.push(toolResult);
      await sleep(delay);
    }

    // ── Build Results ──────────────────────────────────────────────
    // Group by module
    const modules = {};
    for (const entry of registry) {
      if (!modules[entry.module]) {
        modules[entry.module] = { service: entry.service, tools: [] };
      }
      const result = toolResults.find(r => r.name === entry.name);
      if (result) modules[entry.module].tools.push(result);
    }

    // Summary
    const summary = { by_status: {} };
    for (const status of ['passed', 'failed', 'error', 'not_configured', 'skipped_write', 'skipped', 'untested']) {
      summary.by_status[status] = toolResults.filter(r => r.status === status).length;
    }

    // Get active site
    let activeSite = 'unknown';
    try {
      const siteResult = await client.callTool({ name: 'get_active_site', arguments: {} });
      activeSite = siteResult.content?.[0]?.text || 'unknown';
    } catch { /* ignore */ }

    const results = {
      meta: {
        generated_at: new Date().toISOString(),
        active_site: activeSite,
        total_tools_registered: TOOL_REGISTRY.length,
        total_tools_on_server: serverToolNames.size,
        runner_version: RUNNER_VERSION,
      },
      services,
      modules,
      summary,
    };

    // ── Merge incrementale ─────────────────────────────────────────
    if (config.filterModule && existsSync(RESULTS_PATH)) {
      log(`Merging results for module "${config.filterModule}" into existing results.json`);
      const existing = JSON.parse(readFileSync(RESULTS_PATH, 'utf-8'));
      existing.meta = results.meta;
      existing.services = { ...existing.services, ...results.services };
      for (const [mod, data] of Object.entries(results.modules)) {
        existing.modules[mod] = data;
      }
      // Recalculate summary from all modules
      const allTools = Object.values(existing.modules).flatMap(m => m.tools);
      for (const status of Object.keys(existing.summary.by_status)) {
        existing.summary.by_status[status] = allTools.filter(r => r.status === status).length;
      }
      writeFileSync(RESULTS_PATH, JSON.stringify(existing, null, 2));
      generateMarkdown(existing);
    } else {
      writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
      generateMarkdown(results);
    }

    log(`Results written to ${RESULTS_PATH}`);
    log(`Markdown written to ${VALIDATION_MD_PATH}`);
    log(`Summary: ${Object.entries(summary.by_status).map(([k, v]) => `${k}=${v}`).join(', ')}`);

    await client.close();
  } catch (err) {
    log(`Fatal error: ${err.message}`);
    try { await client.close(); } catch { /* ignore */ }
    process.exit(1);
  }
}

// ── Markdown Generator ─────────────────────────────────────────────
function generateMarkdown(results) {
  const { meta, services, modules, summary } = results;
  const lines = [];

  lines.push('# WP REST Bridge — Validation Report');
  lines.push('');
  lines.push(`> Generated: ${meta.generated_at}  `);
  lines.push(`> Active site: \`${meta.active_site}\`  `);
  lines.push(`> Tools registered: ${meta.total_tools_registered} | On server: ${meta.total_tools_on_server}  `);
  lines.push(`> Runner: v${meta.runner_version}`);
  lines.push('');

  // Service Configuration
  lines.push('## Service Configuration');
  lines.push('');
  lines.push('| Service | Status | Note |');
  lines.push('|---------|--------|------|');
  for (const [svc, info] of Object.entries(services)) {
    const icon = info.configured ? 'OK' : 'NO';
    lines.push(`| ${svc} | ${icon} | ${info.reason || ''} |`);
  }
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push('| Status | Count |');
  lines.push('|--------|-------|');
  for (const [status, count] of Object.entries(summary.by_status)) {
    lines.push(`| ${status} | ${count} |`);
  }
  const total = Object.values(summary.by_status).reduce((a, b) => a + b, 0);
  lines.push(`| **Total** | **${total}** |`);
  lines.push('');

  // Tool Inventory by Module
  lines.push('## Tool Inventory by Module');
  lines.push('');
  for (const [mod, data] of Object.entries(modules)) {
    lines.push(`### ${mod} (${data.service})`);
    lines.push('');
    lines.push('| Tool | Type | Status | Tested | Note |');
    lines.push('|------|------|--------|--------|------|');
    for (const t of data.tools) {
      const date = t.tested_at ? t.tested_at.split('T')[0] : '';
      const dur = t.duration_ms != null ? `${t.duration_ms}ms` : '';
      const note = t.error_message || t.skip_reason || (dur ? dur : '');
      lines.push(`| ${t.name} | ${t.type.toUpperCase()} | ${t.status} | ${date} | ${truncate(note, 80)} |`);
    }
    lines.push('');
  }

  // Failed Tools Detail
  const failed = Object.values(modules)
    .flatMap(m => m.tools)
    .filter(t => t.status === 'failed' || t.status === 'error');
  if (failed.length > 0) {
    lines.push('## Failed Tools Detail');
    lines.push('');
    for (const t of failed) {
      lines.push(`### ${t.name} (${t.status})`);
      lines.push(`- **Tested**: ${t.tested_at}`);
      lines.push(`- **Duration**: ${t.duration_ms}ms`);
      lines.push(`- **Error**: ${t.error_message}`);
      if (t.response_preview) lines.push(`- **Response**: ${t.response_preview}`);
      lines.push('');
    }
  }

  // Changelog
  lines.push('## Changelog');
  lines.push('');
  lines.push(`- ${meta.generated_at} — Run on \`${meta.active_site}\`: ${Object.entries(summary.by_status).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  lines.push('');

  writeFileSync(VALIDATION_MD_PATH, lines.join('\n'));
}

main().catch(err => {
  log(`Unhandled error: ${err.message}`);
  process.exit(1);
});
