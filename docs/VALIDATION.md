# WP REST Bridge — Validation Report

> Generated: 2026-03-01T18:51:27.939Z  
> Active site: `opencactus`  
> Tools registered: 148 | On server: 148  
> Runner: v1.0.0

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
| linkedin | NO | LinkedIn not configured. Add linkedin_access_token to WP_SITES_CONFIG. |
| twitter | NO | Twitter not configured. Add twitter_bearer_token to WP_SITES_CONFIG. |

## Summary

| Status | Count |
|--------|-------|
| passed | 14 |
| failed | 11 |
| error | 0 |
| not_configured | 64 |
| skipped_write | 59 |
| skipped | 0 |
| untested | 0 |
| **Total** | **148** |

## Tool Inventory by Module

### unified-content (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| list_content | READ | failed | 2026-03-01 | MCP error -32602: Input validation error: Invalid arguments for tool list_conten... |
| get_content | READ | failed | 2026-03-01 | MCP error -32602: Input validation error: Invalid arguments for tool get_content... |
| create_content | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| update_content | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| delete_content | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| discover_content_types | READ | passed | 2026-03-01 | 358ms |
| find_content_by_url | READ | failed | 2026-03-01 | Error finding content by URL: Could not extract slug from URL |
| get_content_by_slug | READ | failed | 2026-03-01 | Error getting content by slug: No content found with slug: hello-world |

### unified-taxonomies (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| discover_taxonomies | READ | passed | 2026-03-01 | 341ms |
| list_terms | READ | passed | 2026-03-01 | 431ms |
| get_term | READ | passed | 2026-03-01 | 342ms |
| create_term | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| update_term | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| delete_term | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| assign_terms_to_content | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| get_content_terms | READ | failed | 2026-03-01 | MCP error -32602: Input validation error: Invalid arguments for tool get_content... |

### comments (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| list_comments | READ | passed | 2026-03-01 | 297ms |
| get_comment | READ | failed | 2026-03-01 | Error getting comment: ID commento non valido. |
| create_comment | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| update_comment | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| delete_comment | WRITE | skipped_write |  | Write tool — use --include-writes to test |

### media (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| list_media | READ | passed | 2026-03-01 | 287ms |
| get_media | READ | failed | 2026-03-01 | Error getting media: ID articolo non valido. |
| create_media | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| edit_media | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| delete_media | WRITE | skipped_write |  | Write tool — use --include-writes to test |

### users (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| list_users | READ | passed | 2026-03-01 | 379ms |
| get_user | READ | passed | 2026-03-01 | 365ms |
| get_me | READ | passed | 2026-03-01 | 371ms |
| create_user | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| update_user | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| delete_user | WRITE | skipped_write |  | Write tool — use --include-writes to test |

### plugins (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| list_plugins | READ | passed | 2026-03-01 | 439ms |
| get_plugin | READ | failed | 2026-03-01 | Error retrieving plugin: Nessun percorso fornisce una corrispondenza tra l'URL e... |
| activate_plugin | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| deactivate_plugin | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| create_plugin | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| delete_plugin | WRITE | skipped_write |  | Write tool — use --include-writes to test |

### search (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| wp_search | READ | passed | 2026-03-01 | 337ms |

### plugin-repository (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| search_plugin_repository | READ | failed | 2026-03-01 | Error searching plugin repository: Request failed with status code 405 |
| get_plugin_details | READ | failed | 2026-03-01 | Error getting plugin details: Request failed with status code 405 |

### server (wordpress_core)

| Tool | Type | Status | Tested | Note |
|------|------|--------|--------|------|
| switch_site | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| list_sites | READ | passed | 2026-03-01 | 1ms |
| get_active_site | READ | passed | 2026-03-01 | 3ms |

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
| sd_validate | READ | failed | 2026-03-01 | Error validating schema: Invalid URL |
| sd_inject | WRITE | skipped_write |  | Write tool — use --include-writes to test |
| sd_list_schemas | READ | passed | 2026-03-01 | 477ms |

