# Keyword Tracking

## Overview

Keyword tracking uses GSC search analytics data to monitor how your WordPress site ranks for specific queries in Google Search. The `gsc_search_analytics` and `gsc_top_queries` tools provide clicks, impressions, CTR, and average position data that can be filtered by date range, query, page, country, and device.

## Core Tools

### Get top queries

```
Tool: gsc_top_queries
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  row_limit: 50
Returns: Array of queries with clicks, impressions, ctr, position
```

This returns the top-performing queries ranked by clicks. Use `row_limit` to control how many queries are returned (default: 25, max: 25000).

### Query search analytics with dimensions

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query", "page"]
  row_limit: 100
Returns: Array of rows with keys (query, page), clicks, impressions, ctr, position
```

Available dimensions:
- `query` — the search query text
- `page` — the URL that appeared in search results
- `country` — ISO 3166-1 alpha-3 country code
- `device` — DESKTOP, MOBILE, or TABLET
- `date` — individual date breakdown

### Filter by specific query

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query", "date"]
  dimension_filter_groups:
    - filters:
        - dimension: "query"
          operator: "contains"
          expression: "wordpress seo"
  row_limit: 100
```

Filter operators:
- `contains` — query contains the expression
- `equals` — exact match
- `notContains` — excludes queries containing the expression
- `notEquals` — excludes exact matches

## Tracking Position Changes Over Time

### Daily position tracking

To track how a keyword's position changes day by day:

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query", "date"]
  dimension_filter_groups:
    - filters:
        - dimension: "query"
          operator: "equals"
          expression: "best wordpress plugins"
  row_limit: 28
```

This returns one row per day for the specific query, showing position movement across the date range.

### Compare periods

To compare performance between two periods, make two `gsc_search_analytics` calls with different date ranges and compare the results:

```
# Period 1: Previous month
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-01-01"
  end_date: "2026-01-31"
  dimensions: ["query"]
  row_limit: 100

# Period 2: Current month
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query"]
  row_limit: 100
```

Compare `position`, `clicks`, and `impressions` between periods to identify improving and declining keywords.

## Query-Level Analysis

### High-impression, low-CTR queries

These are queries where your page appears frequently but users rarely click — indicating a title or meta description optimization opportunity:

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query", "page"]
  row_limit: 200
```

Filter results where `impressions > 100` and `ctr < 0.02` (2%). These queries should be prioritized for title tag and meta description improvements.

### Position 4-20 keywords (striking distance)

Keywords ranking on positions 4-20 are in "striking distance" — small improvements can move them to page 1 or top 3:

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query", "page"]
  row_limit: 500
```

Filter results where `position >= 4` and `position <= 20` and `impressions > 50`. These are the highest-ROI optimization targets.

### Device-specific rankings

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query", "device"]
  row_limit: 100
```

Compare mobile vs desktop rankings. Significant position differences may indicate mobile usability issues.

## Creating Keyword Dashboards

Build a comprehensive keyword report by combining multiple queries:

1. **Top 50 queries by clicks** — `gsc_top_queries` with `row_limit: 50`
2. **Position trends for target keywords** — `gsc_search_analytics` with `dimensions: ["query", "date"]` filtered by target queries
3. **Page-level performance** — `gsc_page_performance` to see which pages drive the most search traffic
4. **Country breakdown** — `gsc_search_analytics` with `dimensions: ["query", "country"]` for geo-specific insights

## Best Practices

- **Date range selection**: Use at least 28 days of data for reliable averages; short ranges (< 7 days) produce noisy data
- **Regular monitoring**: Track core keywords weekly to catch position drops early; monthly for trend analysis
- **Segment by intent**: Group queries by intent (informational, transactional, navigational) to align with content strategy
- **Position averages**: GSC reports average position weighted by impressions; a page ranking #1 for one query and #50 for another may show position 25
- **Data freshness**: GSC data has a 2-3 day delay; do not expect same-day data
- **Row limits**: Default row limit is 1000; for comprehensive audits, increase to 25000
- **Branded vs non-branded**: Separate branded queries (containing your brand name) from non-branded to get a clearer picture of organic discovery
- **Click vs impression trends**: Rising impressions with flat clicks indicates a CTR problem; rising clicks with flat impressions indicates improved CTR or rankings
