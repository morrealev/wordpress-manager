# Reporting Templates

## Daily Health Summary

```markdown
## Daily Health Report — [site-name]
**Date:** [YYYY-MM-DD] | **Status:** [✅ Healthy / ⚠️ Degraded / ❌ Down]

### Uptime
- HTTP status: [200 OK / error code]
- Response time: [X.Xs] (threshold: < 3s)
- SSL expires in: [X days]
- WP-Cron last run: [timestamp]

### Quick Metrics
| Metric | Value | Status |
|--------|-------|--------|
| Active plugins | X | [✅ / ⚠️ outdated] |
| Pending updates | X | [✅ / ⚠️] |
| Spam comments (24h) | X | [✅ / ⚠️] |
| Pending moderation | X | [✅ / ⚠️] |

### Alerts (last 24h)
- [Alert summary or "No alerts"]

### Action Required
- [ ] [Any urgent items]
```

## Weekly Performance Report

```markdown
## Weekly Performance Report — [site-name]
**Period:** [start-date] to [end-date]

### Core Web Vitals
| Metric | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Avg | Target | Status |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|--------|--------|
| LCP (s) | — | — | — | — | — | — | — | — | ≤ 2.5 | ✅/⚠️/❌ |
| INP (ms) | — | — | — | — | — | — | — | — | ≤ 200 | ✅/⚠️/❌ |
| CLS | — | — | — | — | — | — | — | — | ≤ 0.1 | ✅/⚠️/❌ |
| TTFB (ms) | — | — | — | — | — | — | — | — | ≤ 800 | ✅/⚠️/❌ |

### Uptime Summary
- Availability: [XX.X%]
- Total downtime: [Xm Xs]
- Incidents: [count]
- Average response time: [Xms]

### Plugin Health
| Status | Count |
|--------|-------|
| Up to date | X |
| Update available | X |
| Security update | X |

### Content Activity
- Posts published: X
- Posts modified: X
- Comments received: X
- Spam blocked: X

### Trend vs Last Week
| Metric | Last Week | This Week | Delta |
|--------|-----------|-----------|-------|
| Avg LCP | X.Xs | X.Xs | [+/-X%] |
| Avg TTFB | Xms | Xms | [+/-X%] |
| Lighthouse score | XX | XX | [+/-X] |
| Plugin count | X | X | [+/-X] |

### Recommendations
1. [Priority action based on trends]
2. [Secondary action]
```

## Monthly Security Report

```markdown
## Monthly Security Report — [site-name]
**Period:** [month YYYY]

### Security Posture Summary
| Area | Status | Details |
|------|--------|---------|
| WordPress Core | [✅ current / ⚠️ update available] | v[X.X.X] |
| PHP Version | [✅ current / ⚠️ outdated] | v[X.X] |
| Plugins | [✅ / ⚠️ X outdated] | X active, X inactive |
| SSL Certificate | [✅ valid / ⚠️ expiring] | Expires [date] |
| File Integrity | [✅ clean / ❌ modified] | [details] |
| User Accounts | [✅ / ⚠️ review needed] | X admins, X total |

### Vulnerability Summary
| Severity | Count | Resolved | Outstanding |
|----------|-------|----------|-------------|
| Critical | X | X | X |
| High | X | X | X |
| Medium | X | X | X |
| Low | X | X | X |

### Security Events
| Date | Event | Severity | Status |
|------|-------|----------|--------|
| [date] | [event] | [P0-P3] | [resolved/open] |

### Plugin Security Audit
| Plugin | Version | Latest | CVEs | Status |
|--------|---------|--------|------|--------|
| [name] | [ver] | [latest] | [count] | [✅/⚠️/❌] |

### User Account Audit
| Username | Role | Last Login | Status |
|----------|------|-----------|--------|
| [user] | [role] | [date] | [✅ active / ⚠️ dormant] |

### File Integrity Check
- Core files verified: [✅ / ❌ X modified]
- Uploads directory: [✅ clean / ❌ suspicious files]
- Modified files: [list if any]

### Recommendations (Priority Order)
1. [Most urgent security action]
2. [Second priority]
3. [Third priority]
```

## Quarterly Trend Analysis

```markdown
## Quarterly Trend Analysis — [site-name]
**Period:** Q[X] [YYYY] ([start-month] to [end-month])

### Performance Trend
| Metric | Month 1 | Month 2 | Month 3 | Trend |
|--------|---------|---------|---------|-------|
| Avg LCP | X.Xs | X.Xs | X.Xs | [📈/📉/➡️] |
| Avg TTFB | Xms | Xms | Xms | [📈/📉/➡️] |
| Lighthouse Score | XX | XX | XX | [📈/📉/➡️] |
| Uptime % | XX.X% | XX.X% | XX.X% | [📈/📉/➡️] |

### Security Trend
| Metric | Month 1 | Month 2 | Month 3 | Trend |
|--------|---------|---------|---------|-------|
| Vulnerabilities found | X | X | X | [📈/📉/➡️] |
| Mean time to patch | Xd | Xd | Xd | [📈/📉/➡️] |
| Security incidents | X | X | X | [📈/📉/➡️] |

### Content Growth
| Metric | Month 1 | Month 2 | Month 3 | Total |
|--------|---------|---------|---------|-------|
| Posts published | X | X | X | X |
| Pages added | X | X | X | X |
| Media uploaded | X | X | X | X |
| Comments | X | X | X | X |

### Infrastructure Changes
- [Plugin additions/removals]
- [Theme changes]
- [Hosting changes]
- [PHP/WordPress version upgrades]

### Key Insights
1. [Performance observation with data]
2. [Security observation with trend]
3. [Content observation]

### Recommendations for Next Quarter
1. [Strategic recommendation]
2. [Tactical recommendation]
3. [Maintenance recommendation]
```

## Executive Dashboard Format

For non-technical stakeholders:

```markdown
## WordPress Site Health — [site-name]
**Report Date:** [YYYY-MM-DD]

### Overall Status: [🟢 Healthy / 🟡 Needs Attention / 🔴 Critical]

### Key Numbers
| | This Period | Previous | Change |
|---|-----------|----------|--------|
| 🔒 Security Score | X/10 | X/10 | [+/-X] |
| ⚡ Speed Score | X/100 | X/100 | [+/-X] |
| 📈 Uptime | XX.X% | XX.X% | [+/-X%] |
| 📝 Content Published | X items | X items | [+/-X] |

### Attention Required
- [0-3 bullet points of urgent items in plain language]

### Recent Improvements
- [1-3 bullet points of completed improvements]

### Next Steps
- [1-3 bullet points of planned work]
```

## Report Delivery Schedule

| Report | Frequency | Audience | Channel |
|--------|-----------|----------|---------|
| Daily Health | Every morning | DevOps / Site admin | Email / Slack |
| Weekly Performance | Monday morning | Development team | Email |
| Monthly Security | 1st of month | Security team + Management | Email + document |
| Quarterly Trend | End of quarter | Executive / Stakeholders | PDF / presentation |
