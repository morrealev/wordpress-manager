---
name: wp-search-console
description: This skill should be used when the user asks about "Google Search Console",
  "GSC", "keyword tracking", "keyword rankings", "search analytics",
  "indexing status", "URL inspection", "sitemap management",
  "search performance", "SEO feedback", "content SEO",
  "competitor gap analysis", "keyword gap", or mentions monitoring
  WordPress site search performance.
version: 1.0.0
---

# WordPress Search Console Skill

## Overview

Google Search Console connects WordPress content to Google Search data via 8 MCP tools. These tools enable keyword tracking, indexing management, sitemap operations, and search performance analysis directly from the WordPress authoring environment. By bridging GSC data with WordPress content, you can identify optimization opportunities, monitor indexing health, and build data-driven content strategies.

## When to Use

- User wants to check how their WordPress pages perform in Google Search
- User needs to track keyword rankings and position changes over time
- User asks about indexing status or why a page is not appearing in Google
- User wants to submit or manage XML sitemaps
- User needs search analytics data (clicks, impressions, CTR, average position)
- User asks about content SEO improvements based on search data
- User wants to identify keyword gaps or content opportunities
- User needs to inspect a specific URL for crawl and indexing details

## Decision Tree

1. **What aspect of Search Console?**
   - "setup" / "connect GSC" / "service account" / "verify site" → GSC setup (Section 1)
   - "keyword tracking" / "rankings" / "position" / "top queries" → Keyword tracking (Section 2)
   - "indexing" / "URL inspection" / "sitemap" / "crawl" / "not indexed" → Indexing management (Section 3)
   - "content SEO" / "underperforming pages" / "content refresh" / "optimize title" → Content SEO feedback (Section 4)
   - "competitor gap" / "keyword gap" / "content opportunities" / "missing keywords" → Competitor gap analysis (Section 5)

2. **Run detection first:**
   ```bash
   node skills/wp-search-console/scripts/search_console_inspect.mjs [--cwd=/path/to/project]
   ```
   This identifies configured GSC credentials and verified sites.

## Service Overview

| Service | Tools | Auth Type | Use Case |
|---------|-------|-----------|----------|
| Google Search Console | 8 tools (`gsc_*`) | Service Account JSON | Search analytics, indexing, sitemaps |

## Sections

### Section 1: GSC Setup
See `references/gsc-setup.md`
- Service account creation in Google Cloud Console
- JSON key file configuration
- WP_SITES_CONFIG setup with gsc_service_account_key and gsc_site_url
- Site verification and permissions

### Section 2: Keyword Tracking
See `references/keyword-tracking.md`
- Using gsc_search_analytics and gsc_top_queries for keyword monitoring
- Date range and dimension filters
- Tracking position changes over time
- Query-level analysis (clicks, impressions, CTR, average position)

### Section 3: Indexing Management
See `references/indexing-management.md`
- Using gsc_inspect_url for indexing status checks
- Sitemap operations (list, submit, delete)
- Monitoring crawl coverage
- Handling indexing issues and bulk URL inspection

### Section 4: Content SEO Feedback
See `references/content-seo-feedback.md`
- Connecting search data to WordPress content strategy
- Identifying underperforming pages with gsc_page_performance
- Content refresh strategies based on declining metrics
- Title and meta description optimization from search data

### Section 5: Competitor Gap Analysis
See `references/competitor-gap-analysis.md`
- Identifying keyword gaps using search analytics data
- Analyzing query coverage vs potential queries
- Finding content opportunities from query data
- Cross-referencing with WordPress content inventory

## Reference Files

| File | Content |
|------|---------|
| `references/gsc-setup.md` | Service account creation, JSON key config, site verification |
| `references/keyword-tracking.md` | Search analytics queries, position monitoring, dashboards |
| `references/indexing-management.md` | URL inspection, sitemap management, crawl coverage |
| `references/content-seo-feedback.md` | Page performance, content refresh, title optimization |
| `references/competitor-gap-analysis.md` | Keyword gaps, content opportunities, position strategies |

## MCP Tools

| Tool | Description |
|------|-------------|
| `gsc_list_sites` | List all verified sites in Google Search Console |
| `gsc_search_analytics` | Query search analytics data with dimensions and filters |
| `gsc_inspect_url` | Inspect a URL for indexing status and crawl details |
| `gsc_list_sitemaps` | List submitted sitemaps and their status |
| `gsc_submit_sitemap` | Submit a new sitemap URL to GSC |
| `gsc_delete_sitemap` | Remove a sitemap from GSC |
| `gsc_top_queries` | Get top search queries with clicks, impressions, CTR, position |
| `gsc_page_performance` | Get page-level performance data with search metrics |

## Recommended Agent

Use the **`wp-content-strategist`** agent for SEO feedback loops and content optimization workflows that combine Search Console data with WordPress content management.

## Related Skills

- **`wp-programmatic-seo`** — generate SEO-optimized content at scale using search data
- **`wp-content-attribution`** — track content sources and attribute search traffic
- **`wp-monitoring`** — monitor site health metrics alongside search performance
- **`wp-social-email`** — distribute optimized content across social and email channels
- **`wp-content`** — create and manage WordPress content informed by search analytics
- **`wp-content-optimization`** — use GSC data as input for AI-driven content optimization and triage
- Per correlare keyword GSC con traffico GA4, vedi `wp-analytics`