## Failed Tools Detail

### list_content (failed)
- **Tested**: 2026-03-01T18:51:13.581Z
- **Duration**: 3ms
- **Error**: MCP error -32602: Input validation error: Invalid arguments for tool list_content: [   {     "code": "invalid_type",     "expected": "string",     "received": "undefined",     "path": [       "content...
- **Response**: MCP error -32602: Input validation error: Invalid arguments for tool list_content: [   {     "code": "invalid_type",     "expected": "string",     "received": "undefined",     "path": [       "content...

### get_content (failed)
- **Tested**: 2026-03-01T18:51:13.685Z
- **Duration**: 2ms
- **Error**: MCP error -32602: Input validation error: Invalid arguments for tool get_content: [   {     "code": "invalid_type",     "expected": "string",     "received": "undefined",     "path": [       "content_...
- **Response**: MCP error -32602: Input validation error: Invalid arguments for tool get_content: [   {     "code": "invalid_type",     "expected": "string",     "received": "undefined",     "path": [       "content_...

### find_content_by_url (failed)
- **Tested**: 2026-03-01T18:51:14.251Z
- **Duration**: 5ms
- **Error**: Error finding content by URL: Could not extract slug from URL
- **Response**: Error finding content by URL: Could not extract slug from URL

### get_content_by_slug (failed)
- **Tested**: 2026-03-01T18:51:19.204Z
- **Duration**: 4853ms
- **Error**: Error getting content by slug: No content found with slug: hello-world
- **Response**: Error getting content by slug: No content found with slug: hello-world

### get_content_terms (failed)
- **Tested**: 2026-03-01T18:51:20.723Z
- **Duration**: 2ms
- **Error**: MCP error -32602: Input validation error: Invalid arguments for tool get_content_terms: [   {     "code": "invalid_type",     "expected": "number",     "received": "undefined",     "path": [       "co...
- **Response**: MCP error -32602: Input validation error: Invalid arguments for tool get_content_terms: [   {     "code": "invalid_type",     "expected": "number",     "received": "undefined",     "path": [       "co...

### get_comment (failed)
- **Tested**: 2026-03-01T18:51:21.772Z
- **Duration**: 551ms
- **Error**: Error getting comment: ID commento non valido.
- **Response**: Error getting comment: ID commento non valido.

### get_media (failed)
- **Tested**: 2026-03-01T18:51:22.574Z
- **Duration**: 315ms
- **Error**: Error getting media: ID articolo non valido.
- **Response**: Error getting media: ID articolo non valido.

### get_plugin (failed)
- **Tested**: 2026-03-01T18:51:25.044Z
- **Duration**: 413ms
- **Error**: Error retrieving plugin: Nessun percorso fornisce una corrispondenza tra l'URL ed il metodo richiesto.
- **Response**: Error retrieving plugin: Nessun percorso fornisce una corrispondenza tra l'URL ed il metodo richiesto.

### search_plugin_repository (failed)
- **Tested**: 2026-03-01T18:51:26.197Z
- **Duration**: 616ms
- **Error**: Error searching plugin repository: Request failed with status code 405
- **Response**: Error searching plugin repository: Request failed with status code 405

### get_plugin_details (failed)
- **Tested**: 2026-03-01T18:51:26.946Z
- **Duration**: 648ms
- **Error**: Error getting plugin details: Request failed with status code 405
- **Response**: Error getting plugin details: Request failed with status code 405

### sd_validate (failed)
- **Tested**: 2026-03-01T18:51:27.258Z
- **Duration**: 6ms
- **Error**: Error validating schema: Invalid URL
- **Response**: Error validating schema: Invalid URL

## Changelog

- 2026-03-01T18:51:27.939Z — Run on `opencactus`: passed=14, failed=11, error=0, not_configured=64, skipped_write=59, skipped=0, untested=0
