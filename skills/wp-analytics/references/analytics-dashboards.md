# Analytics Dashboard Patterns

## Weekly Report Template

A weekly report should cover the most recent 7-day period compared to the previous 7 days.

### Key Metrics Section
| KPI | This Week | Last Week | Change |
|-----|-----------|-----------|--------|
| Sessions (GA4) | — | — | +/-% |
| Unique Visitors (Plausible) | — | — | +/-% |
| Pageviews | — | — | +/-% |
| Bounce Rate | — | — | +/-pp |
| Avg. Session Duration | — | — | +/-s |
| Conversions | — | — | +/-% |
| LCP (p75) | — | — | +/-ms |
| CLS (p75) | — | — | +/- |
| INP (p75) | — | — | +/-ms |

### Top Pages Section
List the top 10 pages by pageviews with:
- Page path and title
- Pageviews (GA4) and Visitors (Plausible)
- CWV scores if available
- Week-over-week change

### Traffic Sources Section
Breakdown by source/medium with session counts and conversion rates.

## Monthly Report Template

Extends the weekly report with:
- Month-over-month and year-over-year comparisons
- Audience trends (new vs returning, device split, geo distribution)
- Content performance (top 20 pages, worst performers, new content impact)
- CWV trend charts (4-week rolling averages)
- Conversion funnel analysis

## Combining GA4 + Plausible Data

### Why Use Both
- **GA4** provides deep behavioral data, conversion tracking, and audience segmentation
- **Plausible** provides privacy-compliant counts that may be more accurate (no adblocker filtering)
- Comparing both reveals tracking discrepancies and adblocker impact

### Alignment Strategy
1. Use the **same date range** for both platforms
2. Map GA4 `sessions` to Plausible `visits` (closest equivalent)
3. Map GA4 `activeUsers` to Plausible `visitors`
4. Note: numbers will differ — Plausible typically shows fewer visits due to no cookie tracking
5. Calculate the **tracking gap**: `(GA4 sessions - Plausible visits) / GA4 sessions * 100`

### Recommended Dashboard Sections
1. **Overview** — side-by-side GA4 and Plausible totals
2. **Traffic Sources** — GA4 source/medium enriched with Plausible referrer data
3. **Content Performance** — page-level metrics from both platforms
4. **Core Web Vitals** — PageSpeed scores and CrUX field data
5. **Conversions** — GA4 conversion events and goal completions
6. **Trends** — time-series charts with 7-day and 30-day windows

## Key KPIs Reference

| KPI | Source | Formula / Notes |
|-----|--------|-----------------|
| Sessions | GA4 | Total sessions in period |
| Unique Visitors | Plausible | Deduplicated visitor count |
| Pageviews | Both | Total page loads |
| Bounce Rate | GA4 | `1 - engagementRate` |
| Pages per Visit | Plausible | `pageviews / visits` |
| Avg. Duration | GA4 | `averageSessionDuration` in seconds |
| Conversion Rate | GA4 | `conversions / sessions * 100` |
| LCP (p75) | CWV | 75th percentile Largest Contentful Paint |
| CLS (p75) | CWV | 75th percentile Cumulative Layout Shift |
| INP (p75) | CWV | 75th percentile Interaction to Next Paint |
| Performance Score | PageSpeed | Lighthouse 0-100 score |

## Report Format Guidelines

- Use **Markdown tables** for structured data
- Include **percentage changes** with directional indicators
- Flag metrics that cross CWV thresholds (good/needs-improvement/poor)
- Provide **actionable recommendations** for declining metrics
- Keep reports under 200 lines for readability
