# Core Web Vitals Monitoring

## Metric Definitions

### LCP — Largest Contentful Paint
Measures **loading performance**. Time until the largest visible content element is rendered.
- Applies to: images, videos, block-level text elements
- Target: measures perceived load speed

### FCP — First Contentful Paint
Measures **initial render**. Time until the first text or image is painted on screen.
- Applies to: any visible DOM content
- Target: measures time to first visual feedback

### CLS — Cumulative Layout Shift
Measures **visual stability**. Sum of unexpected layout shift scores during the page lifecycle.
- Applies to: visible elements that move without user interaction
- Target: measures how much content jumps around

### INP — Interaction to Next Paint
Measures **responsiveness**. Latency of user interactions (clicks, taps, key presses) throughout the page lifecycle.
- Replaced FID (First Input Delay) as a Core Web Vital in March 2024
- Target: measures overall page responsiveness

### TTFB — Time to First Byte
Measures **server responsiveness**. Time from the request start until the first byte of the response is received.
- Includes DNS, connection, TLS, and server processing time
- Target: measures backend and network performance

## Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | <= 2.5s | 2.5s - 4.0s | > 4.0s |
| FCP | <= 1.8s | 1.8s - 3.0s | > 3.0s |
| CLS | <= 0.1 | 0.1 - 0.25 | > 0.25 |
| INP | <= 200ms | 200ms - 500ms | > 500ms |
| TTFB | <= 800ms | 800ms - 1800ms | > 1800ms |

The 75th percentile (p75) is used for assessment — meaning 75% of page loads must meet the threshold.

## PageSpeed Insights API

### Setup
1. Enable **PageSpeed Insights API** in Google Cloud Console
2. Create or use an existing API key
3. Add `google_api_key` to WP_SITES_CONFIG

### Request Format
```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
  ?url=https://example.com
  &key=YOUR_API_KEY
  &strategy=mobile        # or "desktop"
  &category=performance   # also: accessibility, best-practices, seo
```

### Response Fields
- `lighthouseResult.categories.performance.score` — 0-100 score
- `lighthouseResult.audits['largest-contentful-paint']` — LCP details
- `lighthouseResult.audits['cumulative-layout-shift']` — CLS details
- `lighthouseResult.audits['interaction-to-next-paint']` — INP details
- `loadingExperience.metrics` — CrUX field data (if available)

### Quota
- 25,000 queries per day (free tier)
- 400 queries per 100 seconds

## CrUX API (Chrome UX Report)

### Overview
CrUX provides **real user metrics** collected from Chrome users who opted into usage statistics. Unlike PageSpeed Insights (lab data), CrUX reflects actual user experience.

### Request Format
```
POST https://chromeuxreport.googleapis.com/v1/records:queryRecord
  ?key=YOUR_API_KEY

Body:
{
  "url": "https://example.com/page",
  "formFactor": "PHONE",        // optional: PHONE, DESKTOP, TABLET
  "metrics": ["largest_contentful_paint", "cumulative_layout_shift"]
}
```

For origin-level data, use `"origin"` instead of `"url"`.

### Data Availability
- CrUX data requires **sufficient traffic** — low-traffic pages may have no data
- Data is aggregated over a 28-day rolling window
- Updated weekly (typically Monday)
- Historical data available via BigQuery dataset `chrome-ux-report`

## WordPress-Specific Considerations

- **Caching plugins** (WP Super Cache, W3 Total Cache, LiteSpeed) significantly affect TTFB and LCP
- **Image optimization** plugins impact LCP for image-heavy pages
- **Theme and plugin JavaScript** is the primary cause of poor INP scores
- **Web fonts** can cause CLS if not using `font-display: swap`
- Test both **logged-in** and **logged-out** states — admin bar affects CLS
