# WP REST Bridge — Validation Report

> Generated: 2026-03-01T20:15:23.449Z  
> Active site: `opencactus`  
> Tools registered: 148 | On server: 135  
> Runner: v1.1.0

## Service Configuration

| Service | Status | Note |
|---------|--------|------|
| wordpress_core | OK |  |
| woocommerce | NO | Error listing products: WooCommerce not configured for site "opencactus". Add wc_consumer_key and wc... |
| multisite | NO | Error listing sites: Site is not configured as multisite. Set is_multisite: true in WP_SITES_CONFIG. |
| mailchimp | NO | Mailchimp not configured. Add mailchimp_api_key to WP_SITES_CONFIG. |
| buffer | NO | Buffer not configured. Add buffer_access_token to WP_SITES_CONFIG. |
| sendgrid | NO | SendGrid not configured. Add sendgrid_api_key to WP_SITES_CONFIG. |
| gsc | NO | GSC not configured. Add gsc_service_account_key and gsc_site_url to WP_SITES_CONFIG. |
| ga4 | NO | MCP error -32602: Input validation error: Invalid arguments for tool ga4_top_pages: [   {     "code"... |
| plausible | NO | MCP error -32602: Input validation error: Invalid arguments for tool pl_get_stats: [   {     "code":... |
| cwv | NO | Google API key not configured. Add google_api_key to WP_SITES_CONFIG. |
| slack | NO | Slack Bot not configured. Add slack_bot_token to WP_SITES_CONFIG. |
| linkedin | NO | probe tool not on server |
| twitter | NO | probe tool not on server |

## Summary

| Status | Count |
|--------|-------|
| passed | 42 |
| failed | 0 |
| error | 0 |
| not_configured | 64 |
| skipped_write | 38 |
| skipped | 4 |
| untested | 0 |
| **Total** | **148** |

## Tool Inventory by Module

### unified-content (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| list_content | READ | passed | 2026-03-01 | 436ms |
| get_content | READ | passed | 2026-03-01 | 374ms |
| create_content | WRITE | passed | 2026-03-01 | 403ms |
| update_content | WRITE | passed | 2026-03-01 | 402ms |
| delete_content | WRITE | passed | 2026-03-01 | 361ms |
| discover_content_types | READ | passed | 2026-03-01 | 431ms |
| find_content_by_url | READ | passed | 2026-03-01 | 462ms |
| get_content_by_slug | READ | passed | 2026-03-01 | 518ms |

### unified-taxonomies (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| discover_taxonomies | READ | passed | 2026-03-01 | 928ms |
| list_terms | READ | passed | 2026-03-01 | 307ms |
| get_term | READ | passed | 2026-03-01 | 386ms |
| create_term | WRITE | passed | 2026-03-01 | 375ms |
| update_term | WRITE | passed | 2026-03-01 | 417ms |
| delete_term | WRITE | passed | 2026-03-01 | 336ms |
| assign_terms_to_content | WRITE | passed | 2026-03-01 | 1642ms |
| get_content_terms | READ | passed | 2026-03-01 | 659ms |

### comments (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| list_comments | READ | passed | 2026-03-01 | 416ms |
| get_comment | READ | skipped |  | No data found for dynamic args resolution |
| create_comment | WRITE | passed | 2026-03-01 | 1608ms |
| update_comment | WRITE | passed | 2026-03-01 | 376ms |
| delete_comment | WRITE | passed | 2026-03-01 | 375ms |

### media (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| list_media | READ | passed | 2026-03-01 | 306ms |
| get_media | WRITE | skipped |  | Sequence "media" aborted at earlier step |
| create_media | WRITE | passed | 2026-03-01 | 715ms |
| edit_media | WRITE | passed | 2026-03-01 | 366ms |
| delete_media | WRITE | passed | 2026-03-01 | 377ms |

### users (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| list_users | READ | passed | 2026-03-01 | 414ms |
| get_user | READ | passed | 2026-03-01 | 407ms |
| get_me | READ | passed | 2026-03-01 | 312ms |
| create_user | WRITE | passed | 2026-03-01 | 533ms |
| update_user | WRITE | passed | 2026-03-01 | 604ms |
| delete_user | WRITE | passed | 2026-03-01 | 483ms |

### plugins (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| list_plugins | READ | passed | 2026-03-01 | 394ms |
| get_plugin | READ | passed | 2026-03-01 | 408ms |
| activate_plugin | WRITE | passed | 2026-03-01 | 433ms |
| deactivate_plugin | WRITE | passed | 2026-03-01 | 424ms |
| create_plugin | WRITE | passed | 2026-03-01 | 1648ms |
| delete_plugin | WRITE | passed | 2026-03-01 | 358ms |

### search (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| wp_search | READ | passed | 2026-03-01 | 418ms |

### plugin-repository (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| search_plugin_repository | READ | passed | 2026-03-01 | 1302ms |
| get_plugin_details | READ | passed | 2026-03-01 | 670ms |

### server (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| switch_site | WRITE | passed | 2026-03-01 | 2ms |
| list_sites | READ | passed | 2026-03-01 | 3ms |
| get_active_site | READ | passed | 2026-03-01 | 2ms |

### multisite-network (multisite)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| ms_list_network_plugins | READ | not_configured |  | Service "multisite" not configured |
| ms_network_activate_plugin | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| ms_network_deactivate_plugin | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| ms_list_super_admins | READ | not_configured |  | Service "multisite" not configured |
| ms_get_network_settings | READ | not_configured |  | Service "multisite" not configured |

### multisite-sites (multisite)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| ms_list_sites | READ | not_configured |  | Service "multisite" not configured |
| ms_get_site | READ | not_configured |  | Service "multisite" not configured |
| ms_create_site | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| ms_activate_site | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| ms_delete_site | WRITE | skipped_write |  | Write tool — use --include-writes to test |

### wc-products (woocommerce)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| wc_list_products | READ | not_configured |  | Service "woocommerce" not configured |
| wc_get_product | READ | not_configured |  | Service "woocommerce" not configured |
| wc_create_product | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| wc_update_product | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| wc_delete_product | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| wc_list_product_categories | READ | not_configured |  | Service "woocommerce" not configured |
| wc_list_product_variations | READ | not_configured |  | Service "woocommerce" not configured |

### wc-orders (woocommerce)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| wc_list_orders | READ | not_configured |  | Service "woocommerce" not configured |
| wc_get_order | READ | not_configured |  | Service "woocommerce" not configured |
| wc_update_order_status | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| wc_list_order_notes | READ | not_configured |  | Service "woocommerce" not configured |
| wc_create_order_note | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| wc_create_refund | WRITE | skipped_write |  | Write tool — use --include-writes to test |

### wc-customers (woocommerce)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| wc_list_customers | READ | not_configured |  | Service "woocommerce" not configured |
| wc_get_customer | READ | not_configured |  | Service "woocommerce" not configured |
| wc_create_customer | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| wc_update_customer | WRITE | skipped_write |  | Write tool — use --include-writes to test |

### wc-coupons (woocommerce)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| wc_list_coupons | READ | not_configured |  | Service "woocommerce" not configured |
| wc_get_coupon | READ | not_configured |  | Service "woocommerce" not configured |
| wc_create_coupon | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| wc_delete_coupon | WRITE | skipped_write |  | Write tool — use --include-writes to test |

### wc-reports (woocommerce)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| wc_get_sales_report | READ | not_configured |  | Service "woocommerce" not configured |
| wc_get_top_sellers | READ | not_configured |  | Service "woocommerce" not configured |
| wc_get_orders_totals | READ | not_configured |  | Service "woocommerce" not configured |
| wc_get_products_totals | READ | not_configured |  | Service "woocommerce" not configured |
| wc_get_customers_totals | READ | not_configured |  | Service "woocommerce" not configured |

### wc-settings (woocommerce)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| wc_list_payment_gateways | READ | not_configured |  | Service "woocommerce" not configured |
| wc_list_shipping_zones | READ | not_configured |  | Service "woocommerce" not configured |
| wc_get_tax_classes | READ | not_configured |  | Service "woocommerce" not configured |
| wc_get_system_status | READ | not_configured |  | Service "woocommerce" not configured |

### wc-webhooks (woocommerce)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| wc_list_webhooks | READ | not_configured |  | Service "woocommerce" not configured |
| wc_create_webhook | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| wc_update_webhook | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| wc_delete_webhook | WRITE | skipped_write |  | Write tool — use --include-writes to test |

### wc-workflows (woocommerce)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| wf_list_triggers | READ | not_configured |  | Service "woocommerce" not configured |
| wf_create_trigger | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| wf_update_trigger | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| wf_delete_trigger | WRITE | skipped_write |  | Write tool — use --include-writes to test |

### mailchimp (mailchimp)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| mc_list_audiences | READ | not_configured |  | Service "mailchimp" not configured |
| mc_get_audience_members | READ | not_configured |  | Service "mailchimp" not configured |
| mc_create_campaign | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| mc_update_campaign_content | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| mc_send_campaign | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| mc_get_campaign_report | READ | not_configured |  | Service "mailchimp" not configured |
| mc_add_subscriber | WRITE | skipped_write |  | Write tool — use --include-writes to test |

### buffer (buffer)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| buf_list_profiles | READ | not_configured |  | Service "buffer" not configured |
| buf_create_update | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| buf_list_pending | READ | not_configured |  | Service "buffer" not configured |
| buf_list_sent | READ | not_configured |  | Service "buffer" not configured |
| buf_get_analytics | READ | not_configured |  | Service "buffer" not configured |

### sendgrid (sendgrid)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| sg_send_email | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| sg_list_templates | READ | not_configured |  | Service "sendgrid" not configured |
| sg_get_template | READ | not_configured |  | Service "sendgrid" not configured |
| sg_list_contacts | READ | not_configured |  | Service "sendgrid" not configured |
| sg_add_contacts | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| sg_get_stats | READ | not_configured |  | Service "sendgrid" not configured |

### gsc (gsc)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| gsc_list_sites | READ | not_configured |  | Service "gsc" not configured |
| gsc_search_analytics | READ | not_configured |  | Service "gsc" not configured |
| gsc_inspect_url | READ | not_configured |  | Service "gsc" not configured |
| gsc_list_sitemaps | READ | not_configured |  | Service "gsc" not configured |
| gsc_submit_sitemap | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| gsc_delete_sitemap | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| gsc_top_queries | READ | not_configured |  | Service "gsc" not configured |
| gsc_page_performance | READ | not_configured |  | Service "gsc" not configured |

### ga4 (ga4)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| ga4_run_report | READ | not_configured |  | Service "ga4" not configured |
| ga4_get_realtime | READ | not_configured |  | Service "ga4" not configured |
| ga4_top_pages | READ | not_configured |  | Service "ga4" not configured |
| ga4_traffic_sources | READ | not_configured |  | Service "ga4" not configured |
| ga4_user_demographics | READ | not_configured |  | Service "ga4" not configured |
| ga4_conversion_events | READ | not_configured |  | Service "ga4" not configured |

### plausible (plausible)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| pl_get_stats | READ | not_configured |  | Service "plausible" not configured |
| pl_get_timeseries | READ | not_configured |  | Service "plausible" not configured |
| pl_get_breakdown | READ | not_configured |  | Service "plausible" not configured |
| pl_get_realtime | READ | not_configured |  | Service "plausible" not configured |

### cwv (cwv)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| cwv_analyze_url | READ | not_configured |  | Service "cwv" not configured |
| cwv_batch_analyze | READ | not_configured |  | Service "cwv" not configured |
| cwv_get_field_data | READ | not_configured |  | Service "cwv" not configured |
| cwv_compare_pages | READ | not_configured |  | Service "cwv" not configured |

### slack (slack)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| slack_send_alert | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| slack_send_message | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| slack_list_channels | READ | not_configured |  | Service "slack" not configured |

### linkedin (linkedin)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| li_get_profile | READ | not_configured |  | Service "linkedin" not configured |
| li_create_post | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| li_create_article | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| li_get_analytics | READ | not_configured |  | Service "linkedin" not configured |
| li_list_posts | READ | not_configured |  | Service "linkedin" not configured |

### twitter (twitter)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| tw_create_tweet | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| tw_create_thread | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| tw_get_metrics | READ | not_configured |  | Service "twitter" not configured |
| tw_list_tweets | READ | not_configured |  | Service "twitter" not configured |
| tw_delete_tweet | WRITE | skipped_write |  | Write tool — use --include-writes to test |

### schema (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| sd_validate | READ | skipped |  | Tool not registered on server |
| sd_inject | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| sd_list_schemas | READ | skipped |  | Tool not registered on server |

## Changelog

- 2026-03-01T20:15:23.449Z — Run on `opencactus`: passed=42, failed=0, error=0, not_configured=64, skipped_write=38, skipped=4, untested=0
