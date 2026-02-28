# Alerting Strategies

## Severity Levels

| Level | Criteria | Response Time | Example |
|-------|----------|--------------|---------|
| **P0 — Critical** | Site down or data breach | Immediate (< 15 min) | HTTP 500, malware detected, admin account compromised |
| **P1 — High** | Major degradation | Within 1 hour | TTFB > 5s, SSL expires in < 7 days, plugin with critical CVE |
| **P2 — Medium** | Performance regression | Within 24 hours | CWV degradation > 20%, outdated plugins, spam spike |
| **P3 — Low** | Informational | Next maintenance window | Minor CWV change, new WordPress version, content audit findings |

## Alert Threshold Configuration

### Uptime Thresholds

```yaml
uptime:
  http_check:
    warning: response_time > 3s
    critical: response_time > 10s OR http_code != 200
    consecutive_failures_before_alert: 3
  ssl_expiry:
    warning: days_remaining < 30
    critical: days_remaining < 7
  wp_cron:
    warning: last_run > 30min
    critical: last_run > 2h
```

### Performance Thresholds

```yaml
performance:
  lcp:
    warning: value > 2500ms
    critical: value > 4000ms
  cls:
    warning: value > 0.1
    critical: value > 0.25
  ttfb:
    warning: value > 800ms
    critical: value > 1800ms
  lighthouse_score:
    warning: score < 70
    critical: score < 50
  regression:
    warning: delta > 20% from baseline
    critical: delta > 50% from baseline
```

### Security Thresholds

```yaml
security:
  plugin_updates:
    warning: outdated_count >= 3
    critical: security_update_available == true
  admin_accounts:
    warning: count > baseline + 1
    critical: unknown_admin_detected == true
  file_integrity:
    critical: core_files_modified == true
    critical: php_in_uploads == true
  malware_patterns:
    critical: suspicious_code_detected == true
```

### Content Thresholds

```yaml
content:
  spam_comments:
    warning: count_24h > 50
    critical: count_24h > 200
  broken_links:
    warning: count > 5
    critical: count > 20 OR homepage_links_broken == true
  unauthorized_changes:
    warning: modified_outside_hours == true
    critical: admin_content_modified_by_unknown == true
```

## Notification Channels

### Email Alerts

```bash
#!/bin/bash
# send-alert.sh — Unified alert sender

SEVERITY="$1"    # P0, P1, P2, P3
SUBJECT="$2"
BODY="$3"
ALERT_EMAIL="admin@example.com"

case "$SEVERITY" in
  P0) PREFIX="🔴 CRITICAL" ;;
  P1) PREFIX="🟠 HIGH" ;;
  P2) PREFIX="🟡 MEDIUM" ;;
  P3) PREFIX="🔵 INFO" ;;
esac

echo "$BODY" | mail -s "[$PREFIX] $SUBJECT" "$ALERT_EMAIL"
```

### Slack Webhook

```bash
#!/bin/bash
# slack-alert.sh — Send alert to Slack channel

WEBHOOK_URL="$SLACK_WEBHOOK_URL"
SEVERITY="$1"
MESSAGE="$2"

case "$SEVERITY" in
  P0) COLOR="#FF0000"; ICON=":red_circle:" ;;
  P1) COLOR="#FF8C00"; ICON=":large_orange_circle:" ;;
  P2) COLOR="#FFD700"; ICON=":large_yellow_circle:" ;;
  P3) COLOR="#4169E1"; ICON=":large_blue_circle:" ;;
esac

curl -s -X POST "$WEBHOOK_URL" \
  -H 'Content-type: application/json' \
  -d "{
    \"attachments\": [{
      \"color\": \"$COLOR\",
      \"text\": \"$ICON $MESSAGE\",
      \"footer\": \"WordPress Monitor | $(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }]
  }"
```

### Generic Webhook

```bash
#!/bin/bash
# webhook-alert.sh — Send alert to any webhook endpoint

WEBHOOK_URL="$1"
PAYLOAD=$(jq -n \
  --arg severity "$2" \
  --arg site "$3" \
  --arg message "$4" \
  --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '{severity: $severity, site: $site, message: $message, timestamp: $timestamp}')

curl -s -X POST "$WEBHOOK_URL" \
  -H 'Content-type: application/json' \
  -d "$PAYLOAD"
```

## Alert Fatigue Prevention

### Deduplication

- **Same alert suppression**: Don't re-alert for the same issue within the cooldown period
- **Cooldown periods**: P0 = 5 min, P1 = 30 min, P2 = 4h, P3 = 24h
- **Recovery notification**: Send "resolved" when condition clears

### Aggregation

- **Batch P3 alerts**: Collect low-priority alerts and send as a daily digest
- **Group related alerts**: If multiple plugins need updates, send one alert listing all
- **Threshold escalation**: If P2 persists for 24h without resolution, escalate to P1

### Noise Reduction Rules

```yaml
noise_reduction:
  # Don't alert during known maintenance windows
  maintenance_window:
    day: sunday
    start: "02:00"
    end: "06:00"
    suppress: [P2, P3]

  # Ignore brief transient failures
  consecutive_checks_required:
    P0: 2    # Alert after 2 consecutive failures (10 min)
    P1: 3    # Alert after 3 consecutive failures (15 min)

  # Don't alert on performance during traffic spikes
  suppress_performance_during_high_traffic: true
```

## Escalation Procedures

### Escalation Matrix

| Time Since Alert | P0 Action | P1 Action |
|------------------|-----------|-----------|
| 0 min | Notify primary on-call + Slack channel | Notify primary on-call |
| 15 min | Escalate to secondary on-call | — |
| 30 min | Escalate to team lead + phone call | Escalate to secondary |
| 1 hour | Escalate to management | Escalate to team lead |

### Incident Response Triggers

When monitoring detects a P0 condition, automatically:
1. Create incident record with timestamp and evidence
2. Notify on-call via all channels (email + Slack + webhook)
3. Capture current state: `wp plugin list`, `wp core version`, server logs
4. **Delegate to `wp-security-auditor`** for security incidents
5. **Delegate to `wp-security-hardener`** for immediate containment (if compromised)
