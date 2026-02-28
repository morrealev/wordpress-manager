# Fleet Monitoring

## Overview

Fleet monitoring extends single-site health checks to multiple WordPress installations. Instead of monitoring one site at a time, fleet monitoring iterates over all configured sites, collects per-site metrics, and aggregates them into a unified fleet view for cross-site comparison and pattern detection.

## Core Concept

```
# Fleet iteration pattern using MCP tools
for site in $(list_sites); do
  switch_site $site
  # run monitoring procedures...
done
```

The fleet approach enables:
- **Aggregate visibility** — see all sites' health at a glance
- **Cross-site comparison** — identify outliers and common issues
- **Pattern detection** — spot correlated problems across the fleet
- **Fleet baselines** — track fleet-wide averages over time

## Fleet Health Report Template

```
## Fleet Health Report
**Date:** [date] | **Sites:** [count] | **Scope:** [full / quick]

### Fleet Overview
| Site | Uptime | Performance | Security | Content | Overall |
|------|--------|-------------|----------|---------|---------|
| [site-1] | [pass/warn/fail] | [pass/warn/fail] | [pass/warn/fail] | [pass/warn/fail] | [pass/warn/fail] |
| [site-2] | [pass/warn/fail] | [pass/warn/fail] | [pass/warn/fail] | [pass/warn/fail] | [pass/warn/fail] |

### Fleet Summary
- **Healthy sites:** X/N
- **Degraded sites:** X/N (list)
- **Critical sites:** X/N (list)

### Cross-Site Patterns
[findings or "No cross-site patterns detected"]

### Fleet Recommendations (Priority Order)
1. [Fleet-wide action]
2. [Site-specific action]
```

## Cross-Site Pattern Detection

Fleet monitoring's key advantage is detecting patterns invisible at the single-site level:

### Same Plugin Vulnerability Across Sites
- If a vulnerable plugin version appears on multiple sites, escalate as a fleet-wide P0
- Prioritize patching by exposure (public-facing sites first)

### Fleet-Wide Performance Regression
- Correlated TTFB spikes across sites on the same host suggest a hosting or CDN issue
- Compare performance deltas: if all sites regress simultaneously, root cause is likely shared infrastructure

### Identical Outdated WordPress Core Versions
- Track core version across the fleet
- Flag sites running the same outdated version for batch updates

### Common Configuration Drift
- Compare wp-config.php settings across sites
- Detect inconsistencies in debug settings, cron configuration, or security constants
- Flag sites that have drifted from the fleet baseline

## Fleet Baseline

### Capturing Baselines

Establish a baseline for each site individually, then compute fleet averages:

1. **Per-site baseline**: Run Procedures 3-6 for each site, recording all metrics with timestamps
2. **Fleet averages**: Calculate mean/median for key metrics (TTFB, LCP, plugin count, admin users)
3. **Fleet thresholds**: Set fleet-wide thresholds based on averages + acceptable deviation

### Tracking Fleet Averages

| Metric | Fleet Avg | Fleet Median | Best | Worst | Threshold |
|--------|-----------|--------------|------|-------|-----------|
| TTFB | Xms | Xms | [site] Xms | [site] Xms | < 600ms |
| LCP | X.Xs | X.Xs | [site] X.Xs | [site] X.Xs | < 2.5s |
| Active Plugins | X | X | [site] X | [site] X | < 20 |
| Admin Users | X | X | [site] X | [site] X | varies |

### Baseline Refresh

- Refresh individual site baselines monthly
- Recalculate fleet averages after each refresh
- Flag sites that deviate > 20% from fleet average

## Site Grouping Strategies

Organize fleet sites into logical groups for targeted monitoring and reporting:

### By Environment
| Group | Description | Monitoring Frequency |
|-------|-------------|---------------------|
| Production | Live customer-facing sites | Every 5 minutes (uptime), daily (full) |
| Staging | Pre-production testing | Hourly (uptime), weekly (full) |
| Development | Local/dev environments | On-demand only |

### By Purpose
| Group | Description | Focus Areas |
|-------|-------------|-------------|
| Blog | Content-heavy editorial sites | Content integrity, SEO health |
| Shop | WooCommerce e-commerce sites | Uptime, performance, security |
| Landing | Marketing landing pages | Uptime, performance |
| Corporate | Company information sites | Content integrity, security |

### By Hosting
| Group | Description | Pattern Detection |
|-------|-------------|-------------------|
| Shared Host A | Sites on same shared hosting | Correlated performance issues |
| VPS Cluster | Sites on same VPS | Resource contention detection |
| Managed WP | Sites on managed WordPress hosting | Provider-specific issue detection |

## Scheduling: Fleet Scan Frequency

| Scan Type | Frequency | Scope | Duration Estimate |
|-----------|-----------|-------|-------------------|
| Quick uptime | Every 5 min | HTTP status + response time | ~2s per site |
| Standard health | Daily | Uptime + performance + security | ~30s per site |
| Full fleet audit | Weekly | All procedures (3-6) per site | ~2min per site |
| Baseline refresh | Monthly | Full audit + baseline update | ~3min per site |

### Scheduling Recommendations
- Stagger scans to avoid overwhelming shared infrastructure
- Run quick uptime checks in parallel; full audits sequentially
- Schedule full audits during low-traffic windows
- Allow 10% buffer time for network delays

## Escalation: Fleet-Wide P0

A fleet-wide P0 is triggered when multiple sites are affected simultaneously:

### P0 Criteria
- **3+ production sites** with the same critical issue
- **All sites on a host** showing performance degradation > 50%
- **Known exploited vulnerability** present on any production site
- **Data breach indicators** on any site

### P0 Response Procedure
1. **Immediate**: Alert all stakeholders (do not wait for full fleet scan to complete)
2. **Triage**: Identify affected sites and group by root cause
3. **Isolate**: If security incident, recommend isolating affected sites
4. **Delegate**: Hand off to `wp-security-auditor` (security) or `wp-site-manager` (infrastructure)
5. **Track**: Monitor remediation progress across all affected sites
6. **Post-mortem**: After resolution, update fleet baselines and document findings

### Severity Matrix
| Affected Sites | Impact | Severity |
|----------------|--------|----------|
| 1 site, non-production | Low | P3 |
| 1 production site | Medium | P2 |
| 2 production sites | High | P1 |
| 3+ production sites | Critical | P0 |
| All sites (any env) | Critical | P0 |
