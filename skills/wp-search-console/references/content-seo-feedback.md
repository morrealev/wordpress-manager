# Content SEO Feedback

## Overview

Content SEO feedback connects Google Search Console performance data to WordPress content strategy. By analyzing page-level metrics (clicks, impressions, CTR, position), you can identify underperforming content, discover optimization opportunities, and make data-driven decisions about content refreshes, title rewrites, and new content creation.

## Identifying Underperforming Pages

### Get page-level performance data

```
Tool: gsc_page_performance
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  row_limit: 200
Returns: Array of pages with clicks, impressions, ctr, position
```

### Detect declining pages

Compare two periods to find pages with declining performance:

```
# Previous period
Tool: gsc_page_performance
Params:
  site_url: "https://example.com/"
  start_date: "2026-01-01"
  end_date: "2026-01-31"
  row_limit: 200

# Current period
Tool: gsc_page_performance
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  row_limit: 200
```

Compare results to identify:
- **Click decline > 20%** — high priority for content refresh
- **Impression decline > 30%** — content may be losing relevance or competitors have overtaken
- **Position increase > 3 positions** (lower is better) — content is dropping in rankings

### Categorize pages by performance

| Category | Criteria | Action |
|----------|----------|--------|
| High performers | Top 10% by clicks | Protect and expand — add internal links, update regularly |
| Declining stars | Previously top, now dropping | Content refresh — update data, add sections, improve media |
| Hidden gems | High impressions, low CTR | Title/meta optimization — rewrite to improve click-through |
| Dead weight | Low impressions, low clicks | Evaluate for removal, consolidation, or major rewrite |
| Rising pages | Increasing impressions and clicks | Accelerate — build more internal links, add supporting content |

## Content Refresh Strategies

### Strategy 1: Refresh based on declining clicks

1. **Identify declining pages** using period comparison (see above)
2. **Fetch the WordPress content** using `wp_get_post` with the page URL
3. **Analyze queries** driving traffic to the page using `gsc_search_analytics` with `dimensions: ["query"]` filtered by the page URL
4. **Update the content** to better address the top queries:
   - Add missing subtopics that queries suggest users are looking for
   - Update outdated statistics, dates, and references
   - Expand thin sections with more depth
   - Add FAQ sections based on question-type queries

```
# Find queries for a specific declining page
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query"]
  dimension_filter_groups:
    - filters:
        - dimension: "page"
          operator: "equals"
          expression: "https://example.com/blog/wordpress-performance/"
  row_limit: 50
```

### Strategy 2: New content from high-impression queries

Queries with high impressions but low or zero clicks on your pages represent untapped opportunities:

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query", "page"]
  row_limit: 500
```

Filter for queries where:
- `impressions > 200` and `clicks < 5` — your page appears but users do not click
- `position > 10` — you rank on page 2+ and need a dedicated, optimized page

These queries can inform new blog post topics or dedicated landing pages.

### Strategy 3: Content consolidation

Multiple pages ranking for the same query cannibalize each other:

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query", "page"]
  row_limit: 1000
```

Look for queries that appear with 2+ different pages. When multiple pages compete:
1. Choose the strongest page (most clicks/best position)
2. Merge content from the weaker page into the stronger one
3. Redirect the weaker URL to the stronger page
4. Update internal links to point to the consolidated page

## Title and Meta Description Optimization

### Find CTR optimization opportunities

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query", "page"]
  row_limit: 200
```

Target pages where:
- `position < 5` and `ctr < 0.05` — ranking well but not getting clicks (expected CTR for top 5 is 5-15%)
- `position < 3` and `ctr < 0.10` — top 3 positions should have 10%+ CTR

### Title tag optimization guidelines

Based on search data patterns:
- **Include the primary query** in the title — queries that appear verbatim in titles get higher CTR
- **Front-load keywords** — the first 60 characters are visible in SERPs
- **Add power words** — "Guide", "2026", "Complete", "Best" boost CTR by 5-15%
- **Use numbers** — "10 Tips", "5 Steps" increase CTR by 10-20% vs generic titles
- **Match intent** — if queries are questions, use question format in title

### Meta description optimization

- **Include target query** — Google bolds matching terms in descriptions
- **Add a CTA** — "Learn more", "Get started", "Read the full guide"
- **Stay under 155 characters** — longer descriptions get truncated
- **Differentiate from competitors** — include unique value propositions

## WordPress Integration Workflow

Complete content optimization loop using GSC data and WordPress tools:

1. **Pull page performance**: `gsc_page_performance` for all pages
2. **Identify targets**: Filter for declining or underperforming pages
3. **Get query context**: `gsc_search_analytics` filtered by target page URL
4. **Fetch WordPress content**: `wp_get_post` to get current content
5. **Update content**: `wp_update_post` with improved title, content, and meta
6. **Monitor results**: Re-check `gsc_page_performance` after 2-4 weeks

## Best Practices

- **Refresh cadence**: Review page performance monthly; refresh declining content quarterly
- **Data threshold**: Only act on pages with 100+ impressions — below that, data is statistically unreliable
- **Patience after changes**: Wait 2-4 weeks after content changes before measuring impact; Google needs time to re-crawl and re-evaluate
- **Track changes**: Note the date and nature of each content update so you can correlate with performance changes
- **Prioritize by impact**: Focus on pages with the highest impression volume first — small CTR improvements on high-impression pages yield more clicks than large improvements on low-impression pages
- **Seasonal awareness**: Some traffic drops are seasonal, not quality-related; compare year-over-year when possible
- **Avoid over-optimization**: Do not stuff keywords into titles or content; natural language performs better in modern search
- **Internal linking**: After refreshing content, add internal links from other relevant pages to boost crawl priority
