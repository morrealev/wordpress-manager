# Escalation Paths

## Severity Levels

| Level | Icon | Description | Example Triggers |
|-------|------|-------------|-----------------|
| **Info** | :information_source: | Informational, no action needed | Plugin updates available, backup completed, content published |
| **Warning** | :warning: | Needs attention within hours | LCP > 2.5s, error rate > 2%, disk > 80%, SSL < 30 days |
| **Critical** | :rotating_light: | Immediate action required | Site down, LCP > 4s, error rate > 5%, disk > 95%, security vulnerability |

## Routing Rules

### Info Severity

- **Slack**: Post to general alerts channel (`#wp-alerts`)
- **Email**: None
- **Format**: Simple text message
- **Threading**: No thread — standalone message
- **Mention**: None

### Warning Severity

- **Slack**: Post to alerts channel + create thread with details
- **Email**: None (unless configured in escalation override)
- **Format**: Block Kit section with fields
- **Threading**: Main message + detail thread
- **Mention**: None (or `@here` if configured)

### Critical Severity

- **Slack**: Post to critical channel (`#wp-critical`) + thread with diagnostics
- **Email**: Send via SendGrid to configured alert recipients
- **Format**: Block Kit header + sections + action buttons
- **Threading**: Main message + detail thread + follow-up updates
- **Mention**: `<!channel>` in Slack, priority flag in email

## Cooldown Periods

Prevent alert fatigue by enforcing minimum intervals between repeat alerts:

| Severity | Cooldown | Notes |
|----------|----------|-------|
| Info | 60 minutes | Same alert type on same site |
| Warning | 30 minutes | Same metric on same site |
| Critical | 10 minutes | Same incident on same site |

### Cooldown Logic

1. Before sending an alert, check the last alert timestamp for the same `(site, metric, severity)` tuple.
2. If within cooldown window, skip the alert (log silently).
3. If the severity **escalates** (warning -> critical), send immediately regardless of cooldown.
4. Reset the cooldown timer on each sent alert.

## Deduplication Rules

| Rule | Description |
|------|-------------|
| Same metric + same site + same severity | Deduplicate within cooldown window |
| Severity escalation | Always send (warning->critical bypasses dedup) |
| Severity de-escalation | Send recovery notification (critical->warning->resolved) |
| Recovery after critical | Always send "resolved" message to close the incident |

### Dedup Key Format

```
{site_id}:{metric}:{severity}
```

Example: `mysite:lcp:warning`, `mysite:uptime:critical`

## Acknowledgment Tracking

For critical alerts, track acknowledgment status:

1. Critical alert sent with "Acknowledge" button (Slack Block Kit action).
2. If not acknowledged within **15 minutes**, re-send with escalation mention.
3. If not acknowledged within **30 minutes**, send email to backup contacts.
4. Mark incident as acknowledged when button clicked or manual response received.

## Recovery Notifications

When a metric returns to normal after an alert:

- **Info**: No recovery notification.
- **Warning**: Post recovery message to same channel (with reference to original alert).
- **Critical**: Post recovery message + reply in original thread + send recovery email.

Recovery message format:
```
:white_check_mark: RESOLVED: {metric} on {site} returned to normal.
Duration: {alert_duration}. Current value: {current_value}.
```
