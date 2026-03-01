# Alert Threshold Definitions

## Core Web Vitals Thresholds

| Metric | Good | Warning | Critical | Unit |
|--------|------|---------|----------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5s - 4.0s | > 4.0s | seconds |
| FCP (First Contentful Paint) | < 1.8s | 1.8s - 3.0s | > 3.0s | seconds |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 | score |
| INP (Interaction to Next Paint) | < 200ms | 200ms - 500ms | > 500ms | milliseconds |
| TTFB (Time to First Byte) | < 800ms | 800ms - 1800ms | > 1800ms | milliseconds |

These follow Google's published CWV thresholds. A warning indicates "needs improvement," critical indicates "poor."

## Uptime & Availability Thresholds

| Metric | Warning | Critical | Window |
|--------|---------|----------|--------|
| HTTP 5xx error rate | > 2% of requests | > 5% of requests | per hour |
| Response time (avg) | > 2s | > 5s | per 15 minutes |
| Response time (p95) | > 4s | > 10s | per 15 minutes |
| Downtime duration | > 1 minute | > 5 minutes | consecutive |
| SSL certificate expiry | < 30 days | < 7 days | daily check |

## Error Rate Thresholds

| Metric | Warning | Critical | Notes |
|--------|---------|----------|-------|
| PHP fatal errors | > 5/hour | > 20/hour | Check `debug.log` or error tracking |
| PHP warnings | > 50/hour | > 200/hour | May indicate plugin conflicts |
| JavaScript errors | > 10/hour | > 50/hour | Frontend console errors |
| 404 rate | > 5% of requests | > 15% of requests | May indicate broken links or attacks |
| Database query errors | > 1/hour | > 10/hour | Check slow query log |

## Resource Usage Thresholds

| Metric | Warning | Critical | Notes |
|--------|---------|----------|-------|
| Disk usage | > 80% | > 95% | Check uploads, logs, backups |
| PHP memory usage | > 80% of limit | > 95% of limit | Per-request memory |
| Database size growth | > 10%/week | > 25%/week | May indicate spam or logging |
| Backup age | > 24 hours | > 72 hours | Last successful backup |

## Plugin & Update Thresholds

| Metric | Severity | Notes |
|--------|----------|-------|
| Plugin updates available | Info (1-2), Warning (3-5), Critical (6+) | Security updates always critical |
| Theme updates available | Warning | Check compatibility first |
| WordPress core update | Warning (minor), Critical (security) | Security patches are urgent |
| Plugin vulnerability found | Critical | Immediate action required |

## Content Freshness Thresholds

| Metric | Warning | Critical | Notes |
|--------|---------|----------|-------|
| Last published post | > 14 days | > 30 days | Blog/news sites |
| Stale draft count | > 10 drafts | > 25 drafts | Content pipeline health |
| Broken internal links | > 5 | > 20 | SEO and UX impact |
| Missing alt text (new images) | > 10% | > 25% | Accessibility compliance |

## Custom Threshold Configuration

Thresholds are configurable per site via `WP_SITES_CONFIG`:

```json
{
  "alert_thresholds": {
    "lcp_warning": 2.5,
    "lcp_critical": 4.0,
    "error_rate_warning": 0.02,
    "error_rate_critical": 0.05,
    "disk_warning": 0.80,
    "disk_critical": 0.95
  }
}
```

Override defaults by adding the `alert_thresholds` object to any site entry. Unspecified thresholds fall back to the defaults listed above.
