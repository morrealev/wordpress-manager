---
name: wp-monitoring
description: This skill should be used when the user asks to "monitor my site", "set up
  uptime checks", "performance baseline", "health report", "security scanning schedule",
  "content integrity check", "alerting", "reporting", "trend analysis", "is my site up",
  "site health over time", "fleet monitoring", "all sites", "cross-site comparison",
  "network health", or mentions any form of ongoing WordPress monitoring and
  observability. Orchestrates uptime, performance, security, content, and fleet monitoring.
version: 1.0.0
---

# WordPress Monitoring Skill

## Overview

Provides strategies and procedures for continuous WordPress monitoring across five areas: uptime, performance, security, content integrity, and alerting. Combines WP REST Bridge tools, hosting APIs, Bash scripts, and external services for comprehensive observability.

## When to Use

- User wants ongoing site health monitoring (not a one-time audit)
- User asks about uptime checks, performance trends, or scheduled security scans
- User wants alerting when something goes wrong
- User needs a periodic health report
- User wants to track performance over time (baselines, trends)

## Monitoring vs Audit

| Need | Skill |
|------|-------|
| One-time assessment | `wp-audit` |
| Ongoing monitoring | `wp-monitoring` (this skill) |
| Security hardening | `wp-security` |
| Performance optimization | `wp-performance` |

## Decision Tree

1. **What to monitor?**
   - "uptime" / "is it up" / "response time" → Uptime checks (Section 1)
   - "performance" / "speed trend" / "CWV over time" → Performance baseline (Section 2)
   - "security scan" / "vulnerability check" / "malware" → Security scanning (Section 3)
   - "content changed" / "broken links" / "spam" → Content integrity (Section 4)
   - "alert me" / "notify" / "threshold" → Alerting strategies (Section 5)
   - "report" / "weekly summary" / "dashboard" → Reporting templates (Section 6)
   - "fleet" / "all sites" / "network health" / "cross-site" → Fleet monitoring (Section 7)
   - "full monitoring" / "set up everything" → All sections, start with detection

2. **Run detection first:**
   ```bash
   node skills/wp-monitoring/scripts/monitoring_inspect.mjs [--cwd=/path/to/project]
   ```
   This identifies existing monitoring setup and gaps.

## Monitoring Areas

### Section 1: Uptime Checks
See `references/uptime-checks.md`
- HTTP probe configuration
- SSL certificate expiry monitoring
- WP REST API health endpoint
- Cron job scheduling
- Response time thresholds

### Section 2: Performance Baseline
See `references/performance-baseline.md`
- Core Web Vitals baseline capture
- Lighthouse CI scheduled runs
- TTFB trend tracking
- Database query performance
- Plugin impact over time

### Section 3: Security Scanning
See `references/security-scanning.md`
- Plugin vulnerability checks (CVE database)
- File integrity monitoring
- User account anomaly detection
- Malware scanning
- WordPress core version tracking

### Section 4: Content Integrity
See `references/content-integrity.md`
- Unauthorized content change detection
- Broken link checking
- Comment spam monitoring
- Media file integrity
- SEO health indicators

### Section 5: Alerting Strategies
See `references/alerting-strategies.md`
- Severity thresholds and escalation
- Notification channels (email, Slack, webhook)
- Alert fatigue prevention
- On-call rotation patterns
- Incident response triggers

### Section 6: Reporting Templates
See `references/reporting-templates.md`
- Daily health summary
- Weekly performance report
- Monthly security report
- Quarterly trend analysis
- Executive dashboard format

### Section 7: Fleet Monitoring
See `references/fleet-monitoring.md`
- Cross-site health iteration using `list_sites` + `switch_site`
- Fleet-wide pattern detection (correlated issues)
- Fleet comparison reports
- Site grouping and fleet baselines

## Reference Files

| File | Content |
|------|---------|
| `references/uptime-checks.md` | HTTP probe, SSL, health endpoints, cron |
| `references/performance-baseline.md` | CWV baseline, Lighthouse CI, TTFB trends |
| `references/security-scanning.md` | CVE checks, file integrity, malware scanning |
| `references/content-integrity.md` | Change detection, link checking, spam |
| `references/alerting-strategies.md` | Thresholds, escalation, notification channels |
| `references/reporting-templates.md` | Daily/weekly/monthly report templates |
| `references/fleet-monitoring.md` | Fleet iteration, cross-site comparison, fleet reports |

## Recommended Agent

**`wp-monitoring-agent`** — executes monitoring procedures, generates reports, and surfaces anomalies. Read-only: does not modify the site.

## Related Skills

- **`wp-audit`** — one-time security/performance/SEO assessment (complements ongoing monitoring)
- **`wp-security`** — hardening procedures triggered by monitoring alerts
- **`wp-performance`** — optimization actions based on performance trends
- **`wp-cicd`** — CI/CD quality gates that complement monitoring (pre-deploy checks)
