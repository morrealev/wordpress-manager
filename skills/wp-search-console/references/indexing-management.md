# Indexing Management

## Overview

Indexing management ensures that Google discovers, crawls, and indexes your WordPress pages correctly. The GSC MCP tools provide URL inspection for individual pages and sitemap management for bulk discovery. Together, these tools help you monitor crawl coverage, diagnose indexing issues, and control which pages appear in search results.

## URL Inspection

### Inspect a single URL

```
Tool: gsc_inspect_url
Params:
  site_url: "https://example.com/"
  inspection_url: "https://example.com/blog/wordpress-seo-guide/"
Returns:
  indexStatusResult:
    verdict: "PASS"                    # PASS | NEUTRAL | FAIL
    coverageState: "Submitted and indexed"
    robotsTxtState: "ALLOWED"
    indexingState: "INDEXING_ALLOWED"
    lastCrawlTime: "2026-02-25T10:30:00Z"
    pageFetchState: "SUCCESSFUL"
    crawledAs: "MOBILE"
  mobileUsabilityResult:
    verdict: "PASS"
  richResultsResult:
    detectedItems: [...]
```

### Understanding inspection results

Key fields in the response:

| Field | Values | Meaning |
|-------|--------|---------|
| `verdict` | PASS / NEUTRAL / FAIL | Overall indexing status |
| `coverageState` | Various | Detailed coverage status |
| `robotsTxtState` | ALLOWED / DISALLOWED | Whether robots.txt blocks the URL |
| `indexingState` | INDEXING_ALLOWED / INDEXING_NOT_ALLOWED | Whether meta robots/noindex blocks indexing |
| `pageFetchState` | SUCCESSFUL / SOFT_404 / NOT_FOUND / REDIRECT | Crawl outcome |
| `crawledAs` | MOBILE / DESKTOP | Which crawler accessed the page |

### Common coverage states

- **Submitted and indexed** — page is in the index and appearing in search results
- **Crawled - currently not indexed** — Google crawled it but chose not to index (quality or duplicate concern)
- **Discovered - currently not indexed** — Google knows about it but has not crawled it yet
- **Excluded by 'noindex' tag** — the page has a noindex directive
- **Blocked by robots.txt** — robots.txt prevents crawling
- **Page with redirect** — the URL redirects to another page
- **Soft 404** — the page returns 200 but Google treats it as a 404

## Sitemap Management

### List sitemaps

```
Tool: gsc_list_sitemaps
Params:
  site_url: "https://example.com/"
Returns: Array of sitemaps with:
  path: "https://example.com/sitemap_index.xml"
  lastSubmitted: "2026-02-20T08:00:00Z"
  isPending: false
  isSitemapsIndex: true
  lastDownloaded: "2026-02-25T06:00:00Z"
  warnings: 0
  errors: 0
  contents:
    - type: "web"
      submitted: 150
      indexed: 142
```

### Submit a sitemap

```
Tool: gsc_submit_sitemap
Params:
  site_url: "https://example.com/"
  sitemap_url: "https://example.com/sitemap_index.xml"
```

Submit after:
- Initial site setup
- Adding a new sitemap (e.g., a video sitemap or news sitemap)
- Changing sitemap URL structure
- Major content additions (100+ new pages)

### Delete a sitemap

```
Tool: gsc_delete_sitemap
Params:
  site_url: "https://example.com/"
  sitemap_url: "https://example.com/old-sitemap.xml"
```

Delete when:
- A sitemap URL has changed (submit the new one, delete the old)
- A sitemap contains only 404/removed pages
- Consolidating multiple sitemaps into one

## Monitoring Crawl Coverage

### Bulk URL inspection workflow

For auditing multiple pages, iterate through URLs from your WordPress site:

1. **Get WordPress pages** using `wp_list_posts` with `status: "publish"`
2. **Inspect each URL** using `gsc_inspect_url` for each published page
3. **Categorize results** by `coverageState`:
   - Indexed: `verdict === "PASS"`
   - Not indexed: `verdict === "FAIL"` or `verdict === "NEUTRAL"`
4. **Report findings** with counts per coverage state

```
# Example workflow
Step 1: wp_list_posts status="publish" per_page=100 → Array of posts with links
Step 2: For each post.link → gsc_inspect_url inspection_url=post.link
Step 3: Group by coverageState → { indexed: 85, not_indexed: 12, errors: 3 }
```

### Sitemap vs index comparison

Compare sitemap-submitted URLs against indexed URLs to find coverage gaps:

1. **List sitemaps** with `gsc_list_sitemaps` to get submitted/indexed counts
2. **Calculate coverage rate**: `indexed / submitted * 100`
3. **Investigate gaps**: If coverage is below 90%, inspect non-indexed URLs individually

## Handling Indexing Issues

### Crawled but not indexed

This means Google fetched the page but deemed it unworthy of indexing. Common causes:
- **Thin content**: Page has very little unique content
- **Duplicate content**: Substantially similar to another indexed page
- **Low quality**: Content does not meet quality thresholds

**Actions:**
1. Inspect the URL with `gsc_inspect_url` to confirm the status
2. Review the page content — add depth, unique value, or original research
3. Check for duplicate content — use canonical tags to consolidate
4. After improving, request re-indexing (not available via API; use Search Console UI)

### Discovered but not indexed

Google knows the URL exists but has not crawled it. This often indicates:
- **Crawl budget**: The site has too many pages relative to its authority
- **Internal linking**: The page is poorly linked from other pages
- **Priority**: Google does not consider the page important enough to crawl

**Actions:**
1. Improve internal linking to the page from high-authority pages
2. Add the URL to the sitemap if it is not already included
3. Reduce crawl waste by blocking thin/utility pages with `noindex`

### Blocked by robots.txt

```
# Check if the URL is blocked
Tool: gsc_inspect_url
Params:
  inspection_url: "https://example.com/admin-page/"

# If robotsTxtState is "DISALLOWED", review the robots.txt file
```

Ensure your `robots.txt` is not accidentally blocking important content pages.

## Best Practices

- **Sitemap freshness**: WordPress SEO plugins (Yoast, Rank Math) auto-generate sitemaps; submit the index sitemap once and let the plugin manage updates
- **Inspection frequency**: Do not over-inspect; GSC has API quotas. Batch inspections for weekly or monthly audits
- **New content**: After publishing a significant post, inspect it after 48-72 hours to verify crawling
- **Redirect chains**: Avoid chains of 3+ redirects; they slow crawling and may cause indexing issues
- **Status codes**: Regularly check for soft 404s — pages that return 200 but appear empty or error-like to Googlebot
- **Canonical tags**: Ensure every page has a self-referencing canonical or points to the preferred version
- **Crawl budget**: For large sites (10,000+ pages), prioritize indexing of high-value pages by improving internal linking and reducing index bloat
- **Mobile-first**: Google uses mobile crawling by default; ensure `crawledAs: "MOBILE"` succeeds for all important pages
