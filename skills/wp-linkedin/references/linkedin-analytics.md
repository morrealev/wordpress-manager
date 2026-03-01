# LinkedIn Analytics Guide

## Available Metrics

Use `li_get_analytics` to retrieve post performance data.

### Post-Level Metrics
- **impressions** — Number of times the post was shown in feeds
- **clicks** — Total clicks on the post (content, company name, logo)
- **likes** — Number of likes/reactions
- **comments** — Number of comments
- **shares** — Number of reposts
- **engagement rate** — (clicks + likes + comments + shares) / impressions

### Time Periods
- `day` — Daily breakdown
- `month` — Monthly aggregation (default)

## Querying Analytics

### All Posts Summary
```
Tool: li_get_analytics
Params: {}
```
Returns aggregated statistics across all recent posts.

### Specific Post
```
Tool: li_get_analytics
Params: { "post_id": "urn:li:share:1234567890" }
```

## Performance Benchmarks (B2B)

| Metric | Good | Excellent |
|--------|------|-----------|
| Engagement rate | 2-4% | >5% |
| Click-through rate | 0.5-1% | >2% |
| Impressions per post | 500-2000 | >5000 |
| Comments per post | 3-10 | >20 |

## Workflow: Post-and-Track

1. Create post with `li_create_post`
2. Wait 24-48 hours for meaningful data
3. Check metrics with `li_get_analytics`
4. Compare against benchmarks above
5. Adjust content strategy based on engagement patterns

## Listing Recent Posts

```
Tool: li_list_posts
Params: { "count": 20 }
```

Returns posts with basic metrics for quick overview.
