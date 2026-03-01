# Competitor Gap Analysis

## Overview

Competitor gap analysis uses Google Search Console data to identify keyword opportunities your WordPress site is missing. By analyzing your query coverage, position distribution, and content inventory, you can find topics where you have search visibility but no dedicated content, or where competitors likely rank for queries you do not yet target.

## Identifying Keyword Gaps

### Step 1: Export your full query coverage

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query"]
  row_limit: 5000
Returns: Array of all queries with clicks, impressions, ctr, position
```

This gives you every query Google associates with your site. Sort by impressions to see which topics generate the most search visibility.

### Step 2: Map queries to content

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query", "page"]
  row_limit: 5000
```

This maps each query to the page that ranks for it. Look for:
- **Queries without a dedicated page** — a query matches a generic page rather than a focused article
- **Multiple queries pointing to one page** — the page may be covering too many topics and could be split
- **Queries with position > 20** — you appear in results but have no strong content to compete

### Step 3: Identify content gaps

Cross-reference your queries with your WordPress content inventory:

```
# Get all published content
Step 1: wp_list_posts status="publish" per_page=100 → Array of posts with titles and URLs

# Get all queries with page mapping
Step 2: gsc_search_analytics dimensions=["query", "page"] row_limit=5000

# Compare: queries that map to pages not optimized for them = content gaps
```

## Analyzing Query Coverage

### Position distribution analysis

Categorize your queries by position to understand coverage quality:

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query"]
  row_limit: 5000
```

Group results by position ranges:

| Position Range | Category | Strategy |
|----------------|----------|----------|
| 1-3 | Dominant | Protect — monitor and update regularly |
| 4-10 | Competitive | Optimize — content refresh, internal links, backlinks |
| 11-20 | Striking distance | Target — create supporting content, build topic clusters |
| 21-50 | Weak presence | Evaluate — is the content worth investing in? |
| 50+ | Minimal visibility | Decide — create new dedicated content or abandon |

### Topic cluster gaps

Group related queries into topic clusters to find areas where your coverage is incomplete:

1. Export all queries with `gsc_search_analytics`
2. Group queries by root topic (e.g., "wordpress seo", "wordpress performance", "wordpress security")
3. Count unique queries per topic and average position per topic
4. Topics with few queries or high average position are underserved

## Finding Content Opportunities

### High-impression, no-click queries

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query", "page"]
  row_limit: 1000
```

Filter for queries where `impressions > 100` and `clicks == 0`. These are searches where Google shows your site but users never click — likely because:
- Your page does not match the query intent
- Your title and description are not compelling for that query
- You rank too low (position > 20) for the query to generate clicks

For each opportunity, decide whether to:
- **Optimize the existing page** for that query (if the topic is related)
- **Create a new dedicated page** targeting that query (if the topic is distinct)

### Question-based queries

Filter queries that start with question words (what, how, why, when, where, which, can, does, is):

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query"]
  dimension_filter_groups:
    - filters:
        - dimension: "query"
          operator: "contains"
          expression: "how to"
  row_limit: 200
```

Question queries map directly to FAQ content, how-to guides, and tutorial posts. If you appear for these queries but don't have dedicated content, create:
- FAQ sections on existing pages
- Standalone how-to articles
- Comprehensive guides that answer multiple related questions

### Long-tail opportunities

Queries with 4+ words are typically long-tail keywords with lower competition:

```
Tool: gsc_search_analytics
Params:
  site_url: "https://example.com/"
  start_date: "2026-02-01"
  end_date: "2026-02-28"
  dimensions: ["query"]
  row_limit: 2000
```

Filter for queries containing 4+ words with `impressions > 20`. Long-tail keywords often have:
- Higher conversion intent
- Lower competition
- More specific content requirements

Create focused content addressing the exact long-tail query.

## Position Improvement Strategies

### Strategy 1: Topic clusters

For queries where you rank 11-20, build topic clusters:

1. Identify the core topic from your query data
2. Create a **pillar page** — comprehensive guide covering the broad topic
3. Create **cluster pages** — focused articles on subtopics
4. **Interlink** all cluster pages to the pillar and vice versa
5. Monitor position changes with `gsc_search_analytics` over 4-8 weeks

### Strategy 2: Content depth expansion

For queries where you rank 4-10 but cannot break into top 3:

1. Analyze the query with `gsc_search_analytics` filtered by the specific query
2. Fetch the ranking page with `wp_get_post`
3. Expand the content:
   - Add 500-1000 words of additional depth
   - Include data, statistics, or original research
   - Add images, tables, or diagrams
   - Add expert quotes or citations
4. Update via `wp_update_post`

### Strategy 3: Internal link building

Boost underperforming pages with strategic internal links:

1. Identify pages ranking 11-30 for valuable queries
2. Find high-authority pages on your site (top performers from `gsc_page_performance`)
3. Add contextual internal links from high-authority pages to underperforming pages
4. Use the target query as anchor text (naturally, not forced)

## Cross-Referencing with WordPress Content

### Audit workflow

Complete gap analysis workflow combining GSC and WordPress data:

1. **Export all queries**: `gsc_search_analytics` with `dimensions: ["query"]`, `row_limit: 5000`
2. **Export all pages**: `gsc_page_performance` with `row_limit: 500`
3. **List WordPress content**: `wp_list_posts` with `status: "publish"`
4. **Map coverage**: For each WordPress post, check if it has GSC data
5. **Find orphans**: WordPress posts with no GSC impressions may have indexing or quality issues
6. **Find gaps**: Queries without a dedicated WordPress post are content opportunities

### Priority scoring

Score content opportunities by potential impact:

| Factor | Weight | Measurement |
|--------|--------|-------------|
| Impressions | High | More impressions = more potential traffic |
| Current position | Medium | Closer to page 1 = easier to improve |
| CTR gap | Medium | Low CTR vs expected = quick win with title optimization |
| Competition | Low | Long-tail queries typically have less competition |
| Business relevance | High | Queries related to products/services have higher value |

## Best Practices

- **Regular cadence**: Run gap analysis monthly to catch new opportunities as query landscape evolves
- **Focus on intent**: Not all queries are worth targeting; prioritize queries that align with your content goals and business objectives
- **Quality over quantity**: One comprehensive article targeting a cluster of related queries outperforms five thin articles each targeting a single query
- **Track outcomes**: After creating content for identified gaps, monitor its performance in GSC after 4-8 weeks
- **Avoid keyword cannibalization**: Before creating new content, check if an existing page already targets the same query cluster
- **Use search data directionally**: GSC data shows what Google associates with your site, not what your competitors rank for; use it as a map of your current footprint and expand from there
- **Combine with external tools**: For true competitive analysis (what competitors rank for that you do not), supplement GSC data with third-party tools like Ahrefs, SEMrush, or Moz
- **Content calendar integration**: Feed identified opportunities into your WordPress editorial calendar for systematic execution
