# Performance Baseline

## Core Web Vitals Baseline

### Capture Baseline with Lighthouse CLI

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit and save JSON
lighthouse https://example.com \
  --output=json --output-path=./baseline-$(date +%Y%m%d).json \
  --chrome-flags="--headless --no-sandbox"

# Extract CWV from JSON
cat baseline-*.json | jq '{
  lcp: .audits["largest-contentful-paint"].numericValue,
  fid: .audits["max-potential-fid"].numericValue,
  cls: .audits["cumulative-layout-shift"].numericValue,
  ttfb: .audits["server-response-time"].numericValue,
  performance_score: .categories.performance.score
}'
```

### CWV Target Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|--------------------|------|
| LCP | ≤ 2.5s | 2.5s – 4.0s | > 4.0s |
| INP | ≤ 200ms | 200ms – 500ms | > 500ms |
| CLS | ≤ 0.1 | 0.1 – 0.25 | > 0.25 |
| TTFB | ≤ 800ms | 800ms – 1.8s | > 1.8s |

## Lighthouse CI for Trend Tracking

### Configuration (`.lighthouserc.js`)

```js
module.exports = {
  ci: {
    collect: {
      url: [
        'https://example.com/',
        'https://example.com/shop/',
        'https://example.com/blog/',
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--headless --no-sandbox',
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.7 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.25 }],
        'server-response-time': ['warn', { maxNumericValue: 1800 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lhci-results',
    },
  },
};
```

### Scheduled Run

```bash
# Weekly performance baseline (cron: 0 6 * * 1)
npx @lhci/cli collect && npx @lhci/cli assert && npx @lhci/cli upload
```

## TTFB Trend Tracking

### Bash Script for Daily TTFB Log

```bash
#!/bin/bash
# ttfb-log.sh — Append daily TTFB measurement

SITE_URL="https://example.com"
LOG_FILE="ttfb-trend.csv"

# Create header if file doesn't exist
if [ ! -f "$LOG_FILE" ]; then
  echo "timestamp,ttfb_ms,total_ms,http_code" > "$LOG_FILE"
fi

RESULT=$(curl -sL -o /dev/null -w "%{time_starttransfer},%{time_total},%{http_code}" \
  --connect-timeout 10 "$SITE_URL")

TTFB_MS=$(echo "$RESULT" | cut -d, -f1 | awk '{printf "%.0f", $1 * 1000}')
TOTAL_MS=$(echo "$RESULT" | cut -d, -f2 | awk '{printf "%.0f", $1 * 1000}')
HTTP_CODE=$(echo "$RESULT" | cut -d, -f3)

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ),$TTFB_MS,$TOTAL_MS,$HTTP_CODE" >> "$LOG_FILE"
```

## Database Query Performance

### Using WP-CLI

```bash
# Profile slow queries (requires SAVEQUERIES constant)
wp profile stage --all --url=https://example.com

# Doctor checks
wp doctor check --all
```

### Key Queries to Monitor

| Query Area | Warning Threshold | Check Method |
|------------|-------------------|-------------|
| Autoloaded options | > 1MB total size | `wp db query "SELECT SUM(LENGTH(option_value)) FROM wp_options WHERE autoload='yes'"` |
| Post meta | > 100ms per query | SAVEQUERIES + profile |
| Transients | > 500 expired | `wp transient list --expired --format=count` |
| Revisions | > 50 per post | `wp post list --post_type=revision --format=count` |

## Plugin Impact Monitoring

Track the number and size of active plugins over time:

```bash
# Count active plugins via WP-CLI
wp plugin list --status=active --format=count

# List with update status
wp plugin list --status=active --fields=name,version,update_version --format=table
```

Via WP REST Bridge:
- `list_plugins` → count active plugins
- Compare with previous baseline to detect new installations

## Trend Analysis Pattern

1. **Capture baseline** — Record CWV, TTFB, plugin count, DB size on Day 0
2. **Daily measurement** — Automated TTFB + uptime log
3. **Weekly deep scan** — Full Lighthouse audit, plugin audit, DB health
4. **Monthly comparison** — Compare current metrics with baseline and previous month
5. **Alert on regression** — If any CWV degrades by > 20%, trigger investigation

### Trend Report Format

```
## Performance Trend — [site-name]
**Period:** [start-date] to [end-date]

### Key Metrics
| Metric | Baseline | Current | Delta | Status |
|--------|----------|---------|-------|--------|
| LCP    | X.Xs     | X.Xs    | +X%   | ✅/⚠️/❌ |
| TTFB   | Xms      | Xms     | +X%   | ✅/⚠️/❌ |
| CLS    | X.XX     | X.XX    | +X%   | ✅/⚠️/❌ |
| Score  | XX/100   | XX/100  | +X    | ✅/⚠️/❌ |

### Changes Since Last Report
- [Plugin added/removed/updated]
- [Content changes]
- [Server/hosting changes]

### Recommendations
1. [Action based on trend]
```
