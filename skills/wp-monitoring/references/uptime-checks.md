# Uptime Checks

## HTTP Health Probe

### Basic HTTP Check

Verify the site responds with HTTP 200:

```bash
# Simple uptime check
curl -s -o /dev/null -w "%{http_code} %{time_total}s" https://example.com

# With timeout and follow redirects
curl -sL -o /dev/null -w "%{http_code} %{time_total}s %{time_connect}s" \
  --connect-timeout 10 --max-time 30 https://example.com
```

Expected: HTTP 200, response time < 3s.

### WordPress REST API Health

Check the REST API is responsive:

```bash
# REST API discovery
curl -s https://example.com/wp-json/ | jq '.name, .url'

# Specific endpoint check
curl -s -o /dev/null -w "%{http_code}" https://example.com/wp-json/wp/v2/posts?per_page=1
```

### Custom Health Endpoint

Create a lightweight health check mu-plugin:

```php
<?php
/**
 * Plugin Name: Health Check Endpoint
 * Description: Lightweight health endpoint for monitoring.
 */
add_action('rest_api_init', function () {
    register_rest_route('monitoring/v1', '/health', [
        'methods'  => 'GET',
        'callback' => function () {
            global $wpdb;
            $db_ok = (bool) $wpdb->get_var('SELECT 1');
            return [
                'status'    => $db_ok ? 'ok' : 'degraded',
                'timestamp' => gmdate('c'),
                'wp_version' => get_bloginfo('version'),
                'php_version' => PHP_VERSION,
                'db_ok'     => $db_ok,
            ];
        },
        'permission_callback' => '__return_true',
    ]);
});
```

Endpoint: `GET /wp-json/monitoring/v1/health`

## SSL Certificate Monitoring

```bash
# Check SSL expiry date
echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null \
  | openssl x509 -noout -enddate

# Days until expiry
EXPIRY=$(echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null \
  | openssl x509 -noout -enddate | cut -d= -f2)
DAYS=$(( ($(date -d "$EXPIRY" +%s) - $(date +%s)) / 86400 ))
echo "SSL expires in $DAYS days"
```

Alert thresholds:
- **Warning**: < 30 days until expiry
- **Critical**: < 7 days until expiry

## Cron-Based Scheduling

### System Cron (Recommended for Production)

```bash
# Disable WP-Cron (add to wp-config.php)
define('DISABLE_WP_CRON', true);

# System cron every 5 minutes
*/5 * * * * curl -s https://example.com/wp-cron.php > /dev/null 2>&1
```

### Monitoring Cron Script

```bash
#!/bin/bash
# monitor-site.sh — Run from cron every 5 minutes

SITE_URL="https://example.com"
ALERT_EMAIL="admin@example.com"
LOG_FILE="/var/log/wp-monitor.log"

HTTP_CODE=$(curl -sL -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$SITE_URL")
RESPONSE_TIME=$(curl -sL -o /dev/null -w "%{time_total}" --connect-timeout 10 --max-time 30 "$SITE_URL")

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "$TIMESTAMP status=$HTTP_CODE time=${RESPONSE_TIME}s" >> "$LOG_FILE"

if [ "$HTTP_CODE" != "200" ]; then
  echo "ALERT: $SITE_URL returned HTTP $HTTP_CODE at $TIMESTAMP" | \
    mail -s "Site Down: $SITE_URL" "$ALERT_EMAIL"
fi

# Slow response alert (> 5 seconds)
if (( $(echo "$RESPONSE_TIME > 5.0" | bc -l) )); then
  echo "SLOW: $SITE_URL took ${RESPONSE_TIME}s at $TIMESTAMP" | \
    mail -s "Slow Response: $SITE_URL" "$ALERT_EMAIL"
fi
```

## WP REST Bridge Integration

Use WP REST Bridge MCP tools for uptime checks:

1. `discover_content_types` — verifies API connectivity
2. `list_content` with `per_page: 1` — confirms database is responding
3. `list_plugins` — confirms plugin system is functional

If any MCP call fails or times out, the site may be down or degraded.

## Response Time Thresholds

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| HTTP response | < 1s | 1–3s | > 3s |
| TTFB | < 600ms | 600ms–1.5s | > 1.5s |
| REST API | < 2s | 2–5s | > 5s |
| SSL days remaining | > 30 | 7–30 | < 7 |
| WP-Cron last run | < 15min | 15min–1h | > 1h |
