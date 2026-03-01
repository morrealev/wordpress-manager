---
name: wp-analytics
description: This skill should be used when the user asks about "analytics",
  "GA4", "Google Analytics", "Plausible", "Core Web Vitals", "CWV",
  "PageSpeed", "page speed", "LCP", "CLS", "INP", "TTFB", "FCP",
  "traffic report", "traffic analysis", "site performance metrics",
  "web vitals", "real user metrics", or mentions monitoring
  WordPress site analytics and performance data.
version: 1.0.0
tags: [analytics, ga4, plausible, cwv, pagespeed, core-web-vitals]
---

# WordPress Analytics Skill

## Overview

Unified analytics covering 3 platforms (GA4, Plausible, Core Web Vitals) with 14 MCP tools. These tools enable traffic analysis, audience insights, performance monitoring, and cross-platform reporting directly from the WordPress management environment. By combining data from multiple analytics sources, you can build comprehensive performance dashboards, identify optimization opportunities, and track real user experience metrics.

## When to Use

- User wants to check GA4 traffic data (sessions, pageviews, conversions)
- User needs Plausible analytics (privacy-friendly, lightweight metrics)
- User asks about Core Web Vitals scores (LCP, CLS, INP, FCP, TTFB)
- User wants PageSpeed Insights analysis for specific URLs
- User needs a combined traffic report across analytics platforms
- User asks about performance trends, audience segments, or traffic sources
- User wants to compare metrics between GA4 and Plausible
- User needs to monitor real user experience metrics from CrUX data

## Decision Tree

1. **What analytics platform?**
   - "GA4" / "Google Analytics" / "sessions" / "conversions" → GA4 workflows (Section 1)
   - "Plausible" / "privacy analytics" / "simple analytics" → Plausible workflows (Section 2)
   - "Core Web Vitals" / "LCP" / "CLS" / "INP" / "PageSpeed" → CWV analysis (Section 3)
   - "traffic report" / "dashboard" / "compare" → Cross-platform reporting (Sections 4-6)

2. **Run detection first:**
   ```bash
   node skills/wp-analytics/scripts/analytics_inspect.mjs [--cwd=/path/to/project]
   ```
   This identifies configured analytics credentials and installed plugins.

## Service Overview

| Service | Tools | Auth Type | Use Case |
|---------|-------|-----------|----------|
| Google Analytics 4 | 6 tools (`ga4_*`) | Service Account JSON | Traffic, audience, conversions |
| Plausible Analytics | 4 tools (`pl_*`) | API Key | Privacy-friendly traffic metrics |
| Core Web Vitals | 4 tools (`cwv_*`) | Google API Key | Performance and user experience |

## Sections

### Section 1: GA4 Setup & Configuration
See `references/ga4-integration.md`
- Service Account creation in Google Cloud Console
- GA4 Data API v1beta enablement
- WP_SITES_CONFIG setup with ga4_property_id and ga4_service_account_key
- Property ID format and account structure
- Common dimensions and metrics reference
- Quota limits and sampling considerations

### Section 2: Plausible Setup & Configuration
See `references/plausible-setup.md`
- API key generation (cloud or self-hosted)
- WP_SITES_CONFIG setup with plausible_api_key and plausible_base_url
- Available metrics and properties
- Period and date range formats
- Filtering and breakdown options

### Section 3: Core Web Vitals Analysis
See `references/cwv-monitoring.md`
- Metric definitions (LCP, FCP, CLS, INP, TTFB)
- Good / needs-improvement / poor thresholds
- PageSpeed Insights API usage
- CrUX API for real user data
- WP_SITES_CONFIG setup with google_api_key

### Section 4: Traffic Report Generation
See `references/analytics-dashboards.md`
- Weekly and monthly report templates
- Key KPIs: sessions, pageviews, bounce rate, conversion rate
- Date range selection and comparison periods
- Combining data from multiple sources

