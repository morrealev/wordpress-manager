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

### Section 7: Signal Feed Generation (Content Intelligence)
See `references/signals-feed-schema.md`
- Generating `.content-state/signals-feed.md` from analytics data
- NormalizedEvent format for GenSignal compatibility
- Delta calculation against previous period
- Anomaly detection with configurable threshold (default ±30%)
- Pattern matching: Search Intent Shift, Early-Adopter Surge, Hype→Utility Crossover
- Integration with wp-content-pipeline (Phase 1) and wp-editorial-planner (Phase 3)

## Reference Files

| File | Content |
|------|---------|
| `references/ga4-integration.md` | GA4 Data API setup, service account, dimensions/metrics, quotas |
| `references/plausible-setup.md` | Plausible API key, self-hosted vs cloud, metrics, periods |
| `references/cwv-monitoring.md` | CWV metric definitions, thresholds, PageSpeed/CrUX APIs |
| `references/analytics-dashboards.md` | Dashboard patterns, report templates, KPIs, combined data |
| `references/traffic-attribution.md` | UTM params, source/medium, GA4 + WooCommerce conversions |
| `references/signals-feed-schema.md` | NormalizedEvent format, delta rules, pattern matching, anomaly detection |

## Signal Feed Generation Workflow

### When to Use

- User asks to "generate signals", "analyze performance and create signals", "run content intelligence"
- User wants to understand which analytics trends are actionable
- User mentions GenSignal integration or NormalizedEvent
- After running a standard analytics report (Sections 1-6), user wants structured output for strategic planning

### Prerequisites

1. At least one analytics service configured (GA4, Plausible, or GSC)
2. A `.content-state/{site_id}.config.md` exists for the target site
3. Historical data for at least 2 periods (to calculate deltas)

### Step 7: GENERATE SIGNAL FEED

```
COLLECT → BASELINE → NORMALIZE → DELTA → ANOMALY → PATTERN → WRITE
```

**7.1 COLLECT — Gather current period data**

Call the following MCP tools for the requested period (default: last 30 days):

| Tool | Data Collected | Entity Type |
|------|---------------|-------------|
| `ga4_top_pages` | Top 20 pages by pageviews, sessions, engagement time | Page |
| `ga4_traffic_sources` | Source/medium breakdown with sessions, bounce rate | Source |
| `ga4_report` | Site-level aggregate: total sessions, pageviews, conversions | Site |
| `gsc_search_analytics` | Top 20 keywords by impressions, clicks, CTR, position | Keyword |
| `pl_aggregate` | If Plausible configured: visitors, pageviews, bounce_rate | Site (cross-validate) |
| `cwv_crux_origin` | If CrUX available: LCP, CLS, INP, FCP, TTFB | Site |

Not all tools need to succeed. Generate events only from tools that return data. Record which tools contributed in `source_tools` frontmatter.

**7.2 BASELINE — Load comparison period data**

Read the existing `.content-state/signals-feed.md` if present. Extract the `period` and events to use as baseline for delta calculation.

If no previous feed exists:
- Call the same tools with date range offset by the period length (e.g., if current period = Feb, baseline = Jan)
- If baseline tools fail: proceed without deltas (omit `delta_pct` fields)

Record the comparison period in `comparison_period` frontmatter field.

**7.3 NORMALIZE — Map to NormalizedEvent format**

For each data point from 7.1, create a NormalizedEvent:

```yaml
- entity_id: "{EntityType}:{identifier}"
  relation: "{metric_name}"
  value: {numeric_value}
  unit: "{count|seconds|percentage|position}"
  ts: "{period_end_ISO8601}"
  provenance:
    source_id: "{mcp_tool_name}"
    site: "{site_id}"
```

**Entity ID mapping:**
- GA4 top pages → `Page:{page_path}`
- GA4 traffic sources → `Source:{source_name}`
- GA4 site aggregates → `Site:{site_id}`
- GSC keywords → `Keyword:{query}`
- CWV metrics → `Site:{site_id}` with relation = metric name

**Relation mapping:**
- GA4 `screenPageViews` → `pageviews`
- GA4 `sessions` → `sessions` (page) or `total_sessions` (site)
- GA4 `averageSessionDuration` → `avg_engagement_time`
- GA4 `bounceRate` → `bounce_rate`
- GSC `impressions` → `search_impressions`
- GSC `clicks` → `search_clicks`
- GSC `ctr` → `search_ctr`
- GSC `position` → `search_position`
- CWV metrics → lowercase (e.g., `lcp`, `cls`, `inp`)

All CWV time-based metrics are normalized to seconds. API values in milliseconds should be divided by 1000.

**7.4 DELTA — Calculate percentage changes**

For each NormalizedEvent, find the matching baseline event (same `entity_id` + `relation`):

```
delta_pct = round(((current_value - baseline_value) / baseline_value) * 100)
```

Edge cases:
- Baseline = 0, current > 0 → `delta_pct: +999`
- Both = 0 → `delta_pct: 0`
- No baseline match → omit `delta_pct`

**7.5 ANOMALY — Identify significant changes**

Read `anomaly_threshold` from feed config (default: 30). Filter events where `|delta_pct| >= anomaly_threshold`.

**7.6 PATTERN — Match GenSignal patterns**

Check each anomaly against 3 detectable patterns:

**Search Intent Shift:**
- Entity is `Keyword:*`
- Conditions (any): `search_ctr` delta ≥ +20% with `search_position` delta ≤ +5%, OR `search_impressions` delta ≥ +50% on keywords with commercial modifiers, OR `search_impressions` delta ≥ +100% on any keyword
- Action: "Investigate: content cluster opportunity"

**Early-Adopter Surge:**
- Entity is `Source:*`
- Conditions: `referral_sessions` delta ≥ +50% AND site-level `total_sessions` delta < +20%
- Action: "Scale: increase posting frequency on {source}"

**Hype→Utility Crossover:**
- Entity is `Page:*`
- Conditions: `avg_engagement_time` delta ≥ +15% AND `bounce_rate` delta ≤ -10% AND `pageviews` delta between -20% and +10%
- Action: "Shift: add conversion touchpoints to {page}"

No pattern match → "Unclassified anomaly" / "Review: investigate cause"

**7.7 WRITE — Generate signals-feed.md**

Write `.content-state/signals-feed.md` with YAML frontmatter and organized body sections. See `references/signals-feed-schema.md` for exact format.

**After writing**, present summary to user:

```
Signal Feed generato per {site_id}:
- Periodo: {period}
- Eventi normalizzati: {count}
- Anomalie rilevate: {anomaly_count}
- Pattern riconosciuti: {pattern_list}

Anomalie principali:
1. {entity} — {relation} {delta}% → {pattern}: {action}
2. ...

Per approfondire un segnale con GenSignal: "approfondisci il segnale N con GenSignal"
Per creare brief dai segnali: "crea brief per i segnali azionabili"
```

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
- **`wp-content-pipeline`** — use signal insights to create content briefs for publishing

## Cross-references

- GA4 setup pairs with `wp-search-console` for combined Google data workflows
- CWV monitoring feeds into `wp-performance` for technical optimization
- Traffic attribution connects to `wp-social-email` for campaign tracking
- Dashboard patterns support `wp-monitoring` alerting workflows
- Signal feed generation bridges to `wp-content-pipeline` for data-driven content creation
- GenSignal integration: signals-feed.md is the exchange format between wp-analytics and GenSignal pattern detection

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