### Section 5: Performance Dashboard
See `references/analytics-dashboards.md`
- Building composite dashboards from GA4 + Plausible + CWV
- Trend analysis and alerting thresholds
- Top pages by traffic and performance score
- Audience segmentation patterns

### Section 6: Cross-Platform Comparison
See `references/traffic-attribution.md`
- Comparing GA4 and Plausible traffic numbers
- UTM parameter tracking and source/medium mapping
- Combining analytics with WooCommerce conversion data
- Discrepancy analysis between platforms

## Reference Files

| File | Content |
|------|---------|
| `references/ga4-integration.md` | GA4 Data API setup, service account, dimensions/metrics, quotas |
| `references/plausible-setup.md` | Plausible API key, self-hosted vs cloud, metrics, periods |
| `references/cwv-monitoring.md` | CWV metric definitions, thresholds, PageSpeed/CrUX APIs |
| `references/analytics-dashboards.md` | Dashboard patterns, report templates, KPIs, combined data |
| `references/traffic-attribution.md` | UTM params, source/medium, GA4 + WooCommerce conversions |

## MCP Tools

| Tool | Description |
|------|-------------|
| `ga4_report` | Run a GA4 Data API report with custom dimensions and metrics |
| `ga4_realtime` | Get GA4 real-time active users and events |
| `ga4_top_pages` | Get top pages by pageviews, sessions, or engagement |
| `ga4_traffic_sources` | Get traffic source breakdown (source, medium, campaign) |
| `ga4_conversions` | Get conversion event data and goal completions |
| `ga4_audience` | Get audience demographics and technology breakdown |
| `pl_aggregate` | Get aggregate Plausible metrics for a time period |
| `pl_timeseries` | Get Plausible time-series data with configurable intervals |
| `pl_breakdown` | Get Plausible breakdown by property (page, source, country) |
| `pl_realtime` | Get Plausible real-time visitor count |
| `cwv_pagespeed` | Run PageSpeed Insights analysis on a URL |
| `cwv_crux_url` | Get CrUX real user metrics for a specific URL |
| `cwv_crux_origin` | Get CrUX real user metrics for an entire origin |
| `cwv_history` | Get CrUX historical Core Web Vitals data |

## Recommended Agent

Use the **`wp-monitoring-agent`** for automated analytics reporting, performance alerting, and scheduled dashboard generation that combines data across all three platforms.

## Related Skills

- **`wp-search-console`** — combine search analytics with traffic data for full SEO visibility
- **`wp-content-optimization`** — use analytics data to prioritize content optimization efforts
- **`wp-content-attribution`** — track content sources and attribute traffic to specific campaigns
- **`wp-monitoring`** — monitor site uptime and health alongside analytics performance

## Cross-references

- GA4 setup pairs with `wp-search-console` for combined Google data workflows
- CWV monitoring feeds into `wp-performance` for technical optimization
- Traffic attribution connects to `wp-social-email` for campaign tracking
- Dashboard patterns support `wp-monitoring` alerting workflows

## Troubleshooting

| Issue | Cause | Resolution |
|-------|-------|------------|
| GA4 returns empty data | Service account lacks Viewer role | Grant "Viewer" role on the GA4 property |
| GA4 quota exceeded | Too many API requests | Reduce request frequency; use date ranges instead of daily calls |
| Plausible 401 error | Invalid or expired API key | Regenerate API key in Plausible dashboard |
| Plausible returns no data | Site domain mismatch | Ensure site_id matches the domain registered in Plausible |
| CWV "API key not valid" | Google API key missing or restricted | Enable PageSpeed Insights API in Google Cloud Console |
| CWV no CrUX data | Low-traffic page | CrUX requires sufficient real user traffic; use lab data instead |
| Detection script exit 1 | No analytics config found | Add ga4_property_id, plausible_api_key, or google_api_key to WP_SITES_CONFIG |
| Plugin detected but no API data | Plugin handles tracking only | Plugins embed tracking code; API access requires separate credentials |
